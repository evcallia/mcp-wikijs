# Wiki.js MCP Server API Documentation

This document provides detailed API documentation for the Wiki.js MCP Server, including all available tools, their parameters, return types, and usage examples.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Page Operations](#page-operations)
- [User Operations](#user-operations)
- [Group Operations](#group-operations)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Overview

The Wiki.js MCP Server provides 9 tools that enable comprehensive interaction with Wiki.js instances through the Model Context Protocol. All tools use JSON Schema validation and return structured responses.

### Available Tools

| Category | Tool | Description |
|----------|------|-------------|
| Pages | `search_pages` | Search for pages by title or content |
| Pages | `get_page` | Retrieve a specific page by ID or path |
| Pages | `create_page` | Create a new page |
| Pages | `update_page` | Update an existing page |
| Pages | `delete_page` | Delete a page |
| Pages | `list_pages` | List all pages with pagination |
| Users | `search_users` | Search for users |
| Users | `get_user` | Get user information by ID |
| Groups | `list_groups` | List all user groups |

## Authentication

All API calls require authentication via Wiki.js API token. The token must be provided in the environment configuration:

```env
WIKIJS_API_TOKEN=your_api_token_here
```

The server automatically includes the Bearer token in all GraphQL requests to the Wiki.js API.

## Page Operations

### search_pages

Search for pages by title or content using Wiki.js search functionality.

**Parameters:**
```typescript
{
  query: string;     // Search query string (required)
  limit?: number;    // Maximum number of results (optional, default: 10)
}
```

**Returns:**
```typescript
{
  pages: Array<{
    id: number;
    title: string;
    path: string;
    description?: string;
    tags: string[];
    isPublished: boolean;
    isPrivate: boolean;
    locale: string;
    createdAt: string;
    updatedAt: string;
  }>
}
```

**Example:**
```json
{
  "query": "documentation",
  "limit": 5
}
```

### get_page

Retrieve a specific page by either ID or path.

**Parameters:**
```typescript
{
  id?: number;       // Page ID (optional)
  path?: string;     // Page path (optional)
  // Note: Either id or path must be provided
}
```

**Returns:**
```typescript
{
  page: {
    id: number;
    title: string;
    path: string;
    content: string;
    description?: string;
    tags: string[];
    isPublished: boolean;
    isPrivate: boolean;
    locale: string;
    editor: string;
    createdAt: string;
    updatedAt: string;
    author: {
      id: number;
      name: string;
      email: string;
    };
  }
}
```

**Examples:**
```json
// Get by ID
{
  "id": 123
}

// Get by path
{
  "path": "documentation/api"
}
```

### create_page

Create a new page in Wiki.js.

**Parameters:**
```typescript
{
  title: string;           // Page title (required)
  content: string;         // Page content in markdown (required)
  path: string;            // URL slug (required)
  description?: string;    // Page description (optional)
  tags?: string[];         // Array of tags (optional, default: [])
  isPublished?: boolean;   // Published status (optional, default: true)
  isPrivate?: boolean;     // Private status (optional, default: false)
  locale?: string;         // Page locale (optional, default: 'en')
  editor?: string;         // Editor type (optional, default: 'markdown')
}
```

**Returns:**
```typescript
{
  page: {
    responseResult: {
      succeeded: boolean;
      errorCode?: number;
      slug?: string;
      message?: string;
    };
    page?: {
      id: number;
      path: string;
      title: string;
    };
  }
}
```

**Example:**
```json
{
  "title": "API Documentation",
  "content": "# API Documentation\n\nThis page contains API documentation.",
  "path": "api-docs",
  "description": "Comprehensive API documentation",
  "tags": ["api", "documentation"],
  "isPublished": true,
  "isPrivate": false
}
```

### update_page

Update an existing page in Wiki.js using direct field replacement.

**Parameters:**
```typescript
{
  id: number;              // Page ID to update (required)
  title?: string;          // New title (optional)
  content?: string;        // New content (optional)
  description?: string;    // New description (optional)
  tags?: string[];         // New tags (optional)
  isPublished?: boolean;   // Published status (optional)
  isPrivate?: boolean;     // Private status (optional)
}
```

**Returns:**
```typescript
{
  page: {
    responseResult: {
      succeeded: boolean;
      errorCode?: number;
      slug?: string;
      message?: string;
    };
  }
}
```

**Example:**
```json
{
  "id": 123,
  "title": "Updated API Documentation",
  "content": "# Updated API Documentation\n\nThis page has been updated.",
  "tags": ["api", "documentation", "updated"]
}
```

**Note:** This method replaces entire fields. For selective content updates, use `update_page_intelligent` or `update_page_robust`.

### update_page_intelligent

Intelligently update specific sections of a Wiki.js page using the gather-analyze-edit workflow.

**Workflow:**
1. **GATHER**: Retrieves current page content
2. **ANALYZE**: Parses markdown structure and identifies sections
3. **EDIT**: Applies selective modifications to specific sections
4. **UPDATE**: Saves changes using the standard update method

**Parameters:**
```typescript
{
  id: number;                    // Page ID to update (required)
  sectionUpdates?: Array<{       // Section-specific updates (optional)
    sectionTitle: string;        // Title of the section to update
    newContent: string;          // New content for the section
    operation: 'replace' | 'append' | 'prepend' | 'insert_after' | 'insert_before';
    targetLine?: number;         // Target line number for insert operations
  }>;
  globalUpdates?: {              // Global page updates (optional)
    title?: string;
    description?: string;
    tags?: string[];
    isPublished?: boolean;
    isPrivate?: boolean;
  };
}
```

**Returns:**
```typescript
{
  page: {
    responseResult: {
      succeeded: boolean;
      errorCode?: number;
      slug?: string;
      message?: string;
    };
  }
}
```

**Example:**
```json
{
  "id": 5,
  "sectionUpdates": [
    {
      "sectionTitle": "ICT Organizational Structure",
      "newContent": "\n### ICT Superintendent\n- **Name**: Adhi Surahman\n",
      "operation": "replace"
    }
  ],
  "globalUpdates": {
    "description": "Updated organizational structure"
  }
}
```

### update_page_robust

Robustly update a Wiki.js page with automatic fallback to delete-recreate strategy.

**Workflow:**
1. First attempts `update_page_intelligent`
2. If that fails, falls back to delete-recreate strategy:
   - Gathers current page content
   - Applies intelligent section updates
   - Deletes the original page
   - Recreates the page with updated content

**Parameters:**
```typescript
// Same as update_page_intelligent
{
  id: number;
  sectionUpdates?: Array<{
    sectionTitle: string;
    newContent: string;
    operation: 'replace' | 'append' | 'prepend' | 'insert_after' | 'insert_before';
    targetLine?: number;
  }>;
  globalUpdates?: {
    title?: string;
    description?: string;
    tags?: string[];
    isPublished?: boolean;
    isPrivate?: boolean;
  };
}
```

**Returns:**
```typescript
{
  page: {
    responseResult: {
      succeeded: boolean;
      errorCode?: number;
      slug?: string;
      message?: string;
    };
  }
}
```

**Use Cases:**
- When you need guaranteed success despite API limitations
- For critical updates that must not fail
- When dealing with complex content structures
- As a reliable alternative to direct updates

### delete_page

Delete a page from Wiki.js.

**Parameters:**
```typescript
{
  id: number;              // Page ID to delete (required)
}
```

**Returns:**
```typescript
{
  page: {
    responseResult: {
      succeeded: boolean;
      errorCode?: number;
      slug?: string;
      message?: string;
    };
  }
}
```

**Example:**
```json
{
  "id": 123
}
```

### list_pages

List all pages with pagination support.

**Parameters:**
```typescript
{
  limit?: number;          // Maximum pages to return (optional, default: 50)
  offset?: number;         // Number of pages to skip (optional, default: 0)
}
```

**Returns:**
```typescript
{
  pages: Array<{
    id: number;
    title: string;
    path: string;
    description?: string;
    tags: string[];
    isPublished: boolean;
    isPrivate: boolean;
    locale: string;
    createdAt: string;
    updatedAt: string;
  }>
}
```

**Example:**
```json
{
  "limit": 25,
  "offset": 50
}
```

## User Operations

### search_users

Search for users in the Wiki.js instance.

**Parameters:**
```typescript
{
  query: string;           // Search query (required)
  limit?: number;          // Maximum results (optional, default: 10)
}
```

**Returns:**
```typescript
{
  users: Array<{
    id: number;
    name: string;
    email: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    lastLoginAt?: string;
  }>
}
```

**Example:**
```json
{
  "query": "admin",
  "limit": 5
}
```

### get_user

Get detailed information about a specific user.

**Parameters:**
```typescript
{
  id: number;              // User ID (required)
}
```

**Returns:**
```typescript
{
  user: {
    id: number;
    name: string;
    email: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    lastLoginAt?: string;
    groups: Array<{
      id: number;
      name: string;
    }>;
  }
}
```

**Example:**
```json
{
  "id": 1
}
```

## Group Operations

### list_groups

List all user groups in the Wiki.js instance.

**Parameters:**
```typescript
{}
// No parameters required
```

**Returns:**
```typescript
{
  groups: Array<{
    id: number;
    name: string;
    isSystem: boolean;
    createdAt: string;
    updatedAt: string;
  }>
}
```

**Example:**
```json
{}
```

## Error Handling

All tools implement comprehensive error handling and return structured error responses.

### Common Error Types

#### Authentication Errors
```typescript
{
  error: "Authentication failed",
  details: "Invalid API token or insufficient permissions"
}
```

#### Validation Errors
```typescript
{
  error: "Validation failed",
  details: "Missing required parameter: title"
}
```

#### GraphQL Errors
```typescript
{
  error: "Wiki.js API Error: 400 - Bad Request",
  details: "Invalid GraphQL query or parameters"
}
```

#### Network Errors
```typescript
{
  error: "Connection failed",
  details: "Unable to connect to Wiki.js instance"
}
```

### Error Response Format

All errors follow a consistent format:
```typescript
{
  success: false,
  error: string,
  details?: string,
  code?: number
}
```

## Examples

### Complete Page Management Workflow

```javascript
// 1. Search for existing pages
const searchResult = await mcpClient.callTool('search_pages', {
  query: 'documentation',
  limit: 10
});

// 2. Create a new page
const createResult = await mcpClient.callTool('create_page', {
  title: 'New Documentation Page',
  content: '# New Documentation\n\nThis is a new documentation page.',
  path: 'new-docs',
  description: 'A new documentation page',
  tags: ['docs', 'new']
});

// 3. Get the created page
const getResult = await mcpClient.callTool('get_page', {
  path: 'new-docs'
});

// 4. Update the page
const updateResult = await mcpClient.callTool('update_page', {
  id: getResult.page.id,
  title: 'Updated Documentation Page',
  content: '# Updated Documentation\n\nThis page has been updated.'
});

// 5. List all pages
const listResult = await mcpClient.callTool('list_pages', {
  limit: 50,
  offset: 0
});
```

### User and Group Management

```javascript
// Search for users
const userSearch = await mcpClient.callTool('search_users', {
  query: 'admin',
  limit: 5
});

// Get specific user details
const userDetails = await mcpClient.callTool('get_user', {
  id: 1
});

// List all groups
const groups = await mcpClient.callTool('list_groups', {});
```

### Error Handling Example

```javascript
try {
  const result = await mcpClient.callTool('create_page', {
    title: 'Test Page',
    content: 'Test content',
    path: 'test-page'
  });
  
  if (result.page.responseResult.succeeded) {
    console.log('Page created successfully:', result.page.page.id);
  } else {
    console.error('Page creation failed:', result.page.responseResult.message);
  }
} catch (error) {
  console.error('API call failed:', error.message);
}
```

## Rate Limiting and Best Practices

### Performance Considerations

1. **Pagination**: Use appropriate `limit` and `offset` values for large datasets
2. **Caching**: Cache frequently accessed pages to reduce API calls
3. **Batch Operations**: Group related operations when possible
4. **Error Handling**: Always implement proper error handling

### Security Best Practices

1. **Token Security**: Store API tokens securely in environment variables
2. **Permissions**: Use API tokens with minimal required permissions
3. **SSL/TLS**: Always use HTTPS in production environments
4. **Input Validation**: Validate all input parameters before API calls

### Recommended Usage Patterns

1. **Search Before Create**: Always search for existing content before creating new pages
2. **Incremental Updates**: Use specific field updates rather than full page replacements
3. **Consistent Naming**: Use consistent path and tag naming conventions
4. **Content Validation**: Validate markdown content before submission

---

*This API documentation is current as of August 8, 2025. For the latest updates, check the project repository.*