# Tools API

This document outlines the API endpoints for managing tools in the Makima framework. Tools are functions or capabilities that agents can use to perform specific tasks or retrieve information.

## Get All Tools

Retrieves a list of all tools in the system.

- **URL**: `/tool/`
- **Method**: `GET`

### Example Request

```shellscript
curl --request GET \
  --url http://localhost:7777/tool/
```

## Get Tool by Name

Retrieves details of a specific tool by its name.

- **URL**: `/tool/{name}`
- **Method**: `GET`

### Example Request

```shellscript
curl --request GET \
  --url http://localhost:7777/tool/weather-lookup
```

## Create a New Tool

Creates a new tool with the provided details.

- **URL**: `/tool/create`
- **Method**: `POST`

### Request Body

| Field       | Type   | Description                                              |
| ----------- | ------ | -------------------------------------------------------- |
| name        | string | Unique name for the tool                                 |
| description | string | Brief description of what the tool does                  |
| params      | object | JSON schema of the tool's input parameters               |
| endpoint    | string | API endpoint where the tool functionality is implemented |
| method      | string | HTTP method used to call the tool (e.g., GET, POST)      |

### Example Request

```shellscript
curl --request POST \
  --url http://localhost:7777/tool/create \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "weather-lookup",
    "description": "Retrieves current weather information for a given location",
    "params": {
      "type": "object",
      "properties": {
        "location": {
          "type": "string",
          "description": "City name or zip code"
        }
      },
      "required": ["location"]
    },
    "endpoint": "https://api.weatherservice.com/current",
    "method": "GET"
  }'
```

## Update a Tool

Updates an existing tool's details.

- **URL**: `/tool/{name}`
- **Method**: `PUT`

### Request Body

Same fields as in the Create a New Tool endpoint.

### Example Request

```shellscript
curl --request PUT \
  --url http://localhost:7777/tool/weather-lookup \
  --header 'Content-Type: application/json' \
  --data '{
    "description": "Retrieves current weather and 5-day forecast for a given location",
    "params": {
      "type": "object",
      "properties": {
        "location": {
          "type": "string",
          "description": "City name, zip code, or coordinates"
        },
        "units": {
          "type": "string",
          "enum": ["metric", "imperial"],
          "default": "metric"
        }
      },
      "required": ["location"]
    },
    "endpoint": "https://api.weatherservice.com/forecast",
    "method": "GET"
  }'
```

## Delete a Tool

Deletes a tool by its name.

- **URL**: `/tool/{name}`
- **Method**: `DELETE`

### Example Request

```shellscript
curl --request DELETE \
  --url http://localhost:7777/tool/weather-lookup
```

This documentation covers the main operations for managing tools in the Makima framework. Remember to replace `localhost:7777` with the appropriate host and port if your setup differs.

When integrating tools with agents, you can use the previously documented endpoints in the Agents API:

- To add a tool to an agent: `/agent/{agentName}/add-tool/{toolName}`
- To remove a tool from an agent: `/agent/{agentName}/remove-tool/{toolName}`

These endpoints allow you to associate or disassociate tools with specific agents, enabling them to use the tool's functionality during interactions.

## TypeScript Tools Server Template

To simplify the process of creating and managing tools for Makima, we provide a TypeScript tools server template. This template allows developers to define tools in a straightforward manner with automatic registration on the Makima server.

### Features

- Easy tool definition using TypeScript
- Automatic registration of tools with Makima
- Real-time updates: Changes to tools are automatically reflected in Makima

### Getting Started

1. Clone the tools server template repository:

```shellscript
git clone https://github.com/makima-ai/tools-server.git
cd tools-server
```

2. Follow the instructions in the repository's README to set up and run the tools server.
3. Define your tools using the provided TypeScript interfaces and decorators.
4. The tools server will automatically register your tools with Makima and keep them updated as you make changes.

For more information and detailed instructions, visit the [tools-server repository](https://github.com/makima-ai/tools-server).

Using this template significantly simplifies the process of creating and managing tools for your Makima agents, allowing you to focus on implementing the tool's functionality rather than worrying about integration details.
