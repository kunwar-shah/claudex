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