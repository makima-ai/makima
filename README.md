# makima

A Web based Agent Framework

## Setup

### Prerequisites

- [Bun](https://bun.sh) (v1.1.34 or later)
- Docker
- Git

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/makima-ai/makima.git
   cd makima
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

### Environment Configuration

1. Create a `.env` file in the project root with the following content:

   ```
   OPENAI_API_KEY=sk-proj-xxx
   DATABASE_URL=postgresql://postgres:12345678@localhost:5432/postgres
   PORT=7777
   ```

   Replace `sk-proj-xxx` with your actual OpenAI API key.

2. Start the development PostgreSQL server:

   ```bash
   docker compose -f dev-docker-compose.yml up -d
   ```

3. update the database schema from project to the newly started db instance.
   ```bash
   bunx drizzle-kit push
   ```

### Setting up the Tools Server

1. Clone the tools server repository:

   ```bash
   git clone git@github.com:makima-ai/tools-server.git
   cd tools-server
   ```

2. Follow the setup instructions in the [tools-server](https://github.com/makima-ai/tools-server) project README.

## Usage

### Starting the Server

Run the following command in the makima project root:

```bash
bun run index.ts
```

### Initial Setup

Use the following curl commands to set up your environment:

1. Create a test thread:

   ```bash
   curl --request POST \
     --url http://localhost:7777/thread/create \
     --header 'Content-Type: application/x-www-form-urlencoded' \
     --data id=test \
     --data platform=api \
     --data agentName=test-agent
   ```

2. Create a test agent:

   ```bash
   curl --request POST \
     --url http://localhost:7777/agent/create \
     --header 'Content-Type: application/json' \
     --data '{
     "name": "test-agent",
     "description": "A compact AI assistant powered by GPT4O-Mini",
     "prompt": "You are a helpful AI assistant using the GPT4O-Mini model. Provide concise and accurate responses to user queries.",
     "primaryModel": "openai/gpt-4o-mini",
     "fallbackModels": []
   }'
   ```

3. Verify tool registration:
   Ensure the tools server is running. It will automatically register its tools with the makima server. To check registered tools:

   ```bash
   curl --request GET \
     --url http://localhost:7777/tool/ \
     --header 'Content-Type: application/json'
   ```

4. Add a tool to your test agent:

   ```bash
   curl --request POST \
     --url http://localhost:7777/agent/[AGENT_NAME]/add-tool/[TOOL_NAME]
   ```

   Replace `[AGENT_NAME]` and `[TOOL_NAME]` with the respective IDs. To get these IDs:

   For agents:

   ```bash
   curl --request GET \
     --url http://localhost:7777/agent/ \
     --header 'Content-Type: application/json'
   ```

   For tools:

   ```bash
   curl --request GET \
     --url http://localhost:7777/tool/ \
     --header 'Content-Type: application/json'
   ```

### Testing Inference

To test the inference flow:

```bash
curl --request POST \
  --url http://localhost:7777/thread/test/chat \
  --header 'Content-Type: application/json' \
  --data '{
  "message": {
    "role": "human",
    "content": "hey, whats the time",
    "name":"raj"
  }
}'
```

You should receive a response similar to:

```json
{
  "role": "ai",
  "name": "assistant",
  "content": "The current date and time is **November 10, 2024, 11:16:26 PM**."
}
```
