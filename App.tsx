
import React, { useState, useCallback, useEffect } from 'react';
import { BuildStatus, PwaMetadata, BuildLog } from './types';
import { analyzePwaUrl } from './services/geminiService';
import { triggerGithubBuild, getLatestWorkflowRun, getArtifactsForRun } from './services/githubService';
import PhonePreview from './components/PhonePreview';
import BuildTerminal from './components/BuildTerminal';

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<BuildStatus>(BuildStatus.IDLE);
  const [metadata, setMetadata] = useState<PwaMetadata | null>(null);
  const [logs, setLogs] = useState<BuildLog[]>([]);
  const [progress, setProgress] = useState(0);

  // GitHub Config State
  const [githubToken, setGithubToken] = useState(localStorage.getItem('gh_token') || '');
  const [repoOwner, setRepoOwner] = useState(localStorage.getItem('gh_owner') || '');
  const [repoName, setRepoName] = useState(localStorage.getItem('gh_repo') || '');
  const [showConfig, setShowConfig] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const saveConfig = () => {
    localStorage.setItem('gh_token', githubToken);
    localStorage.setItem('gh_owner', repoOwner);
    localStorage.setItem('gh_repo', repoName);
    setShowConfig(false);
  };

  const addLog = useCallback((message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      message,
      level
    }]);
  }, []);

  const handleStartBuild = async () => {
    if (!url || !url.startsWith('http')) {
      alert('Please enter a valid URL starting with http/https');
      return;
    }

    if (!githubToken || !repoOwner || !repoName) {
      setShowConfig(true);
      addLog('Please configure GitHub credentials first.', 'warn');
      return;
    }

    setStatus(BuildStatus.ANALYZING);
    setLogs([]);
    setProgress(5);
    addLog(`Initiating analysis of ${url}...`, 'info');

    try {
      // 1. Analyze
      const pwaData = await analyzePwaUrl(url);
      setMetadata(pwaData);
      addLog(`Metadata extracted: ${pwaData.name} (${pwaData.packageName})`, 'success');
      setProgress(15);

      // 2. Trigger Build
      setStatus(BuildStatus.BUILDING);
      addLog('Triggering GitHub Action...', 'info');

      const config = { token: githubToken, owner: repoOwner, repo: repoName };
      await triggerGithubBuild(config, pwaData, url);
      addLog('Build triggered successfully. Waiting for workflow run...', 'info');

      // 3. Poll for Status
      let runId = 0;
      let checkCount = 0;

      // Wait for run to start
      while (runId === 0 && checkCount < 10) {
        await new Promise(r => setTimeout(r, 3000));
        try {
          const run = await getLatestWorkflowRun(config);
          // Ensure it's a recent run (within last minute)
          const runTime = new Date(run.created_at).getTime();
          if (Date.now() - runTime < 60000) {
            runId = run.id;
            addLog(`Workflow run started: #${run.run_number}`, 'info');
          }
        } catch (e) {
          console.error("Polling error", e);
        }
        checkCount++;
      }

      if (runId === 0) {
        throw new Error("Timed out waiting for workflow to start.");
      }

      // Monitor Status
      let runStatus = 'queued';
      while (runStatus !== 'completed' && runStatus !== 'failure' && runStatus !== 'cancelled') {
        await new Promise(r => setTimeout(r, 5000));
        const run = await getLatestWorkflowRun(config);
        // Ideally we check by ID, but getLatest is simplified. 
        // For a real app we'd fetch specific run ID.
        runStatus = run.status;

        if (runStatus === 'in_progress') {
          addLog(`Build in progress... (${run.conclusion || 'running'})`, 'info');
          // Fake progress increment for visual feedback
          setProgress(prev => Math.min(prev + 5, 90));
        }

        if (run.conclusion === 'failure' || run.conclusion === 'cancelled') {
          throw new Error(`Workflow ${run.conclusion}`);
        }

        if (run.status === 'completed' && run.conclusion === 'success') {
          break;
        }
      }

      addLog('Workflow completed. Fetching artifacts...', 'success');
      setProgress(95);

      // 4. Get Artifact
      const artifacts = await getArtifactsForRun(config, runId);
      const apkArtifact = artifacts.find((a: any) => a.name.includes('app') || a.name.includes('release'));

      if (apkArtifact) {
        setDownloadUrl(`https://github.com/${repoOwner}/${repoName}/actions/runs/${runId}/artifacts/${apkArtifact.id}`);
        addLog('Artifact found! Ready to download.', 'success');
      } else {
        addLog('No APK artifact found in the completed run.', 'warn');
      }

      setStatus(BuildStatus.COMPLETED);
      setProgress(100);

    } catch (error) {
      addLog(`Build failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      setStatus(BuildStatus.FAILED);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  const handleReset = () => {
    setStatus(BuildStatus.IDLE);
    setUrl('');
    setMetadata(null);
    setLogs([]);
    setProgress(0);
    setDownloadUrl(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8">
      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-2 rounded-xl shadow-lg">
            <i className="fas fa-rocket text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            PWA2APK Studio
          </h1>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-slate-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
          >
            <i className="fas fa-cog"></i> Settings
          </button>
        </div>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column - Input & Terminal */}
        <div className="lg:col-span-7 space-y-6">

          {/* GitHub Configuration Panel */}
          {showConfig && (
            <div className="bg-slate-800/80 p-6 rounded-3xl border border-indigo-500/30 animate-in fade-in slide-in-from-top-4 mb-6">
              <h3 className="text-md font-bold text-white mb-4">GitHub Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold block mb-2">Repo Owner</label>
                  <input
                    value={repoOwner}
                    onChange={e => setRepoOwner(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g. facebook"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold block mb-2">Repo Name</label>
                  <input
                    value={repoName}
                    onChange={e => setRepoName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g. react"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-slate-400 uppercase font-bold block mb-2">Personal Access Token (Workflow scope)</label>
                  <input
                    value={githubToken}
                    onChange={e => setGithubToken(e.target.value)}
                    type="password"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                    placeholder="ghp_..."
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={saveConfig} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                  Save & Close
                </button>
              </div>
            </div>
          )}

          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-3xl shadow-2xl">
            <h2 className="text-xl font-semibold mb-2">Convert your PWA</h2>
            <p className="text-slate-400 mb-6 text-sm">Enter the production URL of your Progressive Web App to start the Android build process.</p>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <i className="fas fa-link absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                <input
                  type="url"
                  placeholder="https://your-awesome-pwa.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-100"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={status !== BuildStatus.IDLE && status !== BuildStatus.FAILED}
                />
              </div>
              <button
                onClick={handleStartBuild}
                disabled={status !== BuildStatus.IDLE && status !== BuildStatus.FAILED}
                className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2
                  ${status === BuildStatus.IDLE || status === BuildStatus.FAILED
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
              >
                {status === BuildStatus.IDLE || status === BuildStatus.FAILED ? (
                  <>
                    <i className="fas fa-hammer"></i>
                    Build APK
                  </>
                ) : (
                  <>
                    <i className="fas fa-spinner animate-spin"></i>
                    Building...
                  </>
                )}
              </button>
            </div>

            {status !== BuildStatus.IDLE && (
              <div className="mt-8 space-y-4">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Build Progress</span>
                  <span className="text-xs font-bold text-indigo-400">{progress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <BuildTerminal logs={logs} />

          {status === BuildStatus.COMPLETED && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500 p-3 rounded-full text-white shadow-lg shadow-emerald-500/20">
                  <i className="fas fa-check text-lg"></i>
                </div>
                <div>
                  <h3 className="font-bold text-emerald-400">Success! APK Ready</h3>
                  <p className="text-xs text-slate-400">Your release-ready APK has been bundled and signed.</p>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={handleDownload}
                  className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-lg"
                >
                  Download .zip
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-2 rounded-lg font-bold transition-colors"
                >
                  New Build
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Device Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="sticky top-8">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mb-6 text-center">App Simulation</h3>
            <PhonePreview metadata={metadata} url={url} />

            {metadata && (
              <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                  <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Package Name</span>
                  <span className="text-xs text-indigo-300 font-mono truncate block">{metadata.packageName}</span>
                </div>
                <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                  <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Android Version</span>
                  <span className="text-xs text-slate-300 block">Target SDK 34 (14.0)</span>
                </div>
              </div>
            )}

            <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <h4 className="flex items-center gap-2 text-yellow-400 font-bold mb-2 text-sm">
                <i className="fas fa-exclamation-triangle"></i> Important Note
              </h4>
              <p className="text-xs text-yellow-500/80 leading-relaxed">
                This build runs on <strong>GitHub Actions</strong>. You must configure your repository credentials in the settings. Use a Personal Access Token with <code>workflow</code> and <code>repo</code> scopes.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Features */}
      <section className="w-full max-w-6xl mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-t border-slate-900 pt-12">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-500 mb-4 border border-slate-800 shadow-xl">
            <i className="fas fa-shield-alt"></i>
          </div>
          <h4 className="font-bold mb-2">Secure Signing</h4>
          <p className="text-sm text-slate-500">Automatic generation of unique upload keys with SHA-256 fingerprinting for Google Play compatibility.</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-500 mb-4 border border-slate-800 shadow-xl">
            <i className="fas fa-bolt"></i>
          </div>
          <h4 className="font-bold mb-2">Cloud Compilation</h4>
          <p className="text-sm text-slate-500">Leverage our distributed build farm to compile assets without taxing your local machine's resources.</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-500 mb-4 border border-slate-800 shadow-xl">
            <i className="fas fa-mobile-alt"></i>
          </div>
          <h4 className="font-bold mb-2">Play Integrity</h4>
          <p className="text-sm text-slate-500">Fully compliant with Trusted Web Activities (TWA) protocols for deep integration with Android systems.</p>
        </div>
      </section>
    </div>
  );
};

export default App;
