#!/usr/bin/env node

/**
 * Simple test script to verify Wiki.js MCP server functionality
 * Run with: node examples/test-connection.js
 */

import { WikiJsClient } from '../dist/wikijs-client.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testConnection() {
  console.log('🔍 Testing Wiki.js MCP Server Connection...');
  
  const client = new WikiJsClient({
    baseUrl: process.env.WIKIJS_URL || 'http://localhost:3000',
    apiToken: process.env.WIKIJS_API_TOKEN,
    username: process.env.WIKIJS_USERNAME,
    password: process.env.WIKIJS_PASSWORD,
  });

  try {
    // Test connection
    console.log('\n📡 Testing connection...');
    const connectionTest = await client.testConnection();
    
    if (connectionTest.success) {
      console.log('✅ Connection successful!');
      console.log(`📋 Wiki.js Version: ${connectionTest.version}`);
    } else {
      console.log('❌ Connection failed:');
      console.log(`   Error: ${connectionTest.error}`);
      return;
    }

    // Test listing pages
    console.log('\n📄 Testing page listing...');
    const pages = await client.listPages(5, 0);
    console.log(`✅ Found ${pages.length} pages`);
    
    if (pages.length > 0) {
      console.log('   Sample pages:');
      pages.forEach((page, index) => {
        console.log(`   ${index + 1}. ${page.title} (${page.path})`);
      });
    }

    // Test listing groups
    console.log('\n👥 Testing group listing...');
    const groups = await client.listGroups();
    console.log(`✅ Found ${groups.length} groups`);
    
    if (groups.length > 0) {
      console.log('   Groups:');
      groups.forEach((group, index) => {
        console.log(`   ${index + 1}. ${group.name} (ID: ${group.id})`);
      });
    }

    console.log('\n🎉 All tests passed! Wiki.js MCP server is ready to use.');
    
  } catch (error) {
    console.log('❌ Test failed:');
    console.error('   Error:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Check if Wiki.js is running and accessible');
    console.log('   2. Verify your API token or credentials in .env file');
    console.log('   3. Ensure the GraphQL endpoint is available at /graphql');
    console.log('   4. Check if your API token has sufficient permissions');
  }
}

// Run the test
testConnection().catch(console.error);