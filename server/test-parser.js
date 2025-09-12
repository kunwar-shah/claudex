import { FileScanner } from './src/services/fileScanner.js';
import { SessionParser } from './src/services/sessionParser.js';
import dotenv from 'dotenv';

dotenv.config();

async function testRealData() {
  console.log('🔍 Testing Claude Code Viewer with real data...\n');
  
  try {
    const projectsRoot = process.env.PROJECT_ROOT || '/home/boss/.claude/projects';
    console.log(`📁 Projects root: ${projectsRoot}`);
    
    const fileScanner = new FileScanner(projectsRoot);
    const sessionParser = new SessionParser();
    
    // 1. Test project scanning
    console.log('\n📊 Scanning projects...');
    const projects = await fileScanner.scanProjects();
    console.log(`Found ${projects.length} projects:`);
    
    projects.forEach((project, i) => {
      console.log(`  ${i + 1}. ${project.name} (${project.lastModified})`);
    });
    
    if (projects.length === 0) {
      console.log('❌ No projects found! Check PROJECT_ROOT path.');
      return;
    }
    
    // 2. Test session scanning for first project
    const firstProject = projects[0];
    console.log(`\n📂 Scanning sessions in: ${firstProject.name}`);
    
    const sessions = await fileScanner.scanSessions(firstProject.path);
    console.log(`Found ${sessions.length} sessions:`);
    
    sessions.slice(0, 3).forEach((session, i) => {
      console.log(`  ${i + 1}. ${session.sessionId} (${session.messageCount} messages)`);
    });
    
    if (sessions.length === 0) {
      console.log('❌ No sessions found in project!');
      return;
    }
    
    // 3. Test session parsing
    const firstSession = sessions[0];
    console.log(`\n🔧 Parsing session: ${firstSession.sessionId}`);
    
    // Get sample messages for template detection
    const sampleMessages = await fileScanner.getSessionFirstMessages(firstSession.filePath, 5);
    console.log(`Sample messages for template detection: ${sampleMessages.length}`);
    
    sampleMessages.forEach((sample, i) => {
      console.log(`  ${i + 1}. Type: ${sample.type || 'unknown'}, UUID: ${sample.uuid?.substring(0, 8) || 'none'}`);
    });
    
    // Parse full session
    const result = await sessionParser.parseSession(firstSession.filePath, sampleMessages);
    console.log(`\n✅ Parsed successfully:`);
    console.log(`  Template detected: ${result.template}`);
    console.log(`  Messages parsed: ${result.messages.length}`);
    console.log(`  Lines skipped: ${result.stats.skippedLines}`);
    
    // Show sample parsed messages
    console.log(`\n📝 Sample parsed messages:`);
    result.messages.slice(0, 3).forEach((msg, i) => {
      console.log(`  ${i + 1}. [${msg.role}] ${msg.content.substring(0, 80)}...`);
      if (msg.toolsUsed.length > 0) {
        console.log(`     Tools: ${msg.toolsUsed.map(t => t.name).join(', ')}`);
      }
      if (msg.actions.length > 0) {
        console.log(`     Actions: ${msg.actions.join(', ')}`);
      }
    });
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  }
}

testRealData();