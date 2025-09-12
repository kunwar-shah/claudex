import fs from 'fs/promises';
import path from 'path';

export class FileScanner {
  constructor(projectsRoot) {
    this.projectsRoot = projectsRoot;
  }

  async scanProjects() {
    try {
      const entries = await fs.readdir(this.projectsRoot, { withFileTypes: true });
      const projects = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const projectPath = path.join(this.projectsRoot, entry.name);
          const stats = await fs.stat(projectPath);
          
          projects.push({
            id: entry.name,
            name: this.cleanProjectName(entry.name),
            path: projectPath,
            lastModified: stats.mtime.toISOString()
          });
        }
      }

      return projects.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    } catch (error) {
      console.error('Error scanning projects:', error);
      throw new Error(`Failed to scan projects directory: ${error.message}`);
    }
  }

  async scanSessions(projectPath) {
    try {
      const entries = await fs.readdir(projectPath, { withFileTypes: true });
      const sessions = [];

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.jsonl')) {
          const filePath = path.join(projectPath, entry.name);
          const stats = await fs.stat(filePath);
          
          const sessionId = entry.name.replace('.jsonl', '');
          
          const messageCount = await this.countMessages(filePath);
          
          sessions.push({
            sessionId,
            title: sessionId, // TODO: Extract title from first messages
            createdAt: stats.birthtime.toISOString(),
            lastUpdatedAt: stats.mtime.toISOString(),
            messageCount,
            filePath,
            template: 'unknown' // Will be detected later
          });
        }
      }

      return sessions.sort((a, b) => new Date(b.lastUpdatedAt) - new Date(a.lastUpdatedAt));
    } catch (error) {
      console.error('Error scanning sessions:', error);
      throw new Error(`Failed to scan sessions in project: ${error.message}`);
    }
  }

  cleanProjectName(rawName) {
    // Convert "-mnt-c-laragon-www-simple-migration" to "simple-migration"
    // Convert "-home-boss-claude-chats" to "claude-chats"
    // Convert "-home-boss-projects-belink-ai" to "belink-ai"
    
    // Remove common prefixes and get the meaningful part
    let cleaned = rawName
      .replace(/^-mnt-c-laragon-www-/, '')
      .replace(/^-home-boss-projects-/, '')
      .replace(/^-home-boss-/, '');
    
    return cleaned || rawName; // Fallback to original if cleaning results in empty string
  }

  async countMessages(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content.split('\n').filter(line => line.trim()).length;
    } catch (error) {
      console.error(`Error counting messages in ${filePath}:`, error);
      return 0;
    }
  }

  async getSessionFirstMessages(filePath, limit = 3) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim()).slice(0, limit);
      
      return lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (error) {
          return { raw: line };
        }
      });
    } catch (error) {
      console.error(`Error reading first messages from ${filePath}:`, error);
      return [];
    }
  }
}