import { FileScanner } from './fileScanner.js'
import { SessionParser } from './sessionParser.js'
import { SearchDatabase } from './searchDatabase.js'
import { getProjectRoot } from '../utils/pathHelper.js'

export class SearchIndexer {
  constructor(projectsRoot = getProjectRoot()) {
    this.projectsRoot = projectsRoot
    this.fileScanner = new FileScanner(projectsRoot)
    this.sessionParser = new SessionParser()
    this.searchDb = new SearchDatabase()
  }

  async init() {
    await this.searchDb.init()
  }

  async buildFullIndex() {
    console.log('🔍 Starting full search index build...')
    const startTime = Date.now()
    
    try {
      // Clear existing index
      await this.searchDb.clearIndex()
      
      // Get all projects
      const projects = await this.fileScanner.scanProjects()
      let totalMessages = 0
      let totalSessions = 0
      
      for (const project of projects) {
        console.log(`📂 Indexing project: ${project.name}`)
        
        const sessions = await this.fileScanner.scanSessions(project.path)
        totalSessions += sessions.length
        
        for (const session of sessions) {
          try {
            // Parse the entire session
            const result = await this.sessionParser.parseSession(session.filePath)
            
            // Index each message
            for (const message of result.messages) {
              await this.searchDb.indexMessage({
                projectId: project.id,
                projectName: project.name,
                sessionId: session.sessionId,
                sessionTitle: session.title || session.sessionId,
                messageId: message.id,
                role: message.role,
                content: message.content,
                timestamp: message.timestamp,
                filePath: session.filePath,
                lineNumber: message.lineNumber,
                template: result.template
              })
              
              totalMessages++
            }
            
            // Log progress every 50 sessions
            if (totalSessions % 50 === 0) {
              console.log(`   ✓ Indexed ${totalSessions} sessions, ${totalMessages} messages`)
            }
            
          } catch (sessionError) {
            console.warn(`   ⚠️  Failed to index session ${session.sessionId}:`, sessionError.message)
          }
        }
      }
      
      // Update metadata
      await this.searchDb.setMetadata('last_full_index', new Date().toISOString())
      await this.searchDb.setMetadata('total_messages', totalMessages.toString())
      await this.searchDb.setMetadata('total_projects', projects.length.toString())
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`✅ Search index built successfully!`)
      console.log(`   📊 ${projects.length} projects, ${totalSessions} sessions, ${totalMessages} messages`)
      console.log(`   ⏱️  Completed in ${duration} seconds`)
      
      return {
        success: true,
        stats: {
          projects: projects.length,
          sessions: totalSessions,
          messages: totalMessages,
          duration: parseFloat(duration)
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to build search index:', error)
      throw error
    }
  }

  async updateSessionIndex(sessionFilePath) {
    try {
      // Parse session
      const result = await this.sessionParser.parseSession(sessionFilePath)
      
      // Extract project and session info from path
      const pathParts = sessionFilePath.split('/')
      const projectId = pathParts[pathParts.length - 2]
      const sessionId = pathParts[pathParts.length - 1].replace('.jsonl', '')
      
      // Clean project name
      const projectName = this.fileScanner.cleanProjectName(projectId)
      
      // Remove existing messages for this session
      await this.searchDb.db.run(
        'DELETE FROM messages_fts WHERE session_id = ? AND project_id = ?',
        [sessionId, projectId]
      )
      
      // Re-index all messages in the session
      for (const message of result.messages) {
        await this.searchDb.indexMessage({
          projectId,
          projectName,
          sessionId,
          sessionTitle: sessionId, // TODO: Extract title from messages
          messageId: message.id,
          role: message.role,
          content: message.content,
          timestamp: message.timestamp,
          filePath: sessionFilePath,
          lineNumber: message.lineNumber,
          template: result.template
        })
      }
      
      console.log(`✅ Updated index for session ${sessionId} (${result.messages.length} messages)`)
      
    } catch (error) {
      console.error(`❌ Failed to update session index for ${sessionFilePath}:`, error)
      throw error
    }
  }

  async getIndexStatus() {
    const stats = await this.searchDb.getIndexStats()
    return {
      isIndexed: stats.total_messages > 0,
      stats
    }
  }

  async search(params) {
    return await this.searchDb.search(params)
  }

  async close() {
    await this.searchDb.close()
  }
}