import fs from 'fs'
import crypto from 'crypto'
import { FileScanner } from './fileScanner.js'
import { SessionParser } from './sessionParser.js'
import { SearchDatabase } from './searchDatabase.js'
import { getProjectRoot } from '../utils/pathHelper.js'
import { extractTitleFromMessages } from '../utils/titleExtractor.js'

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

  async buildFullIndex(progressCallback = null) {
    console.log('🔍 Starting full search index build...')
    const startTime = Date.now()

    try {
      // Clear existing index and per-file watermarks (full reset)
      await this.searchDb.clearIndex()
      await this.searchDb.clearIndexedFiles()

      // Start transaction for massive performance boost
      await this.searchDb.beginTransaction()

      // Get all projects
      const projects = await this.fileScanner.scanProjects()
      let totalMessages = 0
      let processedSessions = 0

      // Batch buffer for bulk inserts (500 messages per batch)
      const BATCH_SIZE = 500
      let messageBatch = []

      // Count total sessions first for accurate progress
      let totalSessions = 0
      for (const project of projects) {
        const sessions = await this.fileScanner.scanSessions(project.path)
        totalSessions += sessions.length
      }

      // Report initial progress
      if (progressCallback) {
        progressCallback({
          progress: 0,
          totalMessages,
          currentSession: 0,
          totalSessions
        })
      }

      for (const project of projects) {
        console.log(`📂 Indexing project: ${project.name}`)

        const sessions = await this.fileScanner.scanSessions(project.path)

        for (const session of sessions) {
          try {
            // Parse the entire session
            const result = await this.sessionParser.parseSession(session.filePath)

            // Add messages to batch buffer
            for (const message of result.messages) {
              messageBatch.push({
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

              // Flush batch when it reaches batch size
              if (messageBatch.length >= BATCH_SIZE) {
                await this.searchDb.indexMessagesBatch(messageBatch)
                messageBatch = []
              }
            }

            // Record the per-file watermark so later incremental passes can
            // skip this session (unchanged) or parse only appended lines.
            try {
              const st = await fs.promises.stat(session.filePath)
              const sizeBytes = st.size
              const prefixSha = await this._hashPrefix(session.filePath, sizeBytes)
              await this.searchDb.upsertIndexedFile({
                projectId: project.id,
                sessionId: session.sessionId,
                projectName: project.name,
                sessionTitle: session.title || session.sessionId,
                template: result.template,
                filePath: session.filePath,
                mtimeMs: Math.floor(st.mtimeMs),
                sizeBytes,
                bytesIndexed: sizeBytes,
                lastLineNumber: result.stats.totalLines,
                prefixSha,
                messageCount: result.messages.length
              })
            } catch (trackErr) {
              console.warn(`   ⚠️  Failed to record watermark for ${session.sessionId}:`, trackErr.message)
            }

            processedSessions++

            // Report progress after each session
            if (progressCallback) {
              const progress = Math.floor((processedSessions / totalSessions) * 100)
              progressCallback({
                progress,
                totalMessages,
                currentSession: processedSessions,
                totalSessions
              })
            }

            // Log progress every 10 sessions
            if (processedSessions % 10 === 0) {
              console.log(`   ✓ Indexed ${processedSessions}/${totalSessions} sessions, ${totalMessages} messages`)
            }

          } catch (sessionError) {
            console.warn(`   ⚠️  Failed to index session ${session.sessionId}:`, sessionError.message)
            processedSessions++
          }
        }
      }

      // Flush any remaining messages in batch
      if (messageBatch.length > 0) {
        await this.searchDb.indexMessagesBatch(messageBatch)
      }
      
      // Update metadata
      await this.searchDb.setMetadata('last_full_index', new Date().toISOString())
      await this.searchDb.setMetadata('total_messages', totalMessages.toString())
      await this.searchDb.setMetadata('total_projects', projects.length.toString())

      // Commit transaction (write to disk once)
      await this.searchDb.commitTransaction()

      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`✅ Search index built successfully!`)
      console.log(`   📊 ${projects.length} projects, ${totalSessions} sessions, ${totalMessages} messages`)
      console.log(`   ⏱️  Completed in ${duration} seconds`)

      // Report final progress
      if (progressCallback) {
        progressCallback({
          progress: 100,
          totalMessages,
          currentSession: totalSessions,
          totalSessions
        })
      }

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
      // Rollback transaction on error
      try {
        await this.searchDb.rollbackTransaction()
      } catch (rollbackError) {
        console.error('Failed to rollback transaction:', rollbackError)
      }
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
      
      // Extract session title from messages
      const sessionTitle = extractTitleFromMessages(result.messages, sessionId)

      // Re-index all messages in the session
      for (const message of result.messages) {
        await this.searchDb.indexMessage({
          projectId,
          projectName,
          sessionId,
          sessionTitle,
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

  // SHA-256 of the first `byteLength` bytes of a file. Used to detect whether
  // a changed file was appended-to (prefix unchanged) or rewritten (prefix
  // differs / file shrank).
  async _hashPrefix(filePath, byteLength) {
    if (!byteLength || byteLength <= 0) {
      return crypto.createHash('sha256').digest('hex')
    }
    return await new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256')
      const stream = fs.createReadStream(filePath, { start: 0, end: byteLength - 1 })
      stream.on('data', chunk => hash.update(chunk))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', reject)
    })
  }

  async _insertBatched(messages, batchSize = 500) {
    for (let i = 0; i < messages.length; i += batchSize) {
      await this.searchDb.indexMessagesBatch(messages.slice(i, i + batchSize))
    }
  }

  // Index an entire session from byte 0 and (re)write its watermark row.
  // Used for newly-seen sessions and for the reindex half of archive-on-rewrite.
  async _indexSessionFull(project, sessionMeta) {
    const { sessionId, filePath, size, mtimeMs } = sessionMeta
    const title = await this.fileScanner.getSessionTitle(filePath, sessionId)
    const parsed = await this.sessionParser.parseSessionFrom(filePath, 0, 0)

    const batch = parsed.messages.map(m => ({
      projectId: project.id,
      projectName: project.name,
      sessionId,
      sessionTitle: title || sessionId,
      messageId: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      filePath,
      lineNumber: m.lineNumber,
      template: parsed.template
    }))
    await this._insertBatched(batch)

    const prefixSha = await this._hashPrefix(filePath, parsed.endByte)
    await this.searchDb.upsertIndexedFile({
      projectId: project.id,
      sessionId,
      projectName: project.name,
      sessionTitle: title || sessionId,
      template: parsed.template,
      filePath,
      mtimeMs,
      sizeBytes: size,
      bytesIndexed: parsed.endByte,
      lastLineNumber: parsed.lastLineNumber,
      prefixSha,
      messageCount: batch.length
    })
    return batch.length
  }

  /**
   * Incrementally bring the index up to date with the JSONL files on disk,
   * without re-reading unchanged sessions.
   *
   * Per session:
   *  - unchanged (size + mtime match watermark) → skip, no file read
   *  - new (no watermark)                        → full index
   *  - grown, prefix unchanged                   → parse & index only appended lines
   *  - shrunk or prefix changed (rewrite/        → ARCHIVE existing rows (re-key,
   *    compaction corruption/manual edit)          don't delete) then reindex fresh
   *  - watermark exists but file gone (orphan)   → ARCHIVE existing rows, drop watermark
   *
   * Archiving preserves previously-indexed conversation content so it stays
   * searchable even if the source file is rewritten or removed.
   */
  async buildIncrementalIndex(progressCallback = null) {
    console.log('🔁 Starting incremental search index update...')
    const startTime = Date.now()
    const summary = {
      sessions: 0, skipped: 0, newSessions: 0,
      appended: 0, archived: 0, orphaned: 0, messagesAdded: 0
    }

    try {
      const projects = await this.fileScanner.scanProjects()

      // Stat-only scan up front (cheap) for accurate progress + change detection.
      const perProject = []
      let totalSessions = 0
      for (const project of projects) {
        const sessions = await this.fileScanner.statSessions(project.path)
        perProject.push({ project, sessions })
        totalSessions += sessions.length
      }
      summary.sessions = totalSessions

      await this.searchDb.beginTransaction()

      const seen = new Set()
      let processed = 0

      for (const { project, sessions } of perProject) {
        for (const s of sessions) {
          seen.add(`${project.id}\n${s.sessionId}`)
          const tracked = await this.searchDb.getIndexedFile(project.id, s.sessionId)

          if (!tracked) {
            summary.messagesAdded += await this._indexSessionFull(project, s)
            summary.newSessions++
          } else if (tracked.size_bytes === s.size && tracked.mtime_ms === s.mtimeMs) {
            summary.skipped++
          } else {
            const prefixLen = Math.min(tracked.bytes_indexed, s.size)
            const curPrefixSha = await this._hashPrefix(s.filePath, prefixLen)
            const isAppend = s.size >= tracked.bytes_indexed && curPrefixSha === tracked.prefix_sha

            if (isAppend) {
              const parsed = await this.sessionParser.parseSessionFrom(
                s.filePath, tracked.bytes_indexed, tracked.last_line_number
              )
              if (parsed.messages.length > 0) {
                const batch = parsed.messages.map(m => ({
                  projectId: project.id,
                  projectName: tracked.project_name || project.name,
                  sessionId: s.sessionId,
                  sessionTitle: tracked.session_title || s.sessionId,
                  messageId: m.id,
                  role: m.role,
                  content: m.content,
                  timestamp: m.timestamp,
                  filePath: s.filePath,
                  lineNumber: m.lineNumber,
                  template: tracked.template || parsed.template
                }))
                await this._insertBatched(batch)
                summary.appended += batch.length
                summary.messagesAdded += batch.length
              }
              const newBytesIndexed = Math.max(parsed.endByte, tracked.bytes_indexed)
              const prefixSha = await this._hashPrefix(s.filePath, newBytesIndexed)
              await this.searchDb.upsertIndexedFile({
                projectId: project.id,
                sessionId: s.sessionId,
                projectName: tracked.project_name || project.name,
                sessionTitle: tracked.session_title || s.sessionId,
                template: tracked.template || parsed.template,
                filePath: s.filePath,
                mtimeMs: s.mtimeMs,
                sizeBytes: s.size,
                bytesIndexed: newBytesIndexed,
                lastLineNumber: parsed.lastLineNumber,
                prefixSha,
                messageCount: (tracked.message_count || 0) + parsed.messages.length
              })
            } else {
              // Rewrite / shrink / compaction corruption: preserve, don't lose.
              await this.searchDb.archiveSessionRows(project.id, s.sessionId, `#archived-${tracked.mtime_ms}`)
              summary.messagesAdded += await this._indexSessionFull(project, s)
              summary.archived++
            }
          }

          processed++
          if (progressCallback) {
            progressCallback({
              progress: totalSessions ? Math.floor((processed / totalSessions) * 100) : 100,
              totalMessages: summary.messagesAdded,
              currentSession: processed,
              totalSessions
            })
          }
        }
      }

      // Orphan sweep: watermarks whose source file is no longer on disk.
      // Preserve their content by archiving rather than deleting.
      const allTracked = await this.searchDb.getAllIndexedFiles()
      for (const row of allTracked) {
        if (!seen.has(`${row.project_id}\n${row.session_id}`)) {
          await this.searchDb.archiveSessionRows(row.project_id, row.session_id, `#archived-${row.mtime_ms}`)
          await this.searchDb.deleteIndexedFile(row.project_id, row.session_id)
          summary.orphaned++
        }
      }

      await this.searchDb.setMetadata('last_incremental_index', new Date().toISOString())
      const stats = await this.searchDb.getIndexStats()
      await this.searchDb.setMetadata('total_messages', String(stats.total_messages))

      await this.searchDb.commitTransaction()

      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`✅ Incremental update complete in ${duration}s`, summary)

      if (progressCallback) {
        progressCallback({
          progress: 100,
          totalMessages: summary.messagesAdded,
          currentSession: totalSessions,
          totalSessions
        })
      }

      return { success: true, mode: 'incremental', stats: { ...summary, duration: parseFloat(duration) } }

    } catch (error) {
      console.error('❌ Incremental index update failed:', error)
      try {
        await this.searchDb.rollbackTransaction()
      } catch (rollbackError) {
        console.error('Failed to rollback transaction:', rollbackError)
      }
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