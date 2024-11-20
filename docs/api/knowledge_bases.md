# Knowledge Bases API

This document outlines the API endpoints for managing knowledge bases in the Makima framework. Knowledge bases are used to store and query vector embeddings for enhanced capabilities.

## Get All Knowledge Bases

Retrieves a list of all knowledge bases in the system.

- **URL**: `/knowledge/`
- **Method**: `GET`

### Example Request

```shellscript
curl --request GET \
  --url http://localhost:7777/knowledge/
```

## Get Knowledge Base by Name

Retrieves details of a specific knowledge base by its name.

- **URL**: `/knowledge/{name}`
- **Method**: `GET`

### Example Request

```shellscript
curl --request GET \
  --url http://localhost:7777/knowledge/product-catalog
```

## Create a New Knowledge Base

Creates a new knowledge base with the provided details.

- **URL**: `/knowledge/create`
- **Method**: `POST`

### Request Body

| Field             | Type   | Description                                                                   |
| ----------------- | ------ | ----------------------------------------------------------------------------- |
| name              | string | Unique name for the knowledge base                                            |
| description       | string | (Optional) Brief description of the knowledge base                            |
| embedding_model   | string | Model used for generating embeddings                                          |
| database_provider | string | Database provider for storing embeddings (currently only supports "pgvector") |

### Example Request

```shellscript
curl --request POST \
  --url http://localhost:7777/knowledge/create \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "product-catalog",
    "description": "Vector embeddings of product descriptions",
    "embedding_model": "openai/text-embedding-ada-002",
    "database_provider": "pgvector"
  }'
```

## Update a Knowledge Base

Updates an existing knowledge base's details.

- **URL**: `/knowledge/{name}`
- **Method**: `PUT`

### Request Body

| Field           | Type   | Description                                          |
| --------------- | ------ | ---------------------------------------------------- |
| embedding_model | string | (Optional) New model for generating embeddings       |
| description     | string | (Optional) Updated description of the knowledge base |

### Example Request

```shellscript
curl --request PUT \
  --url http://localhost:7777/knowledge/product-catalog \
  --header 'Content-Type: application/json' \
  --data '{
    "description": "Updated vector embeddings of product descriptions and features",
    "embedding_model": "openai/text-embedding-ada-002"
  }'
```

## Delete a Knowledge Base

Deletes a knowledge base and its associated data.

- **URL**: `/knowledge/{name}`
- **Method**: `DELETE`

### Example Request

```shellscript
curl --request DELETE \
  --url http://localhost:7777/knowledge/product-catalog
```

## Add Document to Knowledge Base

Adds a new document to the specified knowledge base.

- **URL**: `/knowledge/{name}/add-document`
- **Method**: `POST`

### Request Body

| Field    | Type   | Description                                                  |
| -------- | ------ | ------------------------------------------------------------ |
| content  | string | Content of the document to be added                          |
| metadata | object | (Optional) Additional metadata for the document              |
| model    | string | (Optional) Specific model to use for embedding this document |

### Example Request

```shellscript
curl --request POST \
  --url http://localhost:7777/knowledge/product-catalog/add-document \
  --header 'Content-Type: application/json' \
  --data '{
    "content": "The XYZ-1000 is a high-performance laptop with a 15-inch 4K display, 32GB RAM, and 1TB SSD storage.",
    "metadata": {
      "product_id": "XYZ-1000",
      "category": "laptops"
    }
  }'
```

## Update Document in Knowledge Base

Updates an existing document in the specified knowledge base.

- **URL**: `/knowledge/{name}/update-document`
- **Method**: `PUT`

### Request Body

| Field    | Type   | Description                                  |
| -------- | ------ | -------------------------------------------- |
| id       | string | Unique identifier of the document to update  |
| content  | string | (Optional) Updated content of the document   |
| metadata | object | (Optional) Updated metadata for the document |

### Example Request

```shellscript
curl --request PUT \
  --url http://localhost:7777/knowledge/product-catalog/update-document \
  --header 'Content-Type: application/json' \
  --data '{
    "id": "doc123",
    "content": "The XYZ-1000 is a high-performance laptop with a 15.6-inch 4K display, 64GB RAM, and 2TB SSD storage.",
    "metadata": {
      "product_id": "XYZ-1000",
      "category": "laptops",
      "price": 1999.99
    }
  }'
```

## Remove Document from Knowledge Base

Removes a document from the specified knowledge base.

- **URL**: `/knowledge/{name}/remove-document/{documentId}`
- **Method**: `DELETE`

### Example Request

```shellscript
curl --request DELETE \
  --url http://localhost:7777/knowledge/product-catalog/remove-document/doc123
```

## Search Knowledge Base

Performs a similarity search on the specified knowledge base.

- **URL**: `/knowledge/{name}/search`
- **Method**: `GET`

### Query Parameters

| Parameter | Type    | Description                                              |
| --------- | ------- | -------------------------------------------------------- |
| q         | string  | Query string to search for                               |
| k         | integer | Number of results to return                              |
| model     | string  | (Optional) Specific model to use for embedding the query |

### Example Request

```shellscript
curl --request GET \
  --url 'http://localhost:7777/knowledge/product-catalog/search?q=high-performance%20laptop&k=5'
```

## Get Documents from Knowledge Base

Retrieves documents from the specified knowledge base based on the provided filter.

- **URL**: `/knowledge/{name}/documents`
- **Method**: `GET`

### Example Request

```shellscript
curl --request GET \
  --url http://localhost:7777/knowledge/product-catalog/documents
```

This documentation covers the main operations for managing knowledge bases in the Makima framework. Remember to replace `localhost:7777` with the appropriate host and port if your setup differs.
