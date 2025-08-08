#!/usr/bin/env node

/**
 * Usage example for Wiki.js MCP server
 * This demonstrates how to use the WikiJsClient directly
 */

import { WikiJsClient } from '../dist/wikijs-client.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function demonstrateUsage() {
  console.log('🚀 Wiki.js MCP Server Usage Example\n');
  
  const client = new WikiJsClient({
    baseUrl: process.env.WIKIJS_URL || 'http://localhost:3000',
    apiToken: process.env.WIKIJS_API_TOKEN,
  });

  try {
    // 1. Test connection
    console.log('1️⃣ Testing connection...');
    const connectionTest = await client.testConnection();
    console.log(`   Status: ${connectionTest.success ? '✅ Connected' : '❌ Failed'}`);
    if (connectionTest.version) {
      console.log(`   Version: ${connectionTest.version}`);
    }
    if (!connectionTest.success) {
      console.log(`   Error: ${connectionTest.error}`);
      return;
    }

    // 2. List existing pages
    console.log('\n2️⃣ Listing existing pages...');
    const pages = await client.listPages(10, 0);
    console.log(`   Found ${pages.length} pages`);
    pages.forEach((page, index) => {
      console.log(`   ${index + 1}. "${page.title}" (${page.path})`);
    });

    // 3. List groups
    console.log('\n3️⃣ Listing groups...');
    const groups = await client.listGroups();
    console.log(`   Found ${groups.length} groups`);
    groups.forEach((group, index) => {
      console.log(`   ${index + 1}. ${group.name} (ID: ${group.id})`);
    });

    // 4. Search pages (if any exist)
    if (pages.length > 0) {
      console.log('\n4️⃣ Searching pages...');
      const searchResults = await client.searchPages('test', 5);
      console.log(`   Search results: ${searchResults.length} pages found`);
    }

    // 5. Example: Create a test page (commented out to avoid creating unwanted content)
    console.log('\n5️⃣ Example: Creating a test page (commented out)');
    console.log('   // const newPage = await client.createPage({');
    console.log('   //   title: "Test Page",');
    console.log('   //   content: "This is a test page created via MCP",');
    console.log('   //   path: "test-page",');
    console.log('   //   description: "A test page",');
    console.log('   //   isPublished: true,');
    console.log('   //   locale: "en"');
    console.log('   // });');

    console.log('\n🎉 Usage example completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Add this MCP server to your Claude Desktop configuration');
    console.log('   2. Use the MCP tools in your conversations with Claude');
    console.log('   3. Create, update, and manage Wiki.js content through the MCP interface');

  } catch (error) {
    console.error('❌ Error during usage example:', error.message);
  }
}

demonstrateUsage().catch(console.error);