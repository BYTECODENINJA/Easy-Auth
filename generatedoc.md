Act as an Expert Technical Writer and Senior Backend Engineer. Your task is to thoroughly analyze the current backend codebase and generate a comprehensive, production-ready `README.md` file.

Before generating the documentation, please perform a deep analysis of the codebase:
1. Identify the language, frameworks, and dependencies from the manifest files (e.g., package.json, requirements.txt, go.mod, pom.xml).
2. Analyze the directory tree to understand the project structure.
3. Read the main entry points, configuration files, and environment setups.
4. Inspect the routing, controllers, and core business logic to understand the API endpoints and internal functions.

Once your analysis is complete, generate the `README.md` using strict Markdown formatting. The documentation must include the following sections in this exact order:

### 1. Project Overview
* A compelling, high-level summary of what this backend does, the problem it solves, and its primary use cases.
* Key highlights or unique selling points of the architecture.

### 2. Tech Stack
* A clean, bulleted list or table of the technologies used (Language, Framework, Database, ORM, Message Brokers, Caching, etc.).

### 3. Architecture & Flow (Mermaid Diagrams)
* **System Architecture:** Generate a Mermaid diagram showing the high-level system components, external services, and database interactions.
* **Core Flow:** Generate a Mermaid sequence diagram illustrating the flow of a primary feature (e.g., User Authentication, Data Processing, or the main CRUD operation).
* *Constraint:* Ensure all Mermaid syntax is perfectly valid and enclosed in ```mermaid code blocks.

### 4. Project Structure
* Provide a visual tree representation of the file/folder structure (using standard tree formatting).
* Add a brief 1-sentence description next to each major directory explaining its purpose (e.g., `/controllers - Handles HTTP requests and responses`).

### 5. Core Functions & API Endpoints
* **API Endpoints:** List the primary REST/GraphQL endpoints. For each, include the HTTP method, path, a brief description, and expected request/response payloads (use JSON code blocks).
* **Internal Functions/Services:** Explain the core business logic functions. Describe what the function does, its inputs, its outputs, and how it interacts with the database or external services.

### 6. Getting Started (Local Development)
Provide clear, step-by-step instructions for a new developer to run the project locally:
* **Prerequisites:** Required software versions (Node, Python, Docker, etc.).
* **Installation:** Commands to clone the repo and install dependencies.
* **Environment Setup:** Instructions on how to configure the `.env` file.
* **Database Setup:** Commands to run migrations, seed data, or start local DB containers (e.g., Docker Compose).
* **Running the App:** The exact command to start the development server.

### 7. Environment Variables
* Create a table detailing all required environment variables.
* Columns should include: `Variable Name`, `Description`, `Required (Y/N)`, and `Example Value`. (Extract these from `.env.example`, config files, or code).

### 8. Testing
* Explain the testing strategy (Unit, Integration, E2E).
* Provide the exact commands to run the test suites, generate coverage reports, and run linting/formatting checks.

### 9. Deployment & CI/CD (If applicable)
* Briefly explain how the application is deployed (e.g., Docker, Kubernetes, AWS, Vercel).
* Mention any CI/CD pipelines (GitHub Actions, GitLab CI) and what they do (e.g., "Runs tests on PR, deploys to staging on merge to main").

### 10. Contributing & License
* Standard guidelines for contributing (branching strategy, PR process, commit message conventions).
* License information.

### STRICT GUIDELINES FOR GENERATION:
* **No Hallucinations:** Only document what actually exists in the codebase. If a specific feature (like CI/CD) isn't present, omit the section or explicitly state it is "Not yet configured".
* **Accuracy:** Ensure all CLI commands, file paths, and code snippets exactly match the codebase.
* **Tone:** Professional, concise, and developer-friendly. Avoid fluff.
* **Formatting:** Use proper Markdown headers (H1 for title, H2 for main sections, H3 for subsections), bold text for emphasis, and code blocks for all commands and code snippets.

Take a deep breath, analyze the codebase thoroughly, and output only the final, polished `README.md` content.