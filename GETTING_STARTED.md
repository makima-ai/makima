# Getting Started with Makima

Welcome to Makima, a powerful web-based Agent Framework for building and managing AI-powered conversational agents. This guide will help you set up and start using Makima quickly.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Bun](https://bun.sh) (v1.1.34 or later)
- Docker
- Git

## Installation

1. Clone the repository:

```shellscript
git clone https://github.com/makima-ai/makima.git
cd makima
```

2. Install dependencies:

```shellscript
bun install
```

## Configuration

1. Copy the example environment file:

```shellscript
cp .env.example .env
```

2. Open the `.env` file in your preferred text editor and configure the following variables:

```plaintext
OPENAI_API_KEY=sk-proj-xxx  # OpenAI key if you want to use OpenAI as a provider (optional)
DATABASE_URL=postgresql://postgres:12345678@localhost:5432/postgres  # Required
PORT=7777  # Will default to this port if not specified
OLLAMA_HOST=https://ollama.example.com  # Will default to local if not specified (optional)
PGVECTOR_URL=postgresql://postgres:12345678@localhost:5433/postgres  # Required if you want to use pgvector for knowledge base provider
SWAGGER_SERVER_URL=http://localhost:7777  # Default server to show on the Swagger UI
```

Adjust these values according to your setup and requirements.

3. Start the development PostgreSQL server and PGVector server for the development knowledge-base provider:

```shellscript
docker compose -f dev-docker-compose.yml up -d
```

4. Update the database schema:

```shellscript
bunx drizzle-kit push
```

## Running Makima

Start the server with:

```shellscript
bun run index.ts
```

Verify the installation by opening your browser and navigating to `http://localhost:7777/docs`. You should see the Makima API documentation.

## Basic Usage

### Creating Your First Agent

To create a new agent, use the following curl command:

```shellscript
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

### Starting a Conversation

To start a conversation with your agent, use the following curl command:

```shellscript
curl --request POST \
  --url http://localhost:7777/thread/create \
  --header 'Content-Type: application/json' \
  --data '{
    "id": "my-first-thread",
    "platform": "curl",
    "agentName": "my-first-agent"
  }'
```

This will create a new thread. You can then send messages to this thread:

```shellscript
curl --request POST \
  --url http://localhost:7777/thread/my-first-thread/chat \
  --header 'Content-Type: application/json' \
  --data '{
    "message": {
      "role": "human",
      "name": "user",
      "content": "Hello, can you help me with a task?"
    }
  }'
```

## Next Steps

- Explore the [API Documentation](docs/api/) for more detailed information on available endpoints and features.
- Learn about [Concepts](docs/concepts.md) to understand the core components of Makima.
- Dive into the specific API documentation for [Agents](docs/api/agents.md), [Threads](docs/api/threads.md), [Knowledge Bases](docs/api/knowledge_bases.md), and [Tools](docs/api/tools.md) to make the most of Makima's capabilities.

Congratulations! You've now set up Makima and created your first agent. Happy building!
