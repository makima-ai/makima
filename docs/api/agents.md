# Agents API

This document outlines the API endpoints for managing agents in the Makima framework.

## Get All Agents

Retrieves a list of all agents in the system.

- **URL**: `/agent/`
- **Method**: `GET`

### Example Request

```shellscript
curl --request GET \
  --url http://localhost:7777/agent/
```

## Get Agent by Name

Retrieves details of a specific agent by its name.

- **URL**: `/agent/{name}`
- **Method**: `GET`

### Example Request

```shellscript
curl --request GET \
  --url http://localhost:7777/agent/my-first-agent
```

## Create a New Agent

Creates a new agent with the provided details.

- **URL**: `/agent/create`
- **Method**: `POST`

### Request Body

| Field          | Type   | Description                                 |
| -------------- | ------ | ------------------------------------------- |
| name           | string | Unique name for the agent                   |
| description    | string | (Optional) Brief description of the agent   |
| prompt         | string | System prompt defining the agent's behavior |
| primaryModel   | string | Primary AI model for the agent              |
| fallbackModels | array  | (Optional) List of fallback models          |

### Example Request

```shellscript
curl --request POST \
  --url http://localhost:7777/agent/create \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "customer-support",
    "description": "A helpful customer support agent",
    "prompt": "You are a friendly customer support agent. Provide helpful and concise responses to customer inquiries.",
    "primaryModel": "openai/gpt-3.5-turbo",
    "fallbackModels": ["ollama/llama2"]
  }'
```

## Update an Agent

Updates an existing agent's details.

- **URL**: `/agent/{name}`
- **Method**: `PUT`

### Request Body

Same fields as in the Create a New Agent endpoint.

### Example Request

```shellscript
curl --request PUT \
  --url http://localhost:7777/agent/customer-support \
  --header 'Content-Type: application/json' \
  --data '{
    "description": "An advanced customer support agent",
    "prompt": "You are a knowledgeable customer support agent with expertise in technical issues. Provide detailed and accurate responses to customer inquiries.",
    "primaryModel": "openai/gpt-4"
  }'
```

## Delete an Agent

Deletes an agent by its name.

- **URL**: `/agent/{name}`
- **Method**: `DELETE`

### Example Request

```shellscript
curl --request DELETE \
  --url http://localhost:7777/agent/customer-support
```

## Add Tool to Agent

Associates a tool with an agent.

- **URL**: `/agent/{agentName}/add-tool/{toolName}`
- **Method**: `POST`

### Example Request

```shellscript
curl --request POST \
  --url http://localhost:7777/agent/customer-support/add-tool/product-lookup
```

## Remove Tool from Agent

Removes a tool association from an agent.

- **URL**: `/agent/{agentName}/remove-tool/{toolName}`
- **Method**: `POST`

### Example Request

```shellscript
curl --request POST \
  --url http://localhost:7777/agent/customer-support/remove-tool/product-lookup
```

This documentation covers the main operations for managing agents in the Makima framework. Remember to replace `localhost:7777` with the appropriate host and port if your setup differs.
