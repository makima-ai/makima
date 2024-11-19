# Makima

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Makima is a powerful, web-based Agent Framework designed for building and managing AI-powered conversational agents. It provides a flexible and extensible architecture for creating, deploying, and interacting with AI agents through a RESTful API.

## Features

- 🤖 Create and manage AI agents with customizable prompts and models
- 🧵 Handle threaded conversations for complex interactions
- 🛠 Integrate custom tools to extend agent capabilities
- 🔄 Support for multiple AI models with fallback options
- 🌐 RESTful API for seamless integration with various platforms
- 🔒 Secure and scalable architecture

## Prerequisites

- [Bun](https://bun.sh) (v1.1.34 or later)
- Docker
- Git

## Quick Start

1. Clone the repository:

   ```bash
   git clone https://github.com/makima-ai/makima.git
   cd makima
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Set up your environment:

   - Copy `.env.example` to `.env` and fill in your configuration details
   - Start the development PostgreSQL server:
     ```bash
     docker compose -f dev-docker-compose.yml up -d
     ```
   - Update the database schema:
     ```bash
     bunx drizzle-kit push
     ```

4. Start the server:
   ```bash
   bun run index.ts
   ```

## Usage

After starting the server, you can interact with the Makima API to create agents, manage threads, and integrate tools. Here's a basic example of creating a new agent:

```bash
curl --request POST \
  --url http://localhost:7777/agent/create \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "my-first-agent",
    "description": "A helpful AI assistant",
    "prompt": "You are a friendly AI assistant. Provide concise and accurate responses.",
    "primaryModel": "openai/gpt-4o-mini",
    "fallbackModels": []
  }'
```

For more examples and detailed API documentation, check out our [API Reference](docs/api.md).

## Documentation

- [API Reference](docs/api.md)
- [Creating Agents](docs/agent.md)
- [Managing Threads](docs/thread.md)
- [Integrating Tools](docs/tool.md)

## License

Makima is open-source software licensed under the [MIT license](LICENSE).

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/makima-ai/makima/issues) on our GitHub repository.
