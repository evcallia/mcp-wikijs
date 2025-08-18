require('dotenv').config();
const { WikiJsClient } = require('./dist/wikijs-client');

const config = {
  baseUrl: process.env.WIKIJS_URL,
  apiToken: process.env.WIKIJS_API_TOKEN
};

const client = new WikiJsClient(config);

async function testSearchSchema() {
  console.log('Testing search with PageSearchResult subfields...');
  
  // Test with common PageSearchResult fields
  try {
    console.log('\n1. Testing search with basic PageSearchResult fields...');
    const query1 = `
      query SearchPages($query: String!) {
        pages {
          search(query: $query) {
            results {
              id
              title
              path
            }
          }
        }
      }
    `;
    const result1 = await client.executeGraphQL(query1, { query: 'MCP' });
    console.log('✅ Search with basic fields succeeded:', JSON.stringify(result1, null, 2));
  } catch (error) {
    console.log('❌ Search with basic fields failed:', error.message);
  }
  
  // Test with more fields
  try {
    console.log('\n2. Testing search with extended PageSearchResult fields...');
    const query2 = `
      query SearchPages($query: String!) {
        pages {
          search(query: $query) {
            results {
              id
              title
              path
              description
              locale
            }
          }
        }
      }
    `;
    const result2 = await client.executeGraphQL(query2, { query: 'MCP' });
    console.log('✅ Search with extended fields succeeded:', JSON.stringify(result2, null, 2));
  } catch (error) {
    console.log('❌ Search with extended fields failed:', error.message);
  }
  
  // Test with totalHits and results
  try {
    console.log('\n3. Testing search with totalHits and results...');
    const query3 = `
      query SearchPages($query: String!) {
        pages {
          search(query: $query) {
            totalHits
            results {
              id
              title
              path
            }
          }
        }
      }
    `;
    const result3 = await client.executeGraphQL(query3, { query: 'MCP' });
    console.log('✅ Search with totalHits succeeded:', JSON.stringify(result3, null, 2));
  } catch (error) {
    console.log('❌ Search with totalHits failed:', error.message);
  }
}

testSearchSchema().catch(console.error);