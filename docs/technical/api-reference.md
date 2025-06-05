# API Reference

This guide provides comprehensive documentation for the Starship Collection Manager API. All API endpoints are RESTful and return JSON responses.

## Table of Contents
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Endpoints](#endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## Authentication

### API Key
1. **Getting an API Key**
   - Request from admin panel
   - Generate in settings
   - Store securely
   - Rotate regularly

2. **Using the API Key**
   ```http
   Authorization: Bearer your-api-key
   ```

### Authentication Headers
```http
Headers:
  Authorization: Bearer your-api-key
  Content-Type: application/json
  Accept: application/json
```

## Base URL

### Development
```
http://localhost:3000/api
```

### Production
```
https://your-domain.com/api
```

## Endpoints

### Starships

#### Get All Starships
```http
GET /starships
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `sort`: Sort field
- `order`: Sort order (asc/desc)
- `faction`: Filter by faction
- `edition`: Filter by edition
- `owned`: Filter by owned status
- `wishlist`: Filter by wishlist status

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "faction": "string",
      "edition": "string",
      "owned": boolean,
      "wishlist": boolean,
      "image": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  ],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "pages": number
  }
}
```

#### Get Single Starship
```http
GET /starships/:id
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "faction": "string",
  "edition": "string",
  "owned": boolean,
  "wishlist": boolean,
  "image": "string",
  "details": {
    "scale": "string",
    "manufacturer": "string",
    "releaseDate": "date",
    "price": number
  },
  "createdAt": "date",
  "updatedAt": "date"
}
```

#### Create Starship
```http
POST /starships
```

**Request Body:**
```json
{
  "name": "string",
  "faction": "string",
  "edition": "string",
  "owned": boolean,
  "wishlist": boolean,
  "details": {
    "scale": "string",
    "manufacturer": "string",
    "releaseDate": "date",
    "price": number
  }
}
```

#### Update Starship
```http
PUT /starships/:id
```

**Request Body:**
```json
{
  "name": "string",
  "faction": "string",
  "edition": "string",
  "owned": boolean,
  "wishlist": boolean,
  "details": {
    "scale": "string",
    "manufacturer": "string",
    "releaseDate": "date",
    "price": number
  }
}
```

#### Delete Starship
```http
DELETE /starships/:id
```

### Manufacturers

#### Get All Manufacturers
```http
GET /manufacturers
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `franchise`: Filter by franchise

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "franchises": ["string"],
      "products": number,
      "createdAt": "date",
      "updatedAt": "date"
    }
  ],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "pages": number
  }
}
```

#### Get Single Manufacturer
```http
GET /manufacturers/:id
```

### Statistics

#### Get Collection Statistics
```http
GET /statistics/collection
```

**Response:**
```json
{
  "total": number,
  "owned": number,
  "wishlist": number,
  "onOrder": number,
  "value": {
    "total": number,
    "average": number,
    "highest": number
  }
}
```

#### Get Faction Statistics
```http
GET /statistics/factions
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": object
  }
}
```

### Common Error Codes
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## Rate Limiting

### Limits
- 100 requests per minute
- 1000 requests per hour

### Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1609459200
```

## Examples

### Node.js Example
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://your-domain.com/api',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Get all starships
async function getStarships() {
  try {
    const response = await api.get('/starships', {
      params: {
        page: 1,
        limit: 20,
        faction: 'Federation'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}
```

### Python Example
```python
import requests

API_KEY = 'your-api-key'
BASE_URL = 'https://your-domain.com/api'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

# Get all starships
def get_starships():
    try:
        response = requests.get(
            f'{BASE_URL}/starships',
            headers=headers,
            params={
                'page': 1,
                'limit': 20,
                'faction': 'Federation'
            }
        )
        return response.json()
    except requests.exceptions.RequestException as e:
        print('Error:', e)
```

## Related Documentation
- [Database Schema](database-schema.md)
- [Component Architecture](component-architecture.md)
- [State Management](state-management.md)
- [Troubleshooting Guide](../troubleshooting/common-issues.md) 