# Wiki.js MCP Server

A Model Context Protocol (MCP) server that provides seamless integration between Claude Desktop and Wiki.js instances. This server enables AI assistants to interact with Wiki.js through a standardized protocol, allowing for comprehensive page management, user operations, and content search capabilities.

## 🚀 Features

- **📄 Page Management**: Create, read, update, and delete Wiki.js pages
- **👥 User Operations**: Search and retrieve user information
- **🔐 Group Management**: List and manage user groups
- **🔍 Content Search**: Search pages by title or content
- **🔒 SSL Support**: Configurable SSL certificate handling
- **⚡ Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **🔌 MCP Protocol**: Standard Model Context Protocol implementation

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Wiki.js instance with API access
- Valid Wiki.js API token

## 🛠️ Installation

### 1. Clone and Setup

```bash
git clone <repository-url>
cd mcp-wikijs
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

Edit the `.env` file:

```env
WIKIJS_URL=https://your-wiki.example.com
WIKIJS_API_TOKEN=your_api_token_here
NODE_TLS_REJECT_UNAUTHORIZED=0  # Only for self-signed certificates
```

### 3. Build the Project

```bash
npm run build
```

### 4. Test Connection

```bash
node examples/test-connection.js
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `WIKIJS_URL` | Base URL of your Wiki.js instance | ✅ Yes | - |
| `WIKIJS_API_TOKEN` | API token for authentication | ✅ Yes | - |
| `NODE_TLS_REJECT_UNAUTHORIZED` | SSL certificate validation (0=disabled, 1=enabled) | ❌ No | 1 |

### Claude Desktop Integration

Add the following configuration to your Claude Desktop config file (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "wikijs": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-wikijs/dist/index.js"],
      "env": {
        "WIKIJS_URL": "https://your-wiki.example.com",
        "WIKIJS_API_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

## 🔧 Usage

### Available MCP Tools

#### 📄 Page Operations

| Tool | Description | Parameters |
|------|-------------|------------|
| `search_pages` | Search for pages by title or content | `query`, `limit` |
| `get_page` | Retrieve a specific page | `id` or `path` |
| `create_page` | Create a new page | `title`, `content`, `path`, etc. |
| `update_page` | Update an existing page | `id`, `title`, `content`, etc. |
| `delete_page` | Delete a page | `id` |
| `list_pages` | List all pages with pagination | `limit`, `offset` |

#### 👥 User Operations

| Tool | Description | Parameters |
|------|-------------|------------|
| `search_users` | Search for users | `query`, `limit` |
| `get_user` | Get user information by ID | `id` |

#### 🔐 Group Operations

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_groups` | List all user groups | None |

### Example Usage with WikiJsClient

```javascript
const { WikiJsClient } = require('./dist/wikijs-client');

const client = new WikiJsClient({
  baseUrl: process.env.WIKIJS_URL,
  apiToken: process.env.WIKIJS_API_TOKEN
});

// Create a new page
const newPage = await client.createPage({
  title: 'My New Page',
  content: '# Welcome\n\nThis is my new page content.',
  path: 'my-new-page',
  description: 'A sample page created via API',
  tags: ['documentation', 'api']
});

// Search for pages
const searchResults = await client.searchPages({
  query: 'documentation',
  limit: 10
});

// Get a specific page
const page = await client.getPage({ path: 'my-new-page' });

// Update a page
const updatedPage = await client.updatePage({
  id: page.id,
  title: 'Updated Page Title',
  content: '# Updated Content\n\nThis page has been updated.'
});

// List all pages
const allPages = await client.listPages({ limit: 50, offset: 0 });

// Search users
const users = await client.searchUsers({ query: 'admin', limit: 5 });

// List groups
const groups = await client.listGroups();
```

## 📁 Project Structure

```
mcp-wikijs/
├── 📂 src/
│   ├── 📄 index.ts          # MCP server implementation
│   └── 📄 wikijs-client.ts  # Wiki.js API client
├── 📂 dist/                 # Compiled JavaScript
├── 📂 examples/             # Usage examples and tests
│   ├── 📄 test-connection.js
│   ├── 📄 usage-example.js
│   └── 📄 claude-desktop-config.json
├── 📂 docs/                 # Documentation
│   └── 📄 journal.md        # Development journal
├── 📄 .env.example          # Environment template
├── 📄 package.json          # Dependencies and scripts
├── 📄 tsconfig.json         # TypeScript configuration
└── 📄 README.md             # This file
```

## 🔍 API Reference

### WikiJsClient Class

#### Constructor

```typescript
new WikiJsClient(config: WikiJsConfig)
```

**Parameters:**
- `config.baseUrl`: Wiki.js instance URL
- `config.apiToken`: API authentication token

#### Page Methods

**searchPages(params: SearchPagesParams)**
```typescript
interface SearchPagesParams {
  query: string;           // Search query string
  limit?: number;          // Maximum results (default: 10)
}
```

**getPage(params: GetPageParams)**
```typescript
interface GetPageParams {
  id?: number;             // Page ID (optional)
  path?: string;           // Page path (optional)
  // Note: Either id or path must be provided
}
```

**createPage(params: CreatePageParams)**
```typescript
interface CreatePageParams {
  title: string;           // Page title
  content: string;         // Page content in markdown
  path: string;            // URL slug
  description?: string;    // Page description
  tags?: string[];         // Array of tags
  isPublished?: boolean;   // Published status (default: true)
  isPrivate?: boolean;     // Private status (default: false)
  locale?: string;         // Page locale (default: 'en')
  editor?: string;         // Editor type (default: 'markdown')
}
```

**updatePage(params: UpdatePageParams)**
```typescript
interface UpdatePageParams {
  id: number;              // Page ID to update
  title?: string;          // New title
  content?: string;        // New content
  description?: string;    // New description
  tags?: string[];         // New tags
  isPublished?: boolean;   // Published status
  isPrivate?: boolean;     // Private status
}
```

**deletePage(params: DeletePageParams)**
```typescript
interface DeletePageParams {
  id: number;              // Page ID to delete
}
```

**listPages(params: ListPagesParams)**
```typescript
interface ListPagesParams {
  limit?: number;          // Maximum pages (default: 50)
  offset?: number;         // Skip pages (default: 0)
}
```

#### User Methods

**searchUsers(params: SearchUsersParams)**
```typescript
interface SearchUsersParams {
  query: string;           // Search query
  limit?: number;          // Maximum results (default: 10)
}
```

**getUser(params: GetUserParams)**
```typescript
interface GetUserParams {
  id: number;              // User ID
}
```

**listGroups()**
- No parameters required
- Returns array of user groups

## 🧪 Development

### Building

```bash
npm run build
```

### Testing

```bash
# Test connection
node examples/test-connection.js

# Run usage examples
node examples/usage-example.js

# Type checking
npx tsc --noEmit
```

### Running the MCP Server

```bash
# Start the MCP server
node dist/index.js

# The server will run on stdio and wait for MCP protocol messages
```

## 🐛 Troubleshooting

### Common Issues

#### SSL Certificate Errors
```
Error: self signed certificate
```
**Solution**: Set `NODE_TLS_REJECT_UNAUTHORIZED=0` in your `.env` file for self-signed certificates (development only).

#### Authentication Failures
```
Wiki.js API Error: 401 - Unauthorized
```
**Solution**: 
- Verify your API token is valid
- Check that the token has sufficient permissions
- Ensure the Wiki.js API endpoint is accessible

#### GraphQL Errors
```
Wiki.js API Error: 400 - Bad Request
```
**Solution**:
- Ensure Wiki.js version compatibility
- Check API token permissions for specific operations
- Verify GraphQL query syntax

#### Module Loading Errors
```
ERR_MODULE_NOT_FOUND
```
**Solution**:
- Run `npm install` to ensure all dependencies are installed
- Verify Node.js version (18+ required)
- Check that the project has been built with `npm run build`

### Debug Mode

Enable debug logging:
```bash
DEBUG=wikijs-mcp:* node dist/index.js
```

### Schema Validation Issues

If you encounter MCP schema validation errors:
1. Ensure `zod-to-json-schema` is installed
2. Verify all tool definitions use `zodToJsonSchema()` conversion
3. Check that JSON Schema format is properly applied

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Maintain comprehensive type definitions
- Update documentation for new features
- Add tests for new functionality
- Follow existing code style and patterns

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
- 📖 Check the [troubleshooting section](#-troubleshooting)
- 🔍 Review existing GitHub issues
- 🐛 Create a new issue with detailed information
- 📚 Check the [development journal](docs/journal.md) for recent changes

## 🏆 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) for the MCP specification
- [Wiki.js](https://js.wiki/) for the excellent wiki platform
- [Anthropic](https://www.anthropic.com/) for Claude Desktop integration

---

**Status**: ✅ Production Ready  
**Last Updated**: August 8, 2025  
**Version**: 1.0.0