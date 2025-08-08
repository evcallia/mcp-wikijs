# Wiki.js MCP Server Setup Guide

This comprehensive guide will walk you through setting up the Wiki.js MCP Server from scratch, including Wiki.js configuration, API token generation, and Claude Desktop integration.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Wiki.js Setup](#wikijs-setup)
- [MCP Server Installation](#mcp-server-installation)
- [Configuration](#configuration)
- [Claude Desktop Integration](#claude-desktop-integration)
- [Testing and Verification](#testing-and-verification)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)

## Prerequisites

### System Requirements

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **Operating System**: macOS, Linux, or Windows
- **Memory**: Minimum 512MB RAM available
- **Storage**: At least 100MB free space

### Required Access

- **Wiki.js Instance**: Access to a running Wiki.js installation
- **Admin Privileges**: Administrator access to Wiki.js for API token generation
- **Claude Desktop**: Installed and configured Claude Desktop application

### Check Prerequisites

```bash
# Check Node.js version
node --version
# Should output v18.0.0 or higher

# Check npm version
npm --version
# Should output 8.0.0 or higher

# Check if git is available (optional, for cloning)
git --version
```

## Wiki.js Setup

### 1. Verify Wiki.js Installation

Ensure your Wiki.js instance is running and accessible:

```bash
# Test basic connectivity
curl -I https://your-wiki.example.com
# Should return HTTP 200 OK
```

### 2. Generate API Token

#### Step-by-Step Token Generation

1. **Access Admin Panel**:
   - Navigate to your Wiki.js instance
   - Log in with administrator credentials
   - Go to **Administration** (gear icon in top-right)

2. **Navigate to API Access**:
   - In the admin panel, click **API Access** in the left sidebar
   - If not visible, check under **System** → **API Access**

3. **Create New API Key**:
   - Click **+ New API Key**
   - Fill in the details:
     ```
     Name: MCP Server Integration
     Expiration: Never (or set appropriate date)
     Full Access: ✓ (recommended for full functionality)
     ```
   - Click **Create**

4. **Copy Token**:
   - **Important**: Copy the generated token immediately
   - Store it securely - it won't be shown again
   - Example token format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### Alternative: Scoped Permissions

For enhanced security, you can create a token with specific permissions:

- **Pages**: Read, Write, Manage
- **Users**: Read
- **Groups**: Read
- **System**: Read (for connection testing)

### 3. Test API Access

```bash
# Test API connectivity (replace with your details)
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"query":"{ system { info { version } } }"}' \
     https://your-wiki.example.com/graphql
```

Expected response:
```json
{
  "data": {
    "system": {
      "info": {
        "version": "2.5.x"
      }
    }
  }
}
```

## MCP Server Installation

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-username/mcp-wikijs.git
cd mcp-wikijs

# Or download and extract ZIP file
# wget https://github.com/your-username/mcp-wikijs/archive/main.zip
# unzip main.zip && cd mcp-wikijs-main
```

### 2. Install Dependencies

```bash
# Install all required packages
npm install

# Verify installation
npm list --depth=0
```

Expected output should include:
```
├── @modelcontextprotocol/sdk@x.x.x
├── axios@x.x.x
├── dotenv@x.x.x
├── zod@x.x.x
├── zod-to-json-schema@x.x.x
└── typescript@x.x.x
```

### 3. Build Project

```bash
# Compile TypeScript to JavaScript
npm run build

# Verify build output
ls -la dist/
# Should show: index.js, index.d.ts, wikijs-client.js, wikijs-client.d.ts
```

## Configuration

### 1. Environment Setup

```bash
# Copy example environment file
cp .env.example .env

# Edit configuration
nano .env  # or use your preferred editor
```

### 2. Configure Environment Variables

Edit `.env` file with your specific settings:

```env
# Wiki.js Configuration
WIKIJS_URL=https://your-wiki.example.com
WIKIJS_API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# SSL Configuration (for self-signed certificates)
# WARNING: Only use in development environments
# NODE_TLS_REJECT_UNAUTHORIZED=0

# Optional: Debug logging
# DEBUG=wikijs-mcp:*
```

### 3. Configuration Validation

```bash
# Test configuration
node examples/test-connection.js
```

Expected output:
```
🔍 Testing Wiki.js MCP Server Connection...

📡 Testing connection...
✅ Connection successful!
📋 Wiki.js Version: Connected (version unavailable)

📄 Testing page listing...
✅ Found X pages

👥 Testing group listing...
✅ Found X groups
   Groups:
   1. Guests (ID: 2)
   2. Administrators (ID: 1)

🎉 All tests passed! Wiki.js MCP server is ready to use.
```

## Claude Desktop Integration

### 1. Locate Configuration File

**macOS**:
```bash
# Configuration file location
~/Library/Application Support/Claude/claude_desktop_config.json

# Create directory if it doesn't exist
mkdir -p "~/Library/Application Support/Claude"
```

**Windows**:
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux**:
```bash
~/.config/Claude/claude_desktop_config.json

# Create directory if it doesn't exist
mkdir -p ~/.config/Claude
```

### 2. Configure Claude Desktop

Create or edit the configuration file:

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

**Important Notes**:
- Use **absolute paths** for the `args` field
- Replace `/absolute/path/to/mcp-wikijs` with your actual installation path
- Ensure the path uses forward slashes, even on Windows

### 3. Get Absolute Path

```bash
# Get current directory absolute path
pwd
# Example output: /Users/username/Documents/mcp-wikijs

# Full path to index.js would be:
# /Users/username/Documents/mcp-wikijs/dist/index.js
```

### 4. Restart Claude Desktop

1. **Quit Claude Desktop** completely
2. **Wait 5 seconds**
3. **Restart Claude Desktop**
4. **Check for MCP server** in the interface

## Testing and Verification

### 1. Test MCP Server Standalone

```bash
# Test the MCP server directly
node dist/index.js

# Expected output:
Wiki.js MCP server running on stdio

# Press Ctrl+C to stop
```

### 2. Test with Usage Examples

```bash
# Run comprehensive usage examples
node examples/usage-example.js
```

### 3. Verify Claude Desktop Integration

1. **Open Claude Desktop**
2. **Start a new conversation**
3. **Test MCP functionality**:
   ```
   Can you list the available Wiki.js pages?
   ```
4. **Expected behavior**: Claude should use the Wiki.js MCP server to list pages

### 4. Test Specific Operations

```
# Test in Claude Desktop:
"Can you search for pages containing 'documentation'?"
"Can you create a test page titled 'MCP Test Page'?"
"Can you list all user groups in the wiki?"
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Connection Refused

**Error**: `ECONNREFUSED` or connection timeout

**Solutions**:
```bash
# Check Wiki.js URL accessibility
curl -I https://your-wiki.example.com

# Verify network connectivity
ping your-wiki.example.com

# Check firewall settings
# Ensure port 443 (HTTPS) or 80 (HTTP) is accessible
```

#### 2. SSL Certificate Errors

**Error**: `self signed certificate` or `certificate verify failed`

**Solutions**:
```bash
# For development/testing only:
echo "NODE_TLS_REJECT_UNAUTHORIZED=0" >> .env

# For production, obtain valid SSL certificate
# or configure proper certificate chain
```

#### 3. Authentication Failures

**Error**: `401 Unauthorized` or `403 Forbidden`

**Solutions**:
1. **Verify API token**:
   ```bash
   # Test token manually
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://your-wiki.example.com/graphql
   ```

2. **Check token permissions**:
   - Ensure token has required scopes
   - Verify token hasn't expired
   - Regenerate token if necessary

3. **Validate token format**:
   - Should start with `eyJ`
   - No extra spaces or characters
   - Complete token copied

#### 4. Module Loading Errors

**Error**: `ERR_MODULE_NOT_FOUND`

**Solutions**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild project
npm run build

# Check Node.js version
node --version  # Should be 18+
```

#### 5. Claude Desktop Not Detecting MCP Server

**Solutions**:
1. **Check configuration file location**
2. **Verify JSON syntax**:
   ```bash
   # Validate JSON
   cat claude_desktop_config.json | python -m json.tool
   ```
3. **Use absolute paths**
4. **Restart Claude Desktop completely**
5. **Check Claude Desktop logs** (if available)

### Debug Mode

Enable detailed logging:

```bash
# Set debug environment variable
export DEBUG=wikijs-mcp:*

# Run with debug output
node dist/index.js

# Or add to .env file
echo "DEBUG=wikijs-mcp:*" >> .env
```

### Log Analysis

Common log patterns and meanings:

```
# Successful connection
"Wiki.js MCP server running on stdio"

# Authentication success
"✅ Connection successful!"

# GraphQL errors
"Wiki.js API Error: 400 - Bad Request"

# Network issues
"ECONNREFUSED" or "ETIMEDOUT"
```

## Advanced Configuration

### 1. Custom SSL Configuration

For advanced SSL setups:

```javascript
// Custom SSL configuration in wikijs-client.ts
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,  // Only for development
  ca: fs.readFileSync('path/to/ca-cert.pem'),
  cert: fs.readFileSync('path/to/client-cert.pem'),
  key: fs.readFileSync('path/to/client-key.pem')
});
```

### 2. Proxy Configuration

For environments behind corporate proxies:

```env
# Add to .env
HTTPS_PROXY=https://proxy.company.com:8080
HTTP_PROXY=http://proxy.company.com:8080
NO_PROXY=localhost,127.0.0.1
```

### 3. Performance Tuning

```env
# Increase timeout for slow connections
REQUEST_TIMEOUT=30000

# Adjust concurrent request limits
MAX_CONCURRENT_REQUESTS=5
```

### 4. Multiple Wiki.js Instances

To support multiple Wiki.js instances, create separate MCP server configurations:

```json
{
  "mcpServers": {
    "wikijs-prod": {
      "command": "node",
      "args": ["/path/to/mcp-wikijs/dist/index.js"],
      "env": {
        "WIKIJS_URL": "https://wiki-prod.company.com",
        "WIKIJS_API_TOKEN": "prod_token_here"
      }
    },
    "wikijs-dev": {
      "command": "node",
      "args": ["/path/to/mcp-wikijs/dist/index.js"],
      "env": {
        "WIKIJS_URL": "https://wiki-dev.company.com",
        "WIKIJS_API_TOKEN": "dev_token_here"
      }
    }
  }
}
```

## Security Considerations

### 1. API Token Security

- **Never commit tokens** to version control
- **Use environment variables** for token storage
- **Rotate tokens regularly** (every 90 days recommended)
- **Use minimal permissions** required for functionality
- **Monitor token usage** in Wiki.js logs

### 2. Network Security

- **Always use HTTPS** in production
- **Validate SSL certificates** in production
- **Use VPN or private networks** when possible
- **Implement rate limiting** if exposing publicly

### 3. Access Control

- **Limit MCP server access** to authorized users
- **Use separate tokens** for different environments
- **Implement audit logging** for sensitive operations
- **Regular security reviews** of configurations

## Maintenance

### 1. Regular Updates

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Rebuild after updates
npm run build
```

### 2. Health Monitoring

```bash
# Create health check script
#!/bin/bash
node examples/test-connection.js
if [ $? -eq 0 ]; then
  echo "✅ MCP Server healthy"
else
  echo "❌ MCP Server unhealthy"
  exit 1
fi
```

### 3. Backup Considerations

- **Environment configuration**: Backup `.env` files securely
- **API tokens**: Maintain secure token inventory
- **Configuration files**: Version control Claude Desktop configs

---

**Setup Complete!** 🎉

Your Wiki.js MCP Server should now be fully configured and ready for use with Claude Desktop. For ongoing support, refer to the [troubleshooting section](#troubleshooting) or check the project documentation.

*Last updated: August 8, 2025*