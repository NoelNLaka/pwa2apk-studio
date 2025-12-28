<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PWA2APK Studio

Convert Progressive Web Apps (PWAs) into native Android APK files using GitHub Actions and Bubblewrap.

View your app in AI Studio: https://ai.studio/apps/drive/10Fyl3DykPt05SIP0LdQbYStYhDQst85I

## Features

- Convert any PWA URL into an Android APK
- Automated builds using GitHub Actions
- AI-powered metadata extraction with Gemini API
- Real-time build status monitoring
- Phone preview simulation

## Prerequisites

- Node.js (v18 or higher)
- GitHub Personal Access Token with `workflow` and `repo` scopes
- (Optional) Google Gemini API Key for AI-powered metadata extraction

## Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Set the `VITE_GOOGLE_API_KEY` environment variable to your Gemini API key:
   ```bash
   echo "VITE_GOOGLE_API_KEY=your_api_key_here" > .env.local
   ```
   Note: If not set, the app will use fallback metadata extraction based on the URL.

3. Run the development server:
   ```bash
   npm run dev
   ```

## Deploy to Vercel

This app requires serverless functions to proxy GitHub API calls and avoid CORS issues.

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/pwa2apk-studio)

### Manual Deployment

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow the prompts to complete deployment

## Configuration

After deploying or running locally, configure the app with your GitHub credentials:

1. Click the "Settings" button in the top right
2. Enter your GitHub repository details:
   - **Repo Owner**: Your GitHub username or organization
   - **Repo Name**: The repository name (must have the GitHub Action workflow)
   - **Personal Access Token**: GitHub token with `workflow` and `repo` scopes

3. Click "Save & Close"

## Creating a GitHub Token

1. Go to https://github.com/settings/tokens/new
2. Give it a name (e.g., "PWA2APK Studio")
3. Select scopes:
   - `workflow` - Required to trigger Actions
   - `repo` - Required to access repository
4. Click "Generate token"
5. Copy the token (you won't be able to see it again)

## GitHub Actions Setup

The repository must have a GitHub Actions workflow that responds to `repository_dispatch` events. This repository includes the workflow at `.github/workflows/build_apk.yml`.

To use this in your own repository:

1. Fork or copy this repository
2. Ensure the workflow file exists at `.github/workflows/build_apk.yml`
3. The workflow will trigger automatically when you build an APK through the UI

## How It Works

1. **PWA Analysis**: Enter a PWA URL and the app analyzes it (using Gemini AI if available, or fallback extraction)
2. **GitHub Action Trigger**: The app triggers a GitHub Actions workflow via serverless function
3. **APK Build**: GitHub Actions uses Bubblewrap to create a Trusted Web Activity (TWA) APK
4. **Status Monitoring**: The app polls for build status and completion
5. **Download**: Once complete, download the APK artifact from GitHub

## Architecture

- **Frontend**: React + TypeScript + Vite
- **API**: Vercel Serverless Functions (in `/api` directory)
- **Build**: GitHub Actions + Bubblewrap CLI
- **AI**: Google Gemini API (optional, with fallback)

## Troubleshooting

**"Failed to fetch" error**: This was fixed by adding serverless functions. Make sure you're deploying to Vercel or a platform that supports serverless functions.

**"Invalid token" error**: Ensure your GitHub token has both `workflow` and `repo` scopes.

**Workflow not triggering**: Verify the `.github/workflows/build_apk.yml` file exists in your repository and the `repository_dispatch` event type is set to `build-apk`.
