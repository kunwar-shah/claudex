import os from 'os';
import path from 'path';

/**
 * Expands path with ~ to absolute path
 * @param {string} filepath - Path that might contain ~
 * @returns {string} Absolute path
 */
export function expandPath(filepath) {
  if (!filepath) {
    return filepath;
  }

  // Handle ~ at the start of the path
  if (filepath.startsWith('~/') || filepath === '~') {
    return path.join(os.homedir(), filepath.slice(1));
  }

  // Handle ~username/path format (Unix-like systems)
  if (filepath.startsWith('~')) {
    // This is a more complex case - would need to look up user's home directory
    // For now, we'll just handle the current user's ~
    return path.join(os.homedir(), filepath.slice(1));
  }

  // Return as-is if it's already absolute or relative
  return filepath;
}

/**
 * Gets the project root from environment with smart defaults
 * @returns {string} Absolute path to projects directory
 */
export function getProjectRoot() {
  const envPath = process.env.PROJECT_ROOT;

  // If PROJECT_ROOT is set, expand it
  if (envPath) {
    return expandPath(envPath);
  }

  // Default fallback: ~/.claude/projects
  return path.join(os.homedir(), '.claude', 'projects');
}
