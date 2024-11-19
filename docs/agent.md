# Agents in Makima

This guide will walk you through the process of creating agents in the Makima framework and adding tools to them.

## Creating an Agent

To create a new agent, you'll use the `/agent/create` endpoint. Here's how to do it:

### API Endpoint

- **URL**: `/agent/create`
- **Method**: `POST`

### Request Body

The request body should be a JSON object with the following properties:

```json
{
  "name": "string",
  "description": "string",
  "prompt": "string",
  "primaryModel": "string",
  "fallbackModels": ["string"]
}
```

- `name` (required): A unique identifier for the agent.
- `description`: A brief description of the agent's purpose or capabilities.
- `prompt` (required): The initial prompt that defines the agent's behavior and knowledge.
- `primaryModel` (required): The main AI model the agent will use.
- `fallbackModels`: An array of alternative models to use if the primary model is unavailable.

### Example Request

Here's an example of how to create a new agent using curl:

```bash
curl --request POST \
  --url 'http://localhost:7777/agent/create' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "weather-assistant",
    "description": "An AI assistant specialized in providing weather information",
    "prompt": "You are a knowledgeable weather assistant. Provide accurate and helpful information about weather conditions, forecasts, and climate patterns.",
    "primaryModel": "openai/gpt-4",
    "fallbackModels": ["openai/gpt-3.5-turbo"]
  }'
```

## Adding Tools to an Agent

After creating an agent, you can add tools to enhance its capabilities. This is done using a separate API call.

### API Endpoint

- **URL**: `/agent/{agentName}/add-tool/{toolName}`
- **Method**: `POST`

### URL Parameters

- `agentName`: The name of the agent you want to add the tool to.
- `toolName`: The name of the tool you want to add.

### Example Request

Here's how to add a tool named "weather-api" to the "weather-assistant" agent:

```bash
curl --request POST \
  --url 'http://localhost:7777/agent/weather-assistant/add-tool/weather-api'
```

## Best Practices

1. **Descriptive Names**: Choose clear, unique & descriptive names for your agents that reflect their purpose or domain of expertise.

2. **Detailed Prompts**: Write comprehensive prompts that accurately define the agent's role, knowledge, and behavior.

3. **Appropriate Models**: Select primary and fallback models that are well-suited to the agent's intended tasks.

4. **Modular Tool Addition**: Add tools incrementally as needed, rather than trying to add all possible tools at once.

5. **Testing**: After creating an agent and adding tools, test it thoroughly to ensure it behaves as expected.

## Conclusion

Creating agents and adding tools in Makima is a straightforward process that allows you to build powerful, specialized AI assistants. By following this guide, you can create agents tailored to your specific needs and enhance their capabilities with relevant tools.

For more information on managing agents and using other features of the Makima framework, please refer to the other sections of our documentation.
