# Makima API Overview

This document provides an overview of the Makima API, which allows you to interact with the Makima Agent Framework programmatically.

## Base URL

All API requests should be made to:

```plaintext
http://localhost:7777
```

## Authentication

Currently, the API does not require authentication. However, this may change in future versions.

## Supported Model Providers

Makima currently supports the following AI model providers:

1. OpenAI
2. Ollama

When configuring agents, ensure you use models from these providers.

## Knowledge Base Provider

For vector storage and similarity search, Makima uses:

- pgvector

## API Endpoints

The Makima API is organized into the following main categories:

1. [Agents](./agents.md): Create, manage, and interact with AI agents.
2. [Threads](./threads.md): Handle conversation threads and messages.
3. [Knowledge Bases](./knowledge_bases.md): Manage vector embeddings for enhanced capabilities.
4. [Tools](./tools.md): Create and manage custom tools for agents to use.

Each category has its own set of endpoints for various operations. Please refer to the individual documentation files for detailed information on available endpoints, request/response formats, and examples.

## Rate Limiting

Currently, there are no rate limits imposed on the API. However, please be mindful of your usage to ensure optimal performance for all users.

For detailed information on how to use each endpoint, please refer to the specific API documentation files linked above.
