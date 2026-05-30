import sqlite3 from 'sqlite3'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'

export class SearchDatabase {
  constructor(dbPath = './data/search.db') {
    this.dbPath = dbPath
    this.db = null
  }

  async init() {
    try {
      // Ensure data directory exists
      const dbDir = path.dirname(this.dbPath)
      await fs.mkdir(dbDir, { recursive: true })

      // Open database connection
      this.db = new sqlite3.Database(this.dbPath)

      // Promisify database methods
      this.db.run = promisify(this.db.run.bind(this.db))
      this.db.get = promisify(this.db.get.bind(this.db))
      this.db.all = promisify(this.db.all.bind(this.db))

      // Performance optimizations for bulk operations
      await this.db.run('PRAGMA journal_mode = WAL')  // Write-Ahead Logging (faster writes)
      await this.db.run('PRAGMA synchronous = NORMAL')  // Faster, still safe
      await this.db.run('PRAGMA cache_size = 10000')  // 10MB cache
      await this.db.run('PRAGMA temp_store = MEMORY')  // Temp tables in RAM
      await this.db.run('PRAGMA mmap_size = 30000000000')  // Memory-mapped I/O

      // Create FTS5 virtual table if not exists
      await this.createFTSTable()
      
      console.log('Search database initialized successfully')
    } catch (error) {
      console.error('Failed to initialize search database:', error)
      throw error
    }
  }

  async createFTSTable() {
    const createTableSQL = `
      CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
        project_id,
        project_name,
        session_id,
        session_title,
        message_id,
        role,
        content,
        timestamp,
        file_path,
        line_number,
        template
      )
    `

    await this.db.run(createTableSQL)

    // Create metadata table for tracking index status
    const metadataTableSQL = `
      CREATE TABLE IF NOT EXISTS search_metadata (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `

    await this.db.run(metadataTableSQL)

    // Create session metadata table for custom session names, tags, etc.
    const sessionMetadataTableSQL = `
      CREATE TABLE IF NOT EXISTS session_metadata (
        session_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        custom_title TEXT,
        original_title TEXT,
        is_hidden INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0,
        tags TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (session_id, project_id)
      )
    `

    await this.db.run(sessionMetadataTableSQL)

    // Migration: Add is_deleted column if it doesn't exist (for existing databases)
    try {
      await this.db.run('ALTER TABLE session_metadata ADD COLUMN is_deleted INTEGER DEFAULT 0')
      console.log('Migration: Added is_deleted column to session_metadata table')
    } catch (error) {
      // Column already exists, ignore error
      if (!error.message.includes('duplicate column name')) {
        console.error('Migration error:', error)
      }
    }

    // Migration: Add is_favorited column if it doesn't exist (for existing databases)
    try {
      await this.db.run('ALTER TABLE session_metadata ADD COLUMN is_favorited INTEGER DEFAULT 0')
      console.log('Migration: Added is_favorited column to session_metadata table')
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.error('Migration error:', error)
      }
    }

    // Create indexes for session_metadata table
    await this.db.run('CREATE INDEX IF NOT EXISTS idx_session_metadata_project ON session_metadata(project_id)')
    await this.db.run('CREATE INDEX IF NOT EXISTS idx_session_metadata_hidden ON session_metadata(is_hidden)')
    await this.db.run('CREATE INDEX IF NOT EXISTS idx_session_metadata_deleted ON session_metadata(is_deleted)')
    await this.db.run('CREATE INDEX IF NOT EXISTS idx_session_metadata_tags ON session_metadata(tags)')
    await this.db.run('CREATE INDEX IF NOT EXISTS idx_session_metadata_favorited ON session_metadata(is_favorited)')

    // Per-file watermark table powering incremental indexing.
    // One row per (project_id, session_id) recording how far into the JSONL
    // file we have indexed, so subsequent passes only parse appended lines.
    const indexedFilesTableSQL = `
      CREATE TABLE IF NOT EXISTS indexed_files (
        project_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        project_name TEXT,
        session_title TEXT,
        template TEXT,
        file_path TEXT NOT NULL,
        mtime_ms INTEGER NOT NULL,
        size_bytes INTEGER NOT NULL,
        bytes_indexed INTEGER NOT NULL,
        last_line_number INTEGER NOT NULL DEFAULT 0,
        prefix_sha TEXT,
        message_count INTEGER NOT NULL DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (project_id, session_id)
      )
    `
    await this.db.run(indexedFilesTableSQL)
    await this.db.run('CREATE INDEX IF NOT EXISTS idx_indexed_files_project ON indexed_files(project_id)')
  }

  async indexMessage({
    projectId,
    projectName,
    sessionId,
    sessionTitle,
    messageId,
    role,
    content,
    timestamp,
    filePath,
    lineNumber,
    template
  }) {
    const insertSQL = `
      INSERT OR REPLACE INTO messages_fts (
        project_id, project_name, session_id, session_title,
        message_id, role, content, timestamp, file_path,
        line_number, template
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    await this.db.run(insertSQL, [
      projectId, projectName, sessionId, sessionTitle,
      messageId, role, content, timestamp, filePath,
      lineNumber, template
    ])
  }

  async search({ query, projectId, role, from, to, limit = 50, offset = 0 }) {
    // Escape FTS5 query to handle terms like "ETL" that could be interpreted as column names
    const escapedQuery = this.escapeFTS5Query(query);

    let searchSQL = `
      SELECT
        project_id,
        project_name,
        session_id,
        session_title,
        message_id,
        role,
        snippet(messages_fts, 6, '<mark>', '</mark>', '...', 64) as snippet,
        timestamp,
        file_path,
        line_number,
        template,
        bm25(messages_fts) as relevance_score
      FROM messages_fts
      WHERE messages_fts MATCH ?
    `

    const params = [escapedQuery]
    
    // Add filters
    if (projectId) {
      searchSQL += ` AND project_id = ?`
      params.push(projectId)
    }
    
    if (role) {
      searchSQL += ` AND role = ?`
      params.push(role)
    }
    
    if (from) {
      searchSQL += ` AND datetime(timestamp) >= datetime(?)`
      params.push(from)
    }
    
    if (to) {
      searchSQL += ` AND datetime(timestamp) <= datetime(?)`
      params.push(to)
    }
    
    // Order by relevance
    searchSQL += ` ORDER BY bm25(messages_fts) LIMIT ? OFFSET ?`
    params.push(limit, offset)
    
    const results = await this.db.all(searchSQL, params)
    
    // Get total count
    let countSQL = `SELECT COUNT(*) as total FROM messages_fts WHERE messages_fts MATCH ?`
    const countParams = [escapedQuery]
    
    if (projectId) {
      countSQL += ` AND project_id = ?`
      countParams.push(projectId)
    }
    
    if (role) {
      countSQL += ` AND role = ?`
      countParams.push(role)
    }
    
    const countResult = await this.db.get(countSQL, countParams)
    
    return {
      hits: results.map(row => ({
        projectId: row.project_id,
        projectName: row.project_name,
        sessionId: row.session_id,
        sessionTitle: row.session_title,
        messageId: row.message_id,
        role: row.role,
        snippet: row.snippet.replace(/<mark>/g, '**').replace(/<\/mark>/g, '**'), // Convert to markdown
        timestamp: row.timestamp,
        score: Math.abs(row.relevance_score), // BM25 scores are negative
        line: row.line_number,
        template: row.template
      })),
      total: countResult.total,
      query,
      filters: { projectId, role, from, to }
    }
  }

  async clearIndex() {
    await this.db.run('DELETE FROM messages_fts')
    console.log('Search index cleared')
  }

  // Transaction management for bulk operations
  async beginTransaction() {
    await this.db.run('BEGIN TRANSACTION')
  }

  async commitTransaction() {
    await this.db.run('COMMIT')
  }

  async rollbackTransaction() {
    await this.db.run('ROLLBACK')
  }

  // Batch insert for performance (500-1000 messages at once)
  async indexMessagesBatch(messages) {
    if (messages.length === 0) return

    // Build multi-row INSERT statement
    const placeholders = messages.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')
    const insertSQL = `
      INSERT OR REPLACE INTO messages_fts (
        project_id, project_name, session_id, session_title,
        message_id, role, content, timestamp, file_path,
        line_number, template
      ) VALUES ${placeholders}
    `

    // Flatten all values into single array
    const values = messages.flatMap(msg => [
      msg.projectId, msg.projectName, msg.sessionId, msg.sessionTitle,
      msg.messageId, msg.role, msg.content, msg.timestamp, msg.filePath,
      msg.lineNumber, msg.template
    ])

    await this.db.run(insertSQL, values)
  }

  async getIndexStats() {
    try {
      const stats = await this.db.get(`
        SELECT 
          COUNT(*) as total_messages,
          COUNT(DISTINCT project_id) as total_projects,
          COUNT(DISTINCT session_id) as total_sessions
        FROM messages_fts
      `)
      
      const lastUpdated = await this.db.get(`
        SELECT value as last_updated 
        FROM search_metadata 
        WHERE key = 'last_full_index'
      `)
      
      return {
        ...stats,
        lastUpdated: lastUpdated?.last_updated || null
      }
    } catch (error) {
      // Table might not exist yet
      return {
        total_messages: 0,
        total_projects: 0,
        total_sessions: 0,
        lastUpdated: null
      }
    }
  }

  async setMetadata(key, value) {
    await this.db.run(`
      INSERT OR REPLACE INTO search_metadata (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `, [key, value])
  }

  escapeFTS5Query(query) {
    // Handle FTS5 special characters and terms that could be interpreted as column names
    // Escape double quotes and wrap the entire query in double quotes for literal search
    const escaped = query.replace(/"/g, '""');

    // For simple terms that could conflict with column names, wrap in quotes
    // This handles cases like "ETL", "FROM", "SELECT" etc.
    if (/^[A-Z_][A-Z0-9_-]*$/i.test(query.trim())) {
      return `"${escaped}"`;
    }

    // For complex queries, just escape quotes and return as-is
    return escaped;
  }

  // ---- Incremental indexing: per-file watermark tracking ----

  async getIndexedFile(projectId, sessionId) {
    return await this.db.get(
      'SELECT * FROM indexed_files WHERE project_id = ? AND session_id = ?',
      [projectId, sessionId]
    )
  }

  async getIndexedFilesForProject(projectId) {
    return (await this.db.all(
      'SELECT * FROM indexed_files WHERE project_id = ?',
      [projectId]
    )) || []
  }

  async getAllIndexedFiles() {
    return (await this.db.all('SELECT * FROM indexed_files')) || []
  }

  async upsertIndexedFile(record) {
    await this.db.run(`
      INSERT OR REPLACE INTO indexed_files (
        project_id, session_id, project_name, session_title, template,
        file_path, mtime_ms, size_bytes, bytes_indexed, last_line_number,
        prefix_sha, message_count, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      record.projectId, record.sessionId, record.projectName, record.sessionTitle,
      record.template, record.filePath, record.mtimeMs, record.sizeBytes,
      record.bytesIndexed, record.lastLineNumber, record.prefixSha, record.messageCount
    ])
  }

  async deleteIndexedFile(projectId, sessionId) {
    await this.db.run(
      'DELETE FROM indexed_files WHERE project_id = ? AND session_id = ?',
      [projectId, sessionId]
    )
  }

  async clearIndexedFiles() {
    await this.db.run('DELETE FROM indexed_files')
  }

  // Delete all FTS rows for a session (used by the full-reindex fallback).
  async deleteSessionRows(projectId, sessionId) {
    await this.db.run(
      'DELETE FROM messages_fts WHERE project_id = ? AND session_id = ?',
      [projectId, sessionId]
    )
  }

  // Preserve a session's currently-indexed rows by re-keying them to an
  // archived session_id, instead of deleting them. Used when a file shrinks
  // or is rewritten (compaction corruption, manual edit) so previously
  // indexed conversation content remains searchable.
  async archiveSessionRows(projectId, sessionId, archiveSuffix, titleSuffix = ' (archived)') {
    await this.db.run(`
      UPDATE messages_fts
         SET session_id = session_id || ?,
             session_title = session_title || ?
       WHERE project_id = ? AND session_id = ?
    `, [archiveSuffix, titleSuffix, projectId, sessionId])
  }

  async close() {
    if (this.db) {
      await new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    }
  }
}