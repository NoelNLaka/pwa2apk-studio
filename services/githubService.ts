import { PwaMetadata } from "../types";

// Use relative URLs for API calls (will use Vercel serverless functions)
const API_BASE = "/api";

interface GithubConfig {
    token: string;
    owner: string;
    repo: string;
}

export const triggerGithubBuild = async (
    config: GithubConfig,
    metadata: PwaMetadata,
    originalUrl: string
): Promise<void> => {
    const response = await fetch(
        `${API_BASE}/trigger-build`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token: config.token,
                owner: config.owner,
                repo: config.repo,
                metadata: metadata,
                url: originalUrl,
            }),
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to trigger build: ${response.status}`);
    }
};

export const getLatestWorkflowRun = async (
    config: GithubConfig
): Promise<any> => {
    // Wait a moment for the dispatch to propagate
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const response = await fetch(
        `${API_BASE}/get-workflow-run?token=${encodeURIComponent(config.token)}&owner=${encodeURIComponent(config.owner)}&repo=${encodeURIComponent(config.repo)}`,
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch workflow runs' }));
        throw new Error(errorData.error || "Failed to fetch workflow runs");
    }

    const data = await response.json();
    return data.workflow_runs[0];
};

export const getArtifactsForRun = async (
    config: GithubConfig,
    runId: number
): Promise<any[]> => {
    const response = await fetch(
        `${API_BASE}/get-artifacts?token=${encodeURIComponent(config.token)}&owner=${encodeURIComponent(config.owner)}&repo=${encodeURIComponent(config.repo)}&runId=${runId}`,
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch artifacts' }));
        throw new Error(errorData.error || "Failed to fetch artifacts");
    }

    const data = await response.json();
    return data.artifacts;
};
