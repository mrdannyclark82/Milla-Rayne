# Fara Integration with Milla-Rayne

This document provides instructions for setting up and using the Fara Computer Use Agent (CUA) integration with Milla-Rayne.

## Overview

Milla-Rayne can now leverage Fara's web automation capabilities. You can initiate web automation tasks directly from the Milla-Rayne chat interface using the `/fara <task>` command.

## Setup Instructions

To ensure Fara integration works correctly, please follow these steps:

1.  **Ensure Node.js Version**:
    Make sure your Node.js version is **20 or higher**. If not, please upgrade your Node.js installation using `nvm` or your preferred method.

    Example using `nvm`:
    ```bash
    nvm install 20
    nvm use 20
    ```

2.  **Rebuild Milla-Rayne**:
    Navigate to the root directory of your Milla-Rayne project and run the following commands:
    ```bash
    npm install
    npm run build
    ```

3.  **Start Milla-Rayne Server**:
    Start the Milla-Rayne server. Upon starting, the Fara service will attempt to set up its Python environment and launch the `vllm` model server in the background.
    ```bash
    npm run start
    ```
    Please monitor the server console for any errors during this process.

4.  **Verify Fara Python Setup (if auto-setup fails or for first-time use)**:
    If you encounter issues with Fara's Python environment or if the `vllm` server does not start automatically, you may need to set it up manually.
    Navigate to the `fara_repo` directory (which was cloned into your Milla-Rayne project root) and run the following commands:
    ```bash
    cd fara_repo
    python3 -m venv .venv
    ./.venv/bin/pip install -e .
    ./.venv/bin/playwright install
    ./.venv/bin/pip install vllm
    ```

5.  **Start Fara vLLM Server Manually (if auto-start fails or for troubleshooting)**:
    If Milla-Rayne's auto-start of the `vllm` server fails, you can start it manually in a separate terminal. **Note that the Fara vLLM server now runs on port 5001 to avoid conflict with the Milla-Rayne server.**
    From within the `fara_repo` directory:
    ```bash
    ./.venv/bin/vllm serve "microsoft/Fara-7B" --port 5001 --dtype auto &
    ```
    *(The `&` at the end will run the command in the background. You can omit it if you want to see the output in the terminal.)*

## Usage

Once Milla-Rayne and the Fara `vllm` server (either automatically or manually started) are running:

*   **Initiate Fara Tasks**:
    In the Milla-Rayne chat interface, use the `/fara <task>` command.
    Example: `/fara search for pizza places near me`

*   **Gemini Web Search**:
    Gemini will autonomously decide when to perform web searches (using services like Perplexity or Wolfram Alpha) to answer your queries.
    Example: "What's the capital of France?" or "What are the latest news headlines?"

## Troubleshooting

*   **Port Conflict**: Ensure no other application is using port 5000 (for Milla-Rayne) or port 5001 (for Fara vLLM server).
*   **Python Environment**: Verify that the Python virtual environment in `fara_repo/.venv` is correctly set up and that `vllm` and `fara-cli` are accessible within it.
*   **API Keys**: Ensure your necessary API keys (e.g., Gemini, Perplexity, Wolfram Alpha) are correctly configured in Milla-Rayne's `.env` file.
