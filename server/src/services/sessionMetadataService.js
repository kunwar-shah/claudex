import { SearchDatabase } from './searchDatabase.js'

/**
 * SessionMetadataService - Manages custom session metadata (names, tags, visibility, notes)
 *
 * SAFETY: This service NEVER modifies Claude Code JSONL files.
 * All custom data is stored in separate session_metadata table.
 * 100% reversible - delete table to restore original behavior.
 */
export class SessionMetadataService {
  constructor(searchDb = null) {
    this.searchDb = searchDb || new SearchDatabase()
  }

  async init() {
    if (!this.searchDb.db) {
      await this.searchDb.init()
    }
  }

  /**
   * Get session metadata (custom title, tags, notes, visibility)
   */
  async getMetadata(projectId, sessionId) {
    const row = await this.searchDb.db.get(
      'SELECT * FROM session_metadata WHERE project_id = ? AND session_id = ?',
      [projectId, sessionId]
    )

    if (!row) {
      return null
    }

    return {
      sessionId: row.session_id,
      projectId: row.project_id,
      customTitle: row.custom_title,
      originalTitle: row.original_title,
      isHidden: Boolean(row.is_hidden),
      tags: row.tags ? JSON.parse(row.tags) : [],
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  /**
   * Set or update session metadata
   */
  async setMetadata(projectId, sessionId, metadata) {
    const {
      customTitle = null,
      originalTitle = null,
      isHidden = false,
      tags = [],
      notes = null
    } = metadata

    const tagsJson = JSON.stringify(tags)

    await this.searchDb.db.run(`
      INSERT INTO session_metadata
        (project_id, session_id, custom_title, original_title, is_hidden, tags, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(session_id, project_id) DO UPDATE SET
        custom_title = excluded.custom_title,
        original_title = excluded.original_title,
        is_hidden = excluded.is_hidden,
        tags = excluded.tags,
        notes = excluded.notes,
        updated_at = CURRENT_TIMESTAMP
    `, [projectId, sessionId, customTitle, originalTitle, isHidden ? 1 : 0, tagsJson, notes])

    return await this.getMetadata(projectId, sessionId)
  }

  /**
   * Update only custom title
   */
  async setCustomTitle(projectId, sessionId, customTitle) {
    // Check if metadata exists
    const existing = await this.getMetadata(projectId, sessionId)

    if (existing) {
      await this.searchDb.db.run(`
        UPDATE session_metadata
        SET custom_title = ?, updated_at = CURRENT_TIMESTAMP
        WHERE project_id = ? AND session_id = ?
      `, [customTitle, projectId, sessionId])
    } else {
      // Create new metadata record
      await this.searchDb.db.run(`
        INSERT INTO session_metadata (project_id, session_id, custom_title)
        VALUES (?, ?, ?)
      `, [projectId, sessionId, customTitle])
    }

    return await this.getMetadata(projectId, sessionId)
  }

  /**
   * Toggle session visibility (hide/show)
   */
  async toggleVisibility(projectId, sessionId) {
    const existing = await this.getMetadata(projectId, sessionId)
    const newHiddenState = existing ? !existing.isHidden : true

    if (existing) {
      await this.searchDb.db.run(`
        UPDATE session_metadata
        SET is_hidden = ?, updated_at = CURRENT_TIMESTAMP
        WHERE project_id = ? AND session_id = ?
      `, [newHiddenState ? 1 : 0, projectId, sessionId])
    } else {
      await this.searchDb.db.run(`
        INSERT INTO session_metadata (project_id, session_id, is_hidden)
        VALUES (?, ?, ?)
      `, [projectId, sessionId, newHiddenState ? 1 : 0])
    }

    return await this.getMetadata(projectId, sessionId)
  }

  /**
   * Add tags to session (merges with existing tags)
   */
  async addTags(projectId, sessionId, newTags) {
    const existing = await this.getMetadata(projectId, sessionId)
    const currentTags = existing?.tags || []

    // Merge and deduplicate tags
    const mergedTags = [...new Set([...currentTags, ...newTags])]

    if (existing) {
      await this.searchDb.db.run(`
        UPDATE session_metadata
        SET tags = ?, updated_at = CURRENT_TIMESTAMP
        WHERE project_id = ? AND session_id = ?
      `, [JSON.stringify(mergedTags), projectId, sessionId])
    } else {
      await this.searchDb.db.run(`
        INSERT INTO session_metadata (project_id, session_id, tags)
        VALUES (?, ?, ?)
      `, [projectId, sessionId, JSON.stringify(mergedTags)])
    }

    return await this.getMetadata(projectId, sessionId)
  }

  /**
   * Remove tags from session
   */
  async removeTags(projectId, sessionId, tagsToRemove) {
    const existing = await this.getMetadata(projectId, sessionId)
    if (!existing) return null

    const currentTags = existing.tags || []
    const filteredTags = currentTags.filter(tag => !tagsToRemove.includes(tag))

    await this.searchDb.db.run(`
      UPDATE session_metadata
      SET tags = ?, updated_at = CURRENT_TIMESTAMP
      WHERE project_id = ? AND session_id = ?
    `, [JSON.stringify(filteredTags), projectId, sessionId])

    return await this.getMetadata(projectId, sessionId)
  }

  /**
   * Set session notes
   */
  async setNotes(projectId, sessionId, notes) {
    const existing = await this.getMetadata(projectId, sessionId)

    if (existing) {
      await this.searchDb.db.run(`
        UPDATE session_metadata
        SET notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE project_id = ? AND session_id = ?
      `, [notes, projectId, sessionId])
    } else {
      await this.searchDb.db.run(`
        INSERT INTO session_metadata (project_id, session_id, notes)
        VALUES (?, ?, ?)
      `, [projectId, sessionId, notes])
    }

    return await this.getMetadata(projectId, sessionId)
  }

  /**
   * Delete session metadata (restore to default)
   */
  async deleteMetadata(projectId, sessionId) {
    await this.searchDb.db.run(
      'DELETE FROM session_metadata WHERE project_id = ? AND session_id = ?',
      [projectId, sessionId]
    )
    return { success: true }
  }

  /**
   * Get all hidden sessions for a project
   */
  async getHiddenSessions(projectId) {
    const rows = await this.searchDb.db.all(
      'SELECT session_id FROM session_metadata WHERE project_id = ? AND is_hidden = 1',
      [projectId]
    )
    return rows.map(row => row.session_id)
  }

  /**
   * Get all sessions with a specific tag
   */
  async getSessionsByTag(projectId, tag) {
    const rows = await this.searchDb.db.all(
      `SELECT session_id, tags FROM session_metadata
       WHERE project_id = ? AND tags LIKE ?`,
      [projectId, `%"${tag}"%`]
    )

    // Filter to ensure exact tag match (not substring)
    return rows
      .filter(row => {
        const tags = JSON.parse(row.tags || '[]')
        return tags.includes(tag)
      })
      .map(row => row.session_id)
  }

  /**
   * Get all tags used in a project
   */
  async getAllTags(projectId) {
    const rows = await this.searchDb.db.all(
      'SELECT DISTINCT tags FROM session_metadata WHERE project_id = ?',
      [projectId]
    )

    const allTags = new Set()
    rows.forEach(row => {
      if (row.tags) {
        const tags = JSON.parse(row.tags)
        tags.forEach(tag => allTags.add(tag))
      }
    })

    return Array.from(allTags).sort()
  }

  /**
   * Batch hide/show sessions
   */
  async batchSetVisibility(projectId, sessionIds, isHidden) {
    const placeholders = sessionIds.map(() => '?').join(',')

    await this.searchDb.db.run(`
      INSERT INTO session_metadata (project_id, session_id, is_hidden)
      VALUES ${sessionIds.map(() => '(?, ?, ?)').join(', ')}
      ON CONFLICT(session_id, project_id) DO UPDATE SET
        is_hidden = excluded.is_hidden,
        updated_at = CURRENT_TIMESTAMP
    `, sessionIds.flatMap(sid => [projectId, sid, isHidden ? 1 : 0]))

    return { success: true, count: sessionIds.length }
  }

  /**
   * Batch add tags to multiple sessions
   */
  async batchAddTags(projectId, sessionIds, tags) {
    for (const sessionId of sessionIds) {
      await this.addTags(projectId, sessionId, tags)
    }
    return { success: true, count: sessionIds.length }
  }

  async close() {
    if (this.searchDb) {
      await this.searchDb.close()
    }
  }
}
