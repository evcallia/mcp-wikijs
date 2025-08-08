#!/usr/bin/env node

/**
 * Example: Using the Intelligent Update Functionality
 * 
 * This example demonstrates the new gather-analyze-edit workflow
 * for updating Wiki.js pages with precision and reliability.
 */

const { WikiJsClient } = require('../dist/wikijs-client.js');
require('dotenv').config();

async function demonstrateIntelligentUpdate() {
  const client = new WikiJsClient({
    baseUrl: process.env.WIKIJS_URL || 'http://localhost:3000',
    apiToken: process.env.WIKIJS_API_TOKEN,
    graphqlPath: '/graphql'
  });

  try {
    console.log('🔍 Testing Intelligent Update Functionality\n');

    // Example 1: Update a specific section
    console.log('📝 Example 1: Updating ICT Organizational Structure');
    const organizationUpdate = {
      id: 6, // Replace with actual page ID
      sectionUpdates: [
        {
          sectionTitle: 'ICT Organizational Structure',
          newContent: `
## Updated ICT Team Structure

### ICT Superintendent
- **Name**: Adhi Surahman
- **Email**: adhi.surahman@company.com
- **Responsibilities**: Overall ICT strategy and leadership

### ICT System & Support SPV
- **Name**: Widji Santoso
- **Email**: widji.santoso@company.com
- **Responsibilities**: System administration, user support, application development

### ICT Infrastructure & Network SPV
- **Status**: TBC (To Be Confirmed)
- **Responsibilities**: Network infrastructure, security, hardware management

### Document Control
- **Department**: Ochart Document Control
- **Reports to**: ICT Superintendent
- **Responsibilities**: 
  - Document version control
  - Access management
  - Compliance documentation
  - Change tracking
`,
          operation: 'replace'
        }
      ],
      globalUpdates: {
        description: 'Updated ICT organizational structure with latest personnel assignments'
      }
    };

    // Try intelligent update first
    try {
      const result = await client.updatePageIntelligent(organizationUpdate);
      console.log('✅ Intelligent update successful:', result.responseResult);
    } catch (error) {
      console.log('⚠️  Intelligent update failed, trying robust method...');
      const robustResult = await client.updatePageRobust(organizationUpdate);
      console.log('✅ Robust update successful:', robustResult.responseResult);
    }

    console.log('\n📝 Example 2: Adding new content to existing section');
    const contentAddition = {
      id: 6, // Replace with actual page ID
      sectionUpdates: [
        {
          sectionTitle: 'Project Documentation',
          newContent: `
### New Documentation Standards
- All technical documents must follow the established template
- Version control is mandatory for all project documents
- Regular reviews are scheduled monthly
`,
          operation: 'append'
        }
      ]
    };

    try {
      const result = await client.updatePageRobust(contentAddition);
      console.log('✅ Content addition successful:', result.responseResult);
    } catch (error) {
      console.error('❌ Content addition failed:', error.message);
    }

    console.log('\n📝 Example 3: Multiple section updates');
    const multipleUpdates = {
      id: 6, // Replace with actual page ID
      sectionUpdates: [
        {
          sectionTitle: 'Contact Information',
          newContent: `
**Updated Contact Details:**
- ICT Help Desk: ext. 1234
- Emergency Support: +62-xxx-xxx-xxxx
- Email: ict-support@company.com
`,
          operation: 'replace'
        },
        {
          sectionTitle: 'Quick Links',
          newContent: `
- [Internal Wiki](http://wiki.internal)
- [Project Management](http://pm.internal)
- [Document Repository](http://docs.internal)
`,
          operation: 'prepend'
        }
      ],
      globalUpdates: {
        tags: ['ict', 'organization', 'contacts', 'updated']
      }
    };

    try {
      const result = await client.updatePageRobust(multipleUpdates);
      console.log('✅ Multiple updates successful:', result.responseResult);
    } catch (error) {
      console.error('❌ Multiple updates failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

// Utility function to demonstrate content analysis
async function demonstrateContentAnalysis() {
  const client = new WikiJsClient({
    baseUrl: process.env.WIKIJS_URL || 'http://localhost:3000',
    apiToken: process.env.WIKIJS_API_TOKEN,
    graphqlPath: '/graphql'
  });

  try {
    console.log('\n🔍 Content Analysis Demo\n');
    
    // Get a page and analyze its structure
    const page = await client.getPage(6); // Replace with actual page ID
    console.log('📄 Page Title:', page.title);
    console.log('📊 Content Length:', page.content?.length || 0, 'characters');
    
    // Note: The parseMarkdownSections method is private, but this shows the concept
    console.log('\n📋 This is what the intelligent update system does:');
    console.log('1. 🔍 GATHER: Retrieves current page content');
    console.log('2. 🧠 ANALYZE: Parses markdown sections and identifies structure');
    console.log('3. ✏️  EDIT: Applies selective modifications to specific sections');
    console.log('4. 💾 UPDATE: Saves the modified content back to Wiki.js');
    console.log('5. 🔄 FALLBACK: Uses delete-recreate if direct update fails');
    
  } catch (error) {
    console.error('❌ Analysis demo failed:', error.message);
  }
}

if (require.main === module) {
  console.log('🚀 Starting Intelligent Update Demo\n');
  
  demonstrateIntelligentUpdate()
    .then(() => demonstrateContentAnalysis())
    .then(() => {
      console.log('\n✅ Demo completed successfully!');
      console.log('\n📚 Key Benefits of Intelligent Update:');
      console.log('   • Precise section-level modifications');
      console.log('   • Preserves existing content structure');
      console.log('   • Automatic fallback to reliable methods');
      console.log('   • Better error handling and recovery');
      console.log('   • Maintains content integrity');
    })
    .catch(error => {
      console.error('❌ Demo failed:', error);
      process.exit(1);
    });
}

module.exports = {
  demonstrateIntelligentUpdate,
  demonstrateContentAnalysis
};