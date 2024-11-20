# Threads API

This document outlines the API endpoints for managing threads in the Makima framework. Threads represent conversations or interaction sessions with agents.

## Get All Threads

Retrieves a list of all threads in the system.

- **URL**: `/thread/`
- **Method**: `GET`

### Example Request

```shellscript
curl --request GET \
  --url 'http://localhost:7777/thread/'
```

## Get Thread by ID

Retrieves details of a specific thread by its ID.

- **URL**: `/thread/{id}`
- **Method**: `GET`

### Example Request

```shellscript
curl --request GET \
  --url http://localhost:7777/thread/support-chat-001
```

## Create a New Thread

Creates a new thread with the provided details.

- **URL**: `/thread/create`
- **Method**: `POST`

### Request Body

| Field       | Type   | Description                                     |
| ----------- | ------ | ----------------------------------------------- |
| id          | string | Unique identifier for the thread                |
| platform    | string | Platform where the conversation is taking place |
| description | string | (Optional) Brief description of the thread      |
| authors     | array  | (Optional) List of author names                 |
| agentName   | string | Name of the agent associated with this thread   |

### Example Request

```shellscript
curl --request POST \
  --url http://localhost:7777/thread/create \
  --header 'Content-Type: application/json' \
  --data '{
    "id": "support-chat-001",
    "platform": "web",
    "description": "Customer support chat for order #12345",
    "authors": ["john_doe"],
    "agentName": "customer-support"
  }'
```

## Get Messages in a Thread

Retrieves all messages in a specific thread.

- **URL**: `/thread/{id}/messages`
- **Method**: `GET`

### Example Request

```shellscript
curl --request GET \
  --url http://localhost:7777/thread/support-chat-001/messages
```

## Add Message to a Thread

Adds a new message to an existing thread.

- **URL**: `/thread/{id}/message`
- **Method**: `POST`

### Request Body

| Field    | Type   | Description                                  |
| -------- | ------ | -------------------------------------------- |
| callId   | string | (Optional) Unique identifier for the message |
| name     | string | Name or role of the message sender           |
| content  | string | Content of the message                       |
| authorId | string | Identifier of the message author             |

### Example Request

```shellscript
curl --request POST \
  --url http://localhost:7777/thread/support-chat-001/message \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "human",
    "content": "I need help with my recent order.",
    "authorId": "user123"
  }'
```

## Perform Inference on a Thread (Chat)

Sends a message to the thread and receives a response from the associated agent.

- **URL**: `/thread/{id}/chat`
- **Method**: `POST`

### Request Body

| Field     | Type   | Description                                                                                          |
| --------- | ------ | ---------------------------------------------------------------------------------------------------- |
| agentName | string | (Optional) Name of the agent to use for this interaction, defaults to the one defined in the thread. |
| message   | object | Message object containing role, name, and content                                                    |

### Example Request

```shellscript
curl --request POST \
  --url http://localhost:7777/thread/support-chat-001/chat \
  --header 'Content-Type: application/json' \
  --data '{
    "message": {
      "role": "human",
      "name": "user",
      "content": "What's the status of my order #12345?"
    }
  }'
```

## Update Thread's Default Agent

Updates the default agent associated with a thread.

- **URL**: `/thread/{id}/agent`
- **Method**: `PUT`

### Request Body

| Field     | Type   | Description                                        |
| --------- | ------ | -------------------------------------------------- |
| agentName | string | Name of the new agent to associate with the thread |

### Example Request

```shellscript
curl --request PUT \
  --url http://localhost:7777/thread/support-chat-001/agent \
  --header 'Content-Type: application/json' \
  --data '{
    "agentName": "advanced-support-agent"
  }'
```

## Delete a Thread

Deletes a thread and all associated messages.

- **URL**: `/thread/{id}`
- **Method**: `DELETE`

### Example Request

```shellscript
curl --request DELETE \
  --url http://localhost:7777/thread/support-chat-001
```

This documentation covers the main operations for managing threads in the Makima framework. Remember to replace `localhost:7777` with the appropriate host and port if your setup differs.
