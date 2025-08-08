#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { WikiJsClient } from './wikijs-client.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validation schemas
const SearchPagesSchema = z.object({
  query: z.string().describe('Search query for pages'),
  limit: z.number().optional().default(10).describe('Maximum number of results'),
});

const GetPageSchema = z.object({
  id: z.number().optional().describe('Page ID'),
  path: z.string().optional().describe('Page path'),
}).refine(data => data.id || data.path, {
  message: 'Either id or path must be provided',
});

const CreatePageSchema = z.object({
  title: z.string().describe('Page title'),
  content: z.string().describe('Page content in markdown'),
  path: z.string().describe('Page path (URL slug)'),
  description: z.string().optional().describe('Page description'),
  tags: z.array(z.string()).optional().default([]).describe('Page tags'),
  isPublished: z.boolean().optional().default(true).describe('Whether page is published'),
  isPrivate: z.boolean().optional().default(false).describe('Whether page is private'),
  locale: z.string().optional().default('en').describe('Page locale'),
  editor: z.string().optional().default('markdown').describe('Editor type'),
});

const UpdatePageSchema = z.object({
  id: z.number().describe('Page ID to update'),
  title: z.string().optional().describe('Page title'),
  content: z.string().optional().describe('Page content in markdown'),
  description: z.string().optional().describe('Page description'),
  tags: z.array(z.string()).optional().describe('Page tags'),
  isPublished: z.boolean().optional().describe('Whether page is published'),
  isPrivate: z.boolean().optional().describe('Whether page is private'),
});

const IntelligentUpdatePageSchema = z.object({
  id: z.number().describe('Page ID to update'),
  sectionUpdates: z.array(z.object({
    sectionTitle: z.string().describe('Title of the section to update'),
    newContent: z.string().describe('New content for the section'),
    operation: z.enum(['replace', 'append', 'prepend', 'insert_after', 'insert_before']).describe('How to apply the update'),
    targetLine: z.number().optional().describe('Target line number for insert operations')
  })).optional().describe('Section-specific updates'),
  globalUpdates: z.object({
    title: z.string().optional().describe('Page title'),
    description: z.string().optional().describe('Page description'),
    tags: z.array(z.string()).optional().describe('Page tags'),
    isPublished: z.boolean().optional().describe('Whether page is published'),
    isPrivate: z.boolean().optional().describe('Whether page is private')
  }).optional().describe('Global page updates')
});

const DeletePageSchema = z.object({
  id: z.number().describe('Page ID to delete'),
});

const SearchUsersSchema = z.object({
  query: z.string().describe('Search query for users'),
  limit: z.number().optional().default(10).describe('Maximum number of results'),
});

class WikiJsMcpServer {
  private server: Server;
  private wikiClient: WikiJsClient;

  constructor() {
    this.server = new Server(
      {
        name: process.env.MCP_SERVER_NAME || 'wikijs-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.wikiClient = new WikiJsClient({
      baseUrl: process.env.WIKIJS_URL || 'http://localhost:3000',
      apiToken: process.env.WIKIJS_API_TOKEN,
      username: process.env.WIKIJS_USERNAME,
      password: process.env.WIKIJS_PASSWORD,
      graphqlPath: process.env.WIKIJS_GRAPHQL_PATH || '/graphql',
    });

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_pages',
            description: 'Search for pages in Wiki.js by title or content',
            inputSchema: zodToJsonSchema(SearchPagesSchema),
          },
          {
            name: 'get_page',
            description: 'Get a specific page by ID or path',
            inputSchema: zodToJsonSchema(GetPageSchema),
          },
          {
            name: 'create_page',
            description: 'Create a new page in Wiki.js',
            inputSchema: zodToJsonSchema(CreatePageSchema),
          },
          {
            name: 'update_page',
            description: 'Update an existing page in Wiki.js',
            inputSchema: zodToJsonSchema(UpdatePageSchema),
          },
          {
            name: 'update_page_intelligent',
            description: 'Intelligently update specific sections of a Wiki.js page using gather-analyze-edit workflow',
            inputSchema: zodToJsonSchema(IntelligentUpdatePageSchema),
          },
          {
            name: 'update_page_robust',
            description: 'Robustly update a Wiki.js page with fallback to delete-recreate strategy',
            inputSchema: zodToJsonSchema(IntelligentUpdatePageSchema),
          },
          {
            name: 'delete_page',
            description: 'Delete a page from Wiki.js',
            inputSchema: zodToJsonSchema(DeletePageSchema),
          },
          {
            name: 'list_pages',
            description: 'List all pages in Wiki.js',
            inputSchema: zodToJsonSchema(z.object({
              limit: z.number().optional().default(50).describe('Maximum number of pages to return'),
              offset: z.number().optional().default(0).describe('Number of pages to skip'),
            })),
          },
          {
            name: 'search_users',
            description: 'Search for users in Wiki.js',
            inputSchema: zodToJsonSchema(SearchUsersSchema),
          },
          {
            name: 'get_user',
            description: 'Get user information by ID',
            inputSchema: zodToJsonSchema(z.object({
              id: z.number().describe('User ID'),
            })),
          },
          {
            name: 'list_groups',
            description: 'List all user groups in Wiki.js',
            inputSchema: zodToJsonSchema(z.object({})),
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'search_pages': {
            const { query, limit } = SearchPagesSchema.parse(args);
            const results = await this.wikiClient.searchPages(query, limit);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(results, null, 2),
                },
              ],
            };
          }

          case 'get_page': {
            const { id, path } = GetPageSchema.parse(args);
            const page = await this.wikiClient.getPage(id, path);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(page, null, 2),
                },
              ],
            };
          }

          case 'create_page': {
            const pageData = CreatePageSchema.parse(args);
            const result = await this.wikiClient.createPage(pageData);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'update_page': {
            const pageData = UpdatePageSchema.parse(args);
            const result = await this.wikiClient.updatePage(pageData);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'update_page_intelligent': {
            const updateData = IntelligentUpdatePageSchema.parse(args);
            const result = await this.wikiClient.updatePageIntelligent(updateData);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'update_page_robust': {
            const updateData = IntelligentUpdatePageSchema.parse(args);
            const result = await this.wikiClient.updatePageRobust(updateData);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'delete_page': {
            const { id } = DeletePageSchema.parse(args);
            const result = await this.wikiClient.deletePage(id);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'list_pages': {
            const { limit, offset } = z.object({
              limit: z.number().optional().default(50),
              offset: z.number().optional().default(0),
            }).parse(args);
            const pages = await this.wikiClient.listPages(limit, offset);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(pages, null, 2),
                },
              ],
            };
          }

          case 'search_users': {
            const { query, limit } = SearchUsersSchema.parse(args);
            const users = await this.wikiClient.searchUsers(query, limit);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(users, null, 2),
                },
              ],
            };
          }

          case 'get_user': {
            const { id } = z.object({ id: z.number() }).parse(args);
            const user = await this.wikiClient.getUser(id);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(user, null, 2),
                },
              ],
            };
          }

          case 'list_groups': {
            const groups = await this.wikiClient.listGroups();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(groups, null, 2),
                },
              ],
            };
          }

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Invalid parameters: ${error.message}`
          );
        }
        throw error;
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Wiki.js MCP server running on stdio');
  }
}

const server = new WikiJsMcpServer();
server.run().catch(console.error);