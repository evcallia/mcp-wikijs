# MCP Wiki.js Server Documentation

## Overview

The MCP Wiki.js Server is a Model Context Protocol (MCP) server that provides seamless integration between AI assistants and Wiki.js instances. This server enables AI agents to interact with Wiki.js through a standardized API, allowing for automated content management, search, and user administration.

## Features

### Page Management
- **Search Pages**: Find pages by title or content
- **Get Page**: Retrieve specific page content by ID or path
- **Create Page**: Add new pages with markdown content
- **Update Page**: Modify existing page content and metadata
- **Delete Page**: Remove pages from the wiki
- **List Pages**: Browse all available pages with pagination

### User Management
- **Search Users**: Find users by various criteria
- **Get User**: Retrieve detailed user information
- **List Groups**: View all user groups and permissions

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Access to a Wiki.js instance
- Wiki.js API token with appropriate permissions

### Setup Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd mcp-wikijs
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Wiki.js settings:
   ```env
   WIKIJS_URL=https://your-wiki.example.com
   WIKIJS_API_TOKEN=your-api-token
   MCP_SERVER_NAME=wikijs
   LOG_LEVEL=info
   WIKIJS_GRAPHQL_PATH=/graphql
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```

5. **Test the connection**:
   ```bash
   node examples/test-connection.js
   ```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|----------|
| `WIKIJS_URL` | Base URL of your Wiki.js instance | Yes | - |
| `WIKIJS_API_TOKEN` | API token for authentication | Yes | - |
| `MCP_SERVER_NAME` | Name identifier for the MCP server | No | `wikijs` |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | No | `info` |
| `WIKIJS_GRAPHQL_PATH` | GraphQL endpoint path | No | `/graphql` |
| `NODE_TLS_REJECT_UNAUTHORIZED` | Disable SSL verification (dev only) | No | - |

### Claude Desktop Integration

Add the following to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "wikijs": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-wikijs/dist/index.js"],
      "env": {
        "WIKIJS_URL": "https://your-wiki.example.com",
        "WIKIJS_API_TOKEN": "your-api-token",
        "MCP_SERVER_NAME": "wikijs",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## Available Tools

### Page Operations

#### search_pages
Search for pages by title or content.

**Parameters**:
- `query` (string, required): Search query
- `limit` (number, optional): Maximum results (default: 10)

**Example**:
```javascript
{
  "query": "installation guide",
  "limit": 5
}
```

#### get_page
Retrieve a specific page by ID or path.

**Parameters**:
- `id` (number, optional): Page ID
- `path` (string, optional): Page path

**Example**:
```javascript
{
  "path": "home"
}
```

#### create_page
Create a new page in Wiki.js.

**Parameters**:
- `title` (string, required): Page title
- `content` (string, required): Page content in markdown
- `path` (string, required): Page path (URL slug)
- `description` (string, optional): Page description
- `tags` (array, optional): Page tags
- `isPublished` (boolean, optional): Published status (default: true)
- `isPrivate` (boolean, optional): Private status (default: false)
- `locale` (string, optional): Page locale (default: "en")
- `editor` (string, optional): Editor type (default: "markdown")

**Example**:
```javascript
{
  "title": "Getting Started",
  "content": "# Welcome\n\nThis is your first page!",
  "path": "getting-started",
  "description": "Introduction to our wiki",
  "tags": ["guide", "introduction"]
}
```

#### update_page
Update an existing page.

**Parameters**:
- `id` (number, required): Page ID to update
- `title` (string, optional): New title
- `content` (string, optional): New content
- `description` (string, optional): New description
- `tags` (array, optional): New tags
- `isPublished` (boolean, optional): Published status
- `isPrivate` (boolean, optional): Private status

#### delete_page
Delete a page from Wiki.js.

**Parameters**:
- `id` (number, required): Page ID to delete

#### list_pages
List all pages with pagination.

**Parameters**:
- `limit` (number, optional): Maximum pages to return (default: 50)
- `offset` (number, optional): Number of pages to skip (default: 0)

### User Operations

#### search_users
Search for users in Wiki.js.

**Parameters**:
- `query` (string, required): Search query
- `limit` (number, optional): Maximum results (default: 10)

#### get_user
Get user information by ID.

**Parameters**:
- `id` (number, required): User ID

#### list_groups
List all user groups.

**Parameters**: None

## Usage Examples

### Creating Documentation

```javascript
// Create a new documentation page
const newPage = await createPage({
  title: "API Documentation",
  content: `# API Documentation\n\n## Overview\n\nThis document describes our API endpoints...`,
  path: "api-docs",
  description: "Complete API reference",
  tags: ["api", "documentation", "reference"]
});
```

### Searching Content

```javascript
// Search for pages about installation
const results = await searchPages({
  query: "installation setup",
  limit: 10
});

console.log(`Found ${results.length} pages`);
```

### Managing Users

```javascript
// List all user groups
const groups = await listGroups();

// Search for specific users
const users = await searchUsers({
  query: "admin",
  limit: 5
});
```

## Error Handling

The MCP server provides detailed error messages for common issues:

- **Connection Errors**: Server unreachable or SSL issues
- **Authentication Errors**: Invalid API token
- **GraphQL Errors**: Invalid queries or server-side errors
- **Validation Errors**: Invalid input parameters

### Common Issues

#### SSL Certificate Problems
If you encounter SSL certificate issues in development:

```env
NODE_TLS_REJECT_UNAUTHORIZED=0
```

**⚠️ Warning**: Only use this in development environments.

#### API Token Permissions
Ensure your API token has the following permissions:
- Read pages
- Write pages (for create/update operations)
- Delete pages (for delete operations)
- Read users and groups

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Start development server
npm run dev
```

### Testing

```bash
# Test connection
node examples/test-connection.js

# Run usage examples
node examples/usage-example.js
```

## Security Considerations

1. **API Token Security**: Store API tokens securely and rotate them regularly
2. **SSL/TLS**: Always use HTTPS in production environments
3. **Permissions**: Grant minimal required permissions to API tokens
4. **Input Validation**: The server validates all inputs, but additional validation in your application is recommended

## Troubleshooting

### Connection Issues
1. Verify Wiki.js URL is accessible
2. Check API token validity
3. Ensure GraphQL endpoint is available
4. Review firewall and network settings

### Performance Optimization
1. Use pagination for large result sets
2. Implement caching for frequently accessed pages
3. Monitor API rate limits

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the examples directory
3. Check the project's issue tracker
4. Consult Wiki.js documentation for API-specific questions

## License

This project is licensed under the MIT License. See the LICENSE file for details.