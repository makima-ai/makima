# Makima API Reference

This document provides a comprehensive guide to the Makima API endpoints. The API is organized around three main resources: Threads, Agents, and Tools.

## Base URL

All API requests should be made to:

```
http://localhost:7777
```

## Threads

### Get All Threads

Retrieves all threads in the system.

- **URL**: `/thread/`
- **Method**: `GET`
- **Query Parameters**:
  - `name` (optional): Filter threads by name

#### Example Request

```bash
curl --request GET \
  --url 'http://localhost:7777/thread/?name=example'
```

#### Response

A JSON array of thread objects.

### Get Thread by ID

Retrieves a specific thread by its ID.

- **URL**: `/thread/{id}`
- **Method**: `GET`
- **URL Parameters**:
  - `id` (required): The ID of the thread

#### Example Request

```bash
curl --request GET \
  --url 'http://localhost:7777/thread/123456'
```

#### Response

A JSON object containing the thread details.

### Create a New Thread

Creates a new thread.

- **URL**: `/thread/create`
- **Method**: `POST`
- **Body**:

```json
{
  "id": "string",
  "platform": "string",
  "description": "string",
  "authors": ["string"],
  "agentName": "string"
}
```

#### Example Request

```bash
curl --request POST \
  --url 'http://localhost:7777/thread/create' \
  --header 'Content-Type: application/json' \
  --data '{
    "id": "thread-123",
    "platform": "web",
    "description": "Example thread",
    "authors": ["user1"],
    "agentName": "helper-agent"
  }'
```

#### Response

A JSON object confirming the creation of the thread.

### Add Message to Thread

Adds a message to an existing thread.

- **URL**: `/thread/{id}/message`
- **Method**: `POST`
- **URL Parameters**:
  - `id` (required): The ID of the thread
- **Body**:

```json
{
  "role": "human",
  "name": "string",
  "content": "string",
  "authorId": "string"
}
```

#### Example Request

```bash
curl --request POST \
  --url 'http://localhost:7777/thread/thread-123/message' \
  --header 'Content-Type: application/json' \
  --data '{
    "role": "human",
    "name": "User",
    "content": "Hello, how are you?",
    "authorId": "user1"
  }'
```

#### Response

A JSON object confirming the addition of the message.

### Thread Inference (Chat)

Performs inference on a thread with the provided message.

- **URL**: `/thread/{id}/chat`
- **Method**: `POST`
- **URL Parameters**:
  - `id` (required): The ID of the thread
- **Body**:

```json
{
  "agentName": "string",
  "message": {
    "role": "human",
    "name": "string",
    "content": "string"
  }
}
```

#### Example Request

```bash
curl --request POST \
  --url 'http://localhost:7777/thread/thread-123/chat' \
  --header 'Content-Type: application/json' \
  --data '{
    "agentName": "helper-agent",
    "message": {
      "role": "human",
      "name": "User",
      "content": "What's the weather like today?"
    }
  }'
```

#### Response

A JSON object containing the AI's response.

## Agents

### Get All Agents

Retrieves all agents in the system.

- **URL**: `/agent/`
- **Method**: `GET`

#### Example Request

```bash
curl --request GET \
  --url 'http://localhost:7777/agent/'
```

#### Response

A JSON array of agent objects.

### Get Agent by Name

Retrieves a specific agent by its name.

- **URL**: `/agent/{name}`
- **Method**: `GET`
- **URL Parameters**:
  - `name` (required): The name of the agent

#### Example Request

```bash
curl --request GET \
  --url 'http://localhost:7777/agent/helper-agent'
```

#### Response

A JSON object containing the agent details.

### Create a New Agent

Creates a new agent.

- **URL**: `/agent/create`
- **Method**: `POST`
- **Body**:

```json
{
  "name": "string",
  "description": "string",
  "prompt": "string",
  "primaryModel": "string",
  "fallbackModels": ["string"]
}
```

#### Example Request

```bash
curl --request POST \
  --url 'http://localhost:7777/agent/create' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "weather-agent",
    "description": "An agent that provides weather information",
    "prompt": "You are a helpful weather assistant. Provide accurate weather information.",
    "primaryModel": "openai/gpt-4",
    "fallbackModels": ["openai/gpt-3.5-turbo"],
  }'
```

#### Response

A JSON object confirming the creation of the agent.

### Update an Agent

Updates an existing agent.

- **URL**: `/agent/{name}`
- **Method**: `PUT`
- **URL Parameters**:
  - `name` (required): The name of the agent
- **Body**: Same as the create agent body

#### Example Request

```bash
curl --request PUT \
  --url 'http://localhost:7777/agent/weather-agent' \
  --header 'Content-Type: application/json' \
  --data '{
    "description": "An updated weather agent",
    "prompt": "You are an expert weather assistant. Provide detailed and accurate weather information.",
    "primaryModel": "openai/gpt-4",
    "fallbackModels": ["openai/gpt-3.5-turbo"],
  }'
```

#### Response

A JSON object confirming the update of the agent.

### Delete an Agent

Deletes an agent.

- **URL**: `/agent/{name}`
- **Method**: `DELETE`
- **URL Parameters**:
  - `name` (required): The name of the agent

#### Example Request

```bash
curl --request DELETE \
  --url 'http://localhost:7777/agent/weather-agent'
```

#### Response

A JSON object confirming the deletion of the agent.

### Add Tool to Agent

Adds a tool to an existing agent.

- **URL**: `/agent/{agentName}/add-tool/{toolName}`
- **Method**: `POST`
- **URL Parameters**:
  - `agentName` (required): The name of the agent
  - `toolName` (required): The name of the tool to add

#### Example Request

```bash
curl --request POST \
  --url 'http://localhost:7777/agent/weather-agent/add-tool/satellite-imagery'
```

#### Response

A JSON object confirming the addition of the tool to the agent.

### Remove Tool from Agent

Removes a tool from an existing agent.

- **URL**: `/agent/{agentName}/remove-tool/{toolName}`
- **Method**: `POST`
- **URL Parameters**:
  - `agentName` (required): The name of the agent
  - `toolName` (required): The name of the tool to remove

#### Example Request

```bash
curl --request POST \
  --url 'http://localhost:7777/agent/weather-agent/remove-tool/satellite-imagery'
```

#### Response

A JSON object confirming the removal of the tool from the agent.

## Tools

### Get All Tools

Retrieves all tools in the system.

- **URL**: `/tool/`
- **Method**: `GET`

#### Example Request

```bash
curl --request GET \
  --url 'http://localhost:7777/tool/'
```

#### Response

A JSON array of tool objects.

### Get Tool by Name

Retrieves a specific tool by its name.

- **URL**: `/tool/{name}`
- **Method**: `GET`
- **URL Parameters**:
  - `name` (required): The name of the tool

#### Example Request

```bash
curl --request GET \
  --url 'http://localhost:7777/tool/weather-api'
```

#### Response

A JSON object containing the tool details.

### Create a New Tool

Creates a new tool.

- **URL**: `/tool/create`
- **Method**: `POST`
- **Body**:

```json
{
  "name": "string",
  "description": "string",
  "params": {},
  "endpoint": "string",
  "method": "string"
}
```

#### Example Request

```bash
curl --request POST \
  --url 'http://localhost:7777/tool/create' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "weather-api",
    "description": "Provides current weather information",
    "params": {
      "location": "string",
      "units": "string"
    },
    "endpoint": "https://api.weather.com/current",
    "method": "GET"
  }'
```

#### Response

A JSON object confirming the creation of the tool.

### Update a Tool

Updates an existing tool.

- **URL**: `/tool/{name}`
- **Method**: `PUT`
- **URL Parameters**:
  - `name` (required): The name of the tool
- **Body**: Same as the create tool body

#### Example Request

```bash
curl --request PUT \
  --url 'http://localhost:7777/tool/weather-api' \
  --header 'Content-Type: application/json' \
  --data '{
    "description": "Provides detailed current weather information",
    "params": {
      "location": "string",
      "units": "string",
      "lang": "string"
    },
    "endpoint": "https://api.weather.com/v2/current",
    "method": "GET"
  }'
```

#### Response

A JSON object confirming the update of the tool.

### Delete a Tool

Deletes a tool.

- **URL**: `/tool/{name}`
- **Method**: `DELETE`
- **URL Parameters**:
  - `name` (required): The name of the tool

#### Example Request

```bash
curl --request DELETE \
  --url 'http://localhost:7777/tool/weather-api'
```

#### Response

A JSON object confirming the deletion of the tool.
