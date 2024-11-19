# Managing Threads in Makima

This guide covers the operations for managing threads in the Makima framework. Threads are used to maintain conversation context and history.

## Creating a Thread

To create a new thread, use the `/thread/create` endpoint.

### API Endpoint

- **URL**: `/thread/create`
- **Method**: `POST`

### Request Body

```json
{
  "id": "string",
  "platform": "string",
  "description": "string",
  "authors": ["string"],
  "agentName": "string"
}
```

- `id` (required): A unique identifier for the thread.
- `platform` (required): The platform where the thread is being used (e.g., "web", "mobile").
- `description`: A brief description of the thread's purpose.
- `authors`: An array of user identifiers who are part of this thread.
- `agentName` (required): The name of the agent assigned to this thread.

### Example Request

```bash
curl --request POST \
  --url 'http://localhost:7777/thread/create' \
  --header 'Content-Type: application/json' \
  --data '{
    "id": "weather-convo-001",
    "platform": "web",
    "description": "Weather inquiry conversation",
    "authors": ["user123"],
    "agentName": "weather-assistant"
  }'
```

## Retrieving Threads

### Get All Threads

To retrieve all threads, use the `/thread/` endpoint.

#### API Endpoint

- **URL**: `/thread/`
- **Method**: `GET`

#### Query Parameters

- `name` (optional): Filter threads by name

#### Example Request

```bash
curl --request GET \
  --url 'http://localhost:7777/thread/?name=weather'
```

### Get Thread by ID

To retrieve a specific thread, use the `/thread/{id}` endpoint.

#### API Endpoint

- **URL**: `/thread/{id}`
- **Method**: `GET`

#### Example Request

```bash
curl --request GET \
  --url 'http://localhost:7777/thread/weather-convo-001'
```

## Adding Messages to a Thread

To add a message to an existing thread, use the `/thread/{id}/message` endpoint.

### API Endpoint

- **URL**: `/thread/{id}/message`
- **Method**: `POST`

### Request Body

```json
{
  "callId": "string",
  "role": "human",
  "name": "string",
  "content": "string",
  "authorId": "string"
}
```

- `callId`: A unique identifier for this message call.
- `role`: The role of the message sender (e.g., "human").
- `name`: The name of the message sender.
- `content`: The content of the message.
- `authorId`: The unique identifier of the author.

### Example Request

```bash
curl --request POST \
  --url 'http://localhost:7777/thread/weather-convo-001/message' \
  --header 'Content-Type: application/json' \
  --data '{
    "callId": "msg-001",
    "role": "human",
    "name": "User",
    "content": "What's the weather like in New York today?",
    "authorId": "user123"
  }'
```

## Performing Inference on a Thread

To perform inference (chat) on a thread, use the `/thread/{id}/chat` endpoint.

### API Endpoint

- **URL**: `/thread/{id}/chat`
- **Method**: `POST`

### Request Body

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

- `agentName`: The name of the agent to use for inference.
- `message`: The message object containing the user's input.

### Example Request

```bash
curl --request POST \
  --url 'http://localhost:7777/thread/weather-convo-001/chat' \
  --header 'Content-Type: application/json' \
  --data '{
    "agentName": "weather-assistant",
    "message": {
      "role": "human",
      "name": "User",
      "content": "What's the weather forecast for tomorrow?"
    }
  }'
```

## Updating a Thread's Default Agent

To update the default agent for a thread, use the `/thread/{id}/agent` endpoint.

### API Endpoint

- **URL**: `/thread/{id}/agent`
- **Method**: `PUT`

### Request Body

```json
{
  "agentName": "string"
}
```

### Example Request

```bash
curl --request PUT \
  --url 'http://localhost:7777/thread/weather-convo-001/agent' \
  --header 'Content-Type: application/json' \
  --data '{
    "agentName": "advanced-weather-assistant"
  }'
```

## Deleting a Thread

To delete a thread, use the `/thread/{id}` endpoint with the DELETE method.

### API Endpoint

- **URL**: `/thread/{id}`
- **Method**: `DELETE`

### Example Request

```bash
curl --request DELETE \
  --url 'http://localhost:7777/thread/weather-convo-001'
```

## Best Practices

1. **Unique Identifiers**: Use meaningful and unique identifiers for threads to easily track and manage conversations.

2. **Context Preservation**: When adding messages to a thread, ensure that the context is preserved by including relevant information in each message.

3. **Agent Assignment**: Assign appropriate agents to threads based on the conversation topic or user needs.

4. **Regular Cleanup**: Implement a policy to archive or delete old or inactive threads to manage system resources effectively.

5. **Error Handling**: Implement robust error handling when managing threads, especially for operations like adding messages or performing inference.

## Conclusion

Managing threads in Makima allows you to maintain context in conversations and provide a seamless experience for users interacting with your AI agents. By following this guide, you can effectively create, update, and manage threads in your Makima-based applications.
