import { PwaMetadata } from "../types";

const GITHUB_API_BASE = "https://api.github.com";

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
        `${GITHUB_API_BASE}/repos/${config.owner}/${config.repo}/dispatches`,
        {
            method: "POST",
            headers: {
                Accept: "application/vnd.github.v3+json",
                Authorization: `token ${config.token}`,
            },
            body: JSON.stringify({
                event_type: "build-apk",
                client_payload: {
                    url: originalUrl,
                    package_name: metadata.packageName,
                    name: metadata.name,
                },
            }),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to trigger build: ${response.status} ${errorText}`);
    }
};

export const getLatestWorkflowRun = async (
    config: GithubConfig
): Promise<any> => {
    // Wait a moment for the dispatch to propagate
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const response = await fetch(
        `${GITHUB_API_BASE}/repos/${config.owner}/${config.repo}/actions/runs?event=repository_dispatch&per_page=1`,
        {
            headers: {
                Accept: "application/vnd.github.v3+json",
                Authorization: `token ${config.token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch workflow runs");
    }

    const data = await response.json();
    return data.workflow_runs[0];
};

export const getArtifactsForRun = async (
    config: GithubConfig,
    runId: number
): Promise<any[]> => {
    const response = await fetch(
        `${GITHUB_API_BASE}/repos/${config.owner}/${config.repo}/actions/runs/${runId}/artifacts`,
        {
            headers: {
                Accept: "application/vnd.github.v3+json",
                Authorization: `token ${config.token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch artifacts");
    }

    const data = await response.json();
    return data.artifacts;
};
