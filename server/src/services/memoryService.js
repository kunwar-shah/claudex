/**
 * MemoryService — Coding-domain structured memory for Claudex MCP.
 *
 * Stores structured memories per project: codebase maps, conventions,
 * decisions, focus snapshots, error patterns, and dependencies.
 *
 * Uses the same SQLite db instance as SearchDatabase (shared via constructor).
 */
export class MemoryService {
  /**
   * @param {import('./searchDatabase.js').SearchDatabase} searchDb
   */
  constructor(searchDb) {
    this.searchDb = searchDb
  }

  async init() {
    if (!this.searchDb.db) {
      await this.searchDb.init()
    }

    // Create memories table (coding-domain, per-project)
    await this.searchDb.db.run(`
      CREATE TABLE IF NOT EXISTS project_memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT NOT NULL,
        namespace TEXT NOT NULL,
        memory_type TEXT NOT NULL,
        key TEXT NOT NULL,
        value JSON NOT NULL,
        metadata JSON DEFAULT '{}',
        priority INTEGER DEFAULT 5 CHECK(priority >= 1 AND priority <= 10),
        confidence REAL DEFAULT 1.0 CHECK(confidence >= 0.0 AND confidence <= 1.0),
        ttl_hours INTEGER DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME DEFAULT NULL,
        UNIQUE(project_id, namespace, memory_type, key)
      )
    `)

    // Indexes for fast retrieval
    await this.searchDb.db.run(`
      CREATE INDEX IF NOT EXISTS idx_memories_project
      ON project_memories(project_id)
    `)
    await this.searchDb.db.run(`
      CREATE INDEX IF NOT EXISTS idx_memories_ns_type
      ON project_memories(project_id, namespace, memory_type)
    `)
    await this.searchDb.db.run(`
      CREATE INDEX IF NOT EXISTS idx_memories_priority
      ON project_memories(priority DESC)
    `)
    await this.searchDb.db.run(`
      CREATE INDEX IF NOT EXISTS idx_memories_expires
      ON project_memories(expires_at) WHERE expires_at IS NOT NULL
    `)

    // Clean up expired memories on init
    await this.cleanExpired()
  }

  /**
   * Store or update a memory. Upserts on (project_id, namespace, memory_type, key).
   */
  async store({ projectId, namespace, memoryType, key, value, metadata = {}, priority = 5, confidence = 1.0, ttlHours = null }) {
    const expiresAt = ttlHours
      ? new Date(Date.now() + ttlHours * 3600 * 1000).toISOString()
      : null

    await this.searchDb.db.run(`
      INSERT INTO project_memories (project_id, namespace, memory_type, key, value, metadata, priority, confidence, ttl_hours, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(project_id, namespace, memory_type, key) DO UPDATE SET
        value = excluded.value,
        metadata = excluded.metadata,
        priority = excluded.priority,
        confidence = excluded.confidence,
        ttl_hours = excluded.ttl_hours,
        expires_at = excluded.expires_at,
        updated_at = CURRENT_TIMESTAMP
    `, [
      projectId,
      namespace,
      memoryType,
      key,
      JSON.stringify(value),
      JSON.stringify(metadata),
      priority,
      confidence,
      ttlHours,
      expiresAt,
    ])
  }

  /**
   * Recall memories for a project, optionally filtered by namespace/type.
   * Returns memories sorted by priority DESC, confidence DESC, updated_at DESC.
   */
  async recall({ projectId, namespace, memoryType, key, limit = 20 }) {
    let sql = `
      SELECT * FROM project_memories
      WHERE project_id = ?
        AND (expires_at IS NULL OR expires_at > datetime('now'))
    `
    const params = [projectId]

    if (namespace) {
      sql += ' AND namespace = ?'
      params.push(namespace)
    }
    if (memoryType) {
      sql += ' AND memory_type = ?'
      params.push(memoryType)
    }
    if (key) {
      sql += ' AND key = ?'
      params.push(key)
    }

    sql += ' ORDER BY priority DESC, confidence DESC, updated_at DESC LIMIT ?'
    params.push(limit)

    const rows = await this.searchDb.db.all(sql, params)
    return rows.map(r => ({
      id: r.id,
      namespace: r.namespace,
      memoryType: r.memory_type,
      key: r.key,
      value: JSON.parse(r.value),
      metadata: JSON.parse(r.metadata || '{}'),
      priority: r.priority,
      confidence: r.confidence,
      ttlHours: r.ttl_hours,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      expiresAt: r.expires_at,
    }))
  }

  /**
   * List all memories for a project, grouped by namespace.
   */
  async list({ projectId, namespace }) {
    let sql = `
      SELECT namespace, memory_type, key, priority, confidence, updated_at, expires_at
      FROM project_memories
      WHERE project_id = ?
        AND (expires_at IS NULL OR expires_at > datetime('now'))
    `
    const params = [projectId]

    if (namespace) {
      sql += ' AND namespace = ?'
      params.push(namespace)
    }

    sql += ' ORDER BY namespace, priority DESC, updated_at DESC'

    return this.searchDb.db.all(sql, params)
  }

  /**
   * Delete a specific memory by composite key.
   */
  async delete({ projectId, namespace, memoryType, key }) {
    // Check existence first since promisified db.run doesn't return changes
    const existing = await this.searchDb.db.get(
      'SELECT id FROM project_memories WHERE project_id = ? AND namespace = ? AND memory_type = ? AND key = ?',
      [projectId, namespace, memoryType, key]
    )
    if (!existing) return false

    await this.searchDb.db.run(`
      DELETE FROM project_memories
      WHERE project_id = ? AND namespace = ? AND memory_type = ? AND key = ?
    `, [projectId, namespace, memoryType, key])
    return true
  }

  /**
   * Delete a memory by ID.
   */
  async deleteById(id) {
    const existing = await this.searchDb.db.get(
      'SELECT id FROM project_memories WHERE id = ?', [id]
    )
    if (!existing) return false

    await this.searchDb.db.run(
      'DELETE FROM project_memories WHERE id = ?', [id]
    )
    return true
  }

  /**
   * Clean expired memories.
   */
  async cleanExpired() {
    await this.searchDb.db.run(`
      DELETE FROM project_memories
      WHERE expires_at IS NOT NULL AND expires_at <= datetime('now')
    `)
  }

  /**
   * Get memory stats for a project.
   */
  async getStats(projectId) {
    const total = await this.searchDb.db.get(
      'SELECT COUNT(*) as count FROM project_memories WHERE project_id = ?',
      [projectId]
    )
    const byNamespace = await this.searchDb.db.all(`
      SELECT namespace, COUNT(*) as count
      FROM project_memories
      WHERE project_id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
      GROUP BY namespace
    `, [projectId])

    return {
      total: total?.count || 0,
      byNamespace: Object.fromEntries(byNamespace.map(r => [r.namespace, r.count])),
    }
  }
}
