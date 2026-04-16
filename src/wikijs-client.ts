import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';
import * as https from 'https';

// Type definitions for Wiki.js API responses
export interface WikiJsConfig {
  baseUrl: string;
  apiToken?: string;
  username?: string;
  password?: string;
  graphqlPath?: string;
}

export interface WikiPage {
  id: number;
  path: string;
  title: string;
  description?: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  isPrivate: boolean;
  locale: string;
  tags: string[];
  author?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface WikiUser {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface WikiGroup {
  id: number;
  name: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePageData {
  title: string;
  content: string;
  path: string;
  description?: string;
  tags?: string[];
  isPublished?: boolean;
  isPrivate?: boolean;
  locale?: string;
  editor?: string;
}

export interface UpdatePageData {
  id: number;
  title?: string;
  content?: string;
  description?: string;
  tags?: string[];
  isPublished?: boolean;
  isPrivate?: boolean;
}

export interface IntelligentUpdatePageData {
  id: number;
  sectionUpdates?: {
    sectionTitle: string;
    newContent: string;
    operation: 'replace' | 'append' | 'prepend' | 'insert_after' | 'insert_before';
    targetLine?: number;
  }[];
  globalUpdates?: {
    title?: string;
    description?: string;
    tags?: string[];
    isPublished?: boolean;
    isPrivate?: boolean;
  };
}

export interface ContentSection {
  title: string;
  content: string;
  startLine: number;
  endLine: number;
  level: number;
}

export class WikiJsClient {
  private client: AxiosInstance;
  private config: WikiJsConfig;
  private authToken?: string;

  constructor(config: WikiJsConfig) {
    this.config = config;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Cloudflare Access headers if configured
    if (process.env.CLOUDFLARE_CLIENT_ID && process.env.CLOUDFLARE_CLIENT_SECRET) {
      headers['CF-Access-Client-Id'] = process.env.CLOUDFLARE_CLIENT_ID;
      headers['CF-Access-Client-Secret'] = process.env.CLOUDFLARE_CLIENT_SECRET;
    }

    this.client = axios.create({
      baseURL: config.baseUrl,
      headers,
      // Handle SSL certificate issues if NODE_TLS_REJECT_UNAUTHORIZED=0
      httpsAgent: process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' ?
        new https.Agent({ rejectUnauthorized: false }) : undefined,
    });

    // Set up authentication
    if (config.apiToken) {
      this.authToken = config.apiToken;
      this.client.defaults.headers.common['Authorization'] = `Bearer ${config.apiToken}`;
    }
  }

  async executeGraphQL(query: string, variables?: Record<string, any>): Promise<any> {
    try {
      const response = await this.client.post(this.config.graphqlPath || '/graphql', {
        query,
        variables,
      });

      if (response.data.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(response.data.errors)}`);
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          const errorDetails = {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            query: query.trim(),
            variables
          };
          console.error('GraphQL Request Failed:', JSON.stringify(errorDetails, null, 2));
          throw new Error(`Wiki.js API Error: ${error.response.status} - ${error.response.statusText}. Data: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
          // Request was made but no response received
          throw new Error(`Wiki.js Connection Error: No response from server. Check if Wiki.js is running and accessible at ${this.config.baseUrl}`);
        } else {
          // Something else happened
          throw new Error(`Wiki.js Request Error: ${error.message}`);
        }
      }
      throw error;
    }
  }

  async searchPages(query: string, limit: number = 10): Promise<WikiPage[]> {
    const searchQuery = `
      query SearchPages($query: String!) {
        pages {
          search(query: $query) {
            totalHits
            results {
              id
              path
              title
              description
              locale
            }
          }
        }
      }
    `;

    const response = await this.executeGraphQL(searchQuery, { query });
    
    // Transform the search results to match WikiPage interface
    const results = response.pages.search.results || [];
    const limitedResults = limit ? results.slice(0, limit) : results;
    
    return limitedResults.map((result: any) => ({
      id: parseInt(result.id), // Convert string ID to number
      path: result.path,
      title: result.title,
      description: result.description || '',
      content: '', // Search results don't include full content
      createdAt: new Date().toISOString(), // Placeholder
      updatedAt: new Date().toISOString(), // Placeholder
      isPublished: true, // Placeholder
      isPrivate: false, // Placeholder
      locale: result.locale || 'en',
      tags: [] // Search results don't include tags
    }));
  }

  async getPage(id?: number, path?: string): Promise<WikiPage> {
    if (!id && !path) {
      throw new Error('Either id or path must be provided');
    }

    const graphqlQuery = id
      ? `
        query GetPageById($id: Int!) {
          pages {
            single(id: $id) {
              id
              path
              title
              description
              content
              createdAt
              updatedAt
              isPublished
              isPrivate
              locale
              tags {
                tag
              }
            }
          }
        }
      `
      : `
        query GetPageByPath($path: String!, $locale: String!) {
          pages {
            singleByPath(path: $path, locale: $locale) {
              id
              path
              title
              description
              content
              createdAt
              updatedAt
              isPublished
              isPrivate
              locale
              tags {
                tag
              }
            }
          }
        }
      `;

    const variables = id ? { id } : { path, locale: 'en' };
    const result = await this.executeGraphQL(graphqlQuery, variables);
    const page = id ? result.pages.single : result.pages.singleByPath;
    
    // Transform tags from GraphQL format [{tag: 'tagName'}] to string array ['tagName']
    if (page && page.tags) {
      page.tags = page.tags.map((tagObj: any) => tagObj.tag);
    }
    
    return page;
  }

  async listPages(limit: number = 50, offset: number = 0): Promise<WikiPage[]> {
    const graphqlQuery = `
      query {
        pages {
          list {
            id
            path
            title
            description
            createdAt
            updatedAt
            isPublished
            isPrivate
            locale
            tags
          }
        }
      }
    `;

    const result = await this.executeGraphQL(graphqlQuery);
    return result.pages.list || [];
  }

  async createPage(pageData: CreatePageData): Promise<{ responseResult: { succeeded: boolean; errorCode?: number; slug?: string; message?: string } }> {
    const graphqlQuery = `
      mutation CreatePage(
        $content: String!
        $description: String!
        $editor: String!
        $isPublished: Boolean!
        $isPrivate: Boolean!
        $locale: String!
        $path: String!
        $tags: [String]!
        $title: String!
      ) {
        pages {
          create(
            content: $content
            description: $description
            editor: $editor
            isPublished: $isPublished
            isPrivate: $isPrivate
            locale: $locale
            path: $path
            tags: $tags
            title: $title
          ) {
            responseResult {
              succeeded
              errorCode
              slug
              message
            }
          }
        }
      }
    `;

    const variables = {
      content: pageData.content,
      description: pageData.description || '',
      editor: pageData.editor || 'markdown',
      isPublished: pageData.isPublished ?? true,
      isPrivate: pageData.isPrivate ?? false,
      locale: pageData.locale || 'en',
      path: pageData.path,
      tags: pageData.tags || [],
      title: pageData.title,
    };

    const result = await this.executeGraphQL(graphqlQuery, variables);
    return result.pages.create;
  }

  async updatePage(pageData: UpdatePageData): Promise<{ responseResult: { succeeded: boolean; errorCode?: number; message?: string } }> {
    const graphqlQuery = `
      mutation UpdatePage(
        $id: Int!
        $content: String
        $description: String
        $isPublished: Boolean
        $isPrivate: Boolean
        $tags: [String]
        $title: String
      ) {
        pages {
          update(
            id: $id
            content: $content
            description: $description
            isPublished: $isPublished
            isPrivate: $isPrivate
            tags: $tags
            title: $title
          ) {
            responseResult {
              succeeded
              errorCode
              message
            }
          }
        }
      }
    `;

    const result = await this.executeGraphQL(graphqlQuery, pageData);
    return result.pages.update;
  }

  // Content Analysis Methods
  private parseMarkdownSections(content: string): ContentSection[] {
    const lines = content.split('\n');
    const sections: ContentSection[] = [];
    let currentSection: Partial<ContentSection> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headerMatch) {
        // Save previous section if exists
        if (currentSection && currentSection.title) {
          sections.push({
            title: currentSection.title,
            content: currentSection.content || '',
            startLine: currentSection.startLine || 0,
            endLine: i - 1,
            level: currentSection.level || 1
          });
        }

        // Start new section
        currentSection = {
          title: headerMatch[2],
          content: '',
          startLine: i,
          level: headerMatch[1].length
        };
      } else if (currentSection) {
        // Add content to current section
        currentSection.content = (currentSection.content || '') + line + '\n';
      }
    }

    // Add final section
    if (currentSection && currentSection.title) {
      sections.push({
        title: currentSection.title,
        content: currentSection.content || '',
        startLine: currentSection.startLine || 0,
        endLine: lines.length - 1,
        level: currentSection.level || 1
      });
    }

    return sections;
  }

  private findSectionByTitle(sections: ContentSection[], title: string): ContentSection | null {
    return sections.find(section => 
      section.title.toLowerCase().includes(title.toLowerCase()) ||
      title.toLowerCase().includes(section.title.toLowerCase())
    ) || null;
  }

  private applySectionUpdate(
    content: string, 
    section: ContentSection, 
    newContent: string, 
    operation: 'replace' | 'append' | 'prepend' | 'insert_after' | 'insert_before',
    targetLine?: number
  ): string {
    const lines = content.split('\n');
    
    switch (operation) {
      case 'replace':
        // Replace entire section content
        const headerLine = lines[section.startLine];
        const newSectionLines = [headerLine, ...newContent.split('\n')];
        lines.splice(section.startLine, section.endLine - section.startLine + 1, ...newSectionLines);
        break;
        
      case 'append':
        // Add content at the end of section
        lines.splice(section.endLine + 1, 0, ...newContent.split('\n'));
        break;
        
      case 'prepend':
        // Add content at the beginning of section (after header)
        lines.splice(section.startLine + 1, 0, ...newContent.split('\n'));
        break;
        
      case 'insert_after':
        if (targetLine !== undefined) {
          lines.splice(targetLine + 1, 0, ...newContent.split('\n'));
        }
        break;
        
      case 'insert_before':
        if (targetLine !== undefined) {
          lines.splice(targetLine, 0, ...newContent.split('\n'));
        }
        break;
    }
    
    return lines.join('\n');
  }

  // Intelligent Update Method - Implements Gather-Analyze-Edit Workflow
  async updatePageIntelligent(updateData: IntelligentUpdatePageData): Promise<{ responseResult: { succeeded: boolean; errorCode?: number; message?: string } }> {
    try {
      // GATHER: Retrieve current page content
      const currentPage = await this.getPage(updateData.id);
      if (!currentPage) {
        throw new Error(`Page with ID ${updateData.id} not found`);
      }

      // ANALYZE: Parse content structure
      const sections = this.parseMarkdownSections(currentPage.content || '');
      let updatedContent = currentPage.content || '';

      // EDIT: Apply section-specific updates
      if (updateData.sectionUpdates) {
        for (const sectionUpdate of updateData.sectionUpdates) {
          const targetSection = this.findSectionByTitle(sections, sectionUpdate.sectionTitle);
          
          if (targetSection) {
            updatedContent = this.applySectionUpdate(
              updatedContent,
              targetSection,
              sectionUpdate.newContent,
              sectionUpdate.operation,
              sectionUpdate.targetLine
            );
            
            // Re-parse sections after each update to maintain accuracy
            const updatedSections = this.parseMarkdownSections(updatedContent);
            sections.length = 0;
            sections.push(...updatedSections);
          } else {
            console.warn(`Section "${sectionUpdate.sectionTitle}" not found in page ${updateData.id}`);
          }
        }
      }

      // Prepare final update data
      const finalUpdateData: UpdatePageData = {
        id: updateData.id,
        content: updatedContent,
        ...(updateData.globalUpdates || {})
      };

      // UPDATE: Apply changes using existing update method
      return await this.updatePage(finalUpdateData);
      
    } catch (error) {
      console.error('Error in intelligent update:', error);
      throw error;
    }
  }

  // Fallback method that combines intelligent update with delete-recreate strategy
  async updatePageRobust(updateData: IntelligentUpdatePageData): Promise<{ responseResult: { succeeded: boolean; errorCode?: number; message?: string } }> {
    try {
      // First try intelligent update
      return await this.updatePageIntelligent(updateData);
    } catch (error) {
      console.warn('Intelligent update failed, falling back to recreate strategy:', error);
      
      try {
        // GATHER: Get current page
        const currentPage = await this.getPage(updateData.id);
        if (!currentPage) {
          throw new Error(`Page with ID ${updateData.id} not found`);
        }

        // ANALYZE & EDIT: Apply updates to content
        const sections = this.parseMarkdownSections(currentPage.content || '');
        let updatedContent = currentPage.content || '';

        if (updateData.sectionUpdates) {
          for (const sectionUpdate of updateData.sectionUpdates) {
            const targetSection = this.findSectionByTitle(sections, sectionUpdate.sectionTitle);
            
            if (targetSection) {
              updatedContent = this.applySectionUpdate(
                updatedContent,
                targetSection,
                sectionUpdate.newContent,
                sectionUpdate.operation,
                sectionUpdate.targetLine
              );
            }
          }
        }

        // DELETE & RECREATE: Use the proven strategy
        await this.deletePage(updateData.id);
        
        const recreateData = {
          title: updateData.globalUpdates?.title || currentPage.title,
          content: updatedContent,
          path: currentPage.path,
          description: updateData.globalUpdates?.description || currentPage.description,
          tags: updateData.globalUpdates?.tags || currentPage.tags,
          isPublished: updateData.globalUpdates?.isPublished ?? currentPage.isPublished,
          isPrivate: updateData.globalUpdates?.isPrivate ?? currentPage.isPrivate,
          locale: currentPage.locale,
          editor: 'markdown'
        };

        return await this.createPage(recreateData);
        
      } catch (fallbackError) {
        console.error('Robust update fallback also failed:', fallbackError);
        throw fallbackError;
      }
    }
  }

  async deletePage(id: number): Promise<{ responseResult: { succeeded: boolean; errorCode?: number; message?: string } }> {
    const graphqlQuery = `
      mutation DeletePage($id: Int!) {
        pages {
          delete(id: $id) {
            responseResult {
              succeeded
              errorCode
              message
            }
          }
        }
      }
    `;

    const result = await this.executeGraphQL(graphqlQuery, { id });
    return result.pages.delete;
  }

  async searchUsers(query: string, limit: number = 10): Promise<WikiUser[]> {
    const graphqlQuery = `
      query SearchUsers($query: String!, $limit: Int!) {
        users {
          search(query: $query, limit: $limit) {
            id
            name
            email
            isActive
            isVerified
            createdAt
            lastLoginAt
          }
        }
      }
    `;

    const result = await this.executeGraphQL(graphqlQuery, { query, limit });
    return result.users.search;
  }

  async getUser(id: number): Promise<WikiUser> {
    const graphqlQuery = `
      query GetUser($id: Int!) {
        users {
          single(id: $id) {
            id
            name
            email
            isActive
            isVerified
            createdAt
            lastLoginAt
          }
        }
      }
    `;

    const result = await this.executeGraphQL(graphqlQuery, { id });
    return result.users.single;
  }

  async listGroups(): Promise<WikiGroup[]> {
    const graphqlQuery = `
      query ListGroups {
        groups {
          list {
            id
            name
            isSystem
            createdAt
            updatedAt
          }
        }
      }
    `;

    const result = await this.executeGraphQL(graphqlQuery);
    return result.groups.list;
  }

  async testConnection(): Promise<{ success: boolean; version?: string; error?: string }> {
    try {
      // Try a simple introspection query first
      const graphqlQuery = `
        query {
          __schema {
            queryType {
              name
            }
          }
        }
      `;

      const result = await this.executeGraphQL(graphqlQuery);
      
      // If introspection works, try to get system info
      if (result.__schema) {
        try {
          const systemQuery = `
            query {
              system {
                info {
                  currentVersion
                  latestVersion
                }
              }
            }
          `;
          const systemResult = await this.executeGraphQL(systemQuery);
          return {
            success: true,
            version: systemResult.system?.info?.currentVersion || 'Unknown',
          };
        } catch (systemError) {
          // System query failed, but connection works
          return {
            success: true,
            version: 'Connected (version unavailable)',
          };
        }
      }
      
      return {
        success: true,
        version: 'Connected',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}