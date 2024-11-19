# Integrating Tools in Makima

This guide covers the process of integrating and managing tools in the Makima framework. Tools extend the capabilities of agents, allowing them to perform specific tasks or access external services.

## Creating a Tool

To create a new tool, use the `/tool/create` endpoint.

### API Endpoint

- **URL**: `/tool/create`
- **Method**: `POST`

### Request Body

```json
{
  "name": "string",
  "description": "string",
  "params": {},
  "endpoint": "string",
  "method": "string"
}
```

- `name` (required): A unique identifier for the tool.
- `description`: A brief description of the tool's functionality.
- `params`: An object describing the parameters the tool accepts.
- `endpoint` (required): The URL endpoint where the tool can be accessed.
- `method` (required): The HTTP method used to call the tool (e.g., "GET", "POST").

### Example Request

```bash
curl --request POST \
  --url 'http://localhost:7777/tool/create' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "weather-api",
    "description": "Retrieves current weather information for a given location",
    "params": {
      "location": {
        "type": "string",
        "description": "City name or coordinates"
      },
      "units": {
        "type": "string",
        "enum": ["metric", "imperial"],
        "default": "metric"
      }
    },
    "endpoint": "https://api.weatherservice.com/current",
    "method": "GET"
  }'
```

## Retrieving Tools

### Get All Tools

To retrieve all tools, use the `/tool/` endpoint.

#### API Endpoint

- **URL**: `/tool/`
- **Method**: `GET`

#### Example Request

```bash
curl --request GET \
  --url 'http://localhost:7777/tool/'
```

### Get Tool by Name

To retrieve a specific tool, use the `/tool/{name}` endpoint.

#### API Endpoint

- **URL**: `/tool/{name}`
- **Method**: `GET`

#### Example Request

```bash
curl --request GET \
  --url 'http://localhost:7777/tool/weather-api'
```

## Updating a Tool

To update an existing tool, use the `/tool/{name}` endpoint with the PUT method.

### API Endpoint

- **URL**: `/tool/{name}`
- **Method**: `PUT`

### Request Body

The request body is the same as for creating a tool, but you only need to include the fields you want to update.

### Example Request

```bash
curl --request PUT \
  --url 'http://localhost:7777/tool/weather-api' \
  --header 'Content-Type: application/json' \
  --data '{
    "description": "Retrieves detailed weather information for a given location",
    "params": {
      "location": {
        "type": "string",
        "description": "City name, coordinates, or ZIP code"
      },
      "units": {
        "type": "string",
        "enum": ["metric", "imperial", "standard"],
        "default": "metric"
      },
      "lang": {
        "type": "string",
        "description": "Language code for the response",
        "default": "en"
      }
    },
    "endpoint": "https://api.weatherservice.com/v2/current"
  }'
```

## Deleting a Tool

To delete a tool, use the `/tool/{name}` endpoint with the DELETE method.

### API Endpoint

- **URL**: `/tool/{name}`
- **Method**: `DELETE`

### Example Request

```bash
curl --request DELETE \
  --url 'http://localhost:7777/tool/weather-api'
```

## Adding a Tool to an Agent

To add a tool to an agent, use the `/agent/{agentName}/add-tool/{toolName}` endpoint.

### API Endpoint

- **URL**: `/agent/{agentName}/add-tool/{toolName}`
- **Method**: `POST`

### Example Request

```bash
curl --request POST \
  --url 'http://localhost:7777/agent/weather-assistant/add-tool/weather-api'
```

## Removing a Tool from an Agent

To remove a tool from an agent, use the `/agent/{agentName}/remove-tool/{toolName}` endpoint.

### API Endpoint

- **URL**: `/agent/{agentName}/remove-tool/{toolName}`
- **Method**: `POST`

### Example Request

```bash
curl --request POST \
  --url 'http://localhost:7777/agent/weather-assistant/remove-tool/weather-api'
```

## Best Practices for Tool Integration

1. **Modular Design**: Create tools with specific, well-defined functionalities. This makes them more reusable across different agents and easier to maintain.

2. **Clear Documentation**: Provide clear descriptions and parameter specifications for each tool. This helps both developers and AI agents understand how to use the tool effectively.

3. **Error Handling**: Implement robust error handling in your tools. They should gracefully handle invalid inputs and provide clear error messages.

4. **Version Control**: Implement versioning for your tools. When updating a tool, consider creating a new version rather than modifying the existing one, to avoid breaking existing integrations.

5. **Security**: Ensure that tool endpoints are properly secured, especially if they access sensitive data or perform critical operations.

6. **Performance Optimization**: Design tools to be efficient and responsive. Consider implementing caching mechanisms for frequently requested data.

7. **Monitoring and Logging**: Implement logging in your tools to track usage and identify potential issues. This can help with debugging and optimizing performance.

8. **Rate Limiting**: Implement rate limiting for tools that access external APIs to prevent overuse and respect API quotas.

9. **Testing**: Thoroughly test tools before integration, including edge cases and error scenarios.

10. **Scalability**: Design tools to be scalable, considering potential high-volume usage in production environments.

## Conclusion

Integrating tools in Makima allows you to extend the capabilities of your AI agents, enabling them to perform a wide range of tasks and access various services. By following this guide and adhering to best practices, you can create powerful, flexible, and maintainable tool integrations for your Makima-based applications.

Remember that tools are separate entities from agents, and they need to be explicitly added to agents after creation. This modular approach allows for greater flexibility and reusability in your AI system architecture.

```

This document provides a comprehensive guide on integrating tools in Makima, covering all the main operations including creating, retrieving, updating, and deleting tools, as well as adding and removing tools from agents. It includes API endpoints, request examples, and best practices, adhering to the structure and completeness requirements specified in the internal reminder.
```
