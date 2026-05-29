/**
 * Filesystem MCP Service
 * Provides file system operations through MCP protocol
 */

import { readFile, writeFile, readdir, stat, mkdir, rm, unlink } from 'fs/promises';
import { resolve, join } from 'path';
import { config } from '../config.js';
import { glob } from 'glob';

export interface FileInfo {
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
}

export class FilesystemMCPService {
  private allowedPaths: string[];

  constructor() {
    this.allowedPaths = config.mcp?.filesystem?.allowedPaths || [process.cwd()];
  }

  /**
   * Check if a path is within allowed directories
   */
  private isAllowedPath(targetPath: string): boolean {
    const resolved = resolve(targetPath);
    return this.allowedPaths.some(allowed => 
      resolved.startsWith(resolve(allowed))
    );
  }

  /**
   * Read file contents
   */
  async readFile(filePath: string): Promise<string> {
    if (!this.isAllowedPath(filePath)) {
      throw new Error(`Access denied: ${filePath} is outside allowed paths`);
    }

    return await readFile(filePath, 'utf-8');
  }

  /**
   * Write file contents
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    if (!this.isAllowedPath(filePath)) {
      throw new Error(`Access denied: ${filePath} is outside allowed paths`);
    }

    await writeFile(filePath, content, 'utf-8');
  }

  /**
   * List directory contents
   */
  async listDirectory(dirPath: string): Promise<FileInfo[]> {
    if (!this.isAllowedPath(dirPath)) {
      throw new Error(`Access denied: ${dirPath} is outside allowed paths`);
    }

    const entries = await readdir(dirPath, { withFileTypes: true });
    
    const files: FileInfo[] = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(dirPath, entry.name);
        const stats = await stat(fullPath);
        
        return {
          path: fullPath,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtime,
        };
      })
    );

    return files;
  }

  /**
   * Search files by pattern
   */
  async searchFiles(pattern: string, basePath?: string): Promise<string[]> {
    const searchPath = basePath || process.cwd();
    
    if (!this.isAllowedPath(searchPath)) {
      throw new Error(`Access denied: ${searchPath} is outside allowed paths`);
    }

    const matches = await glob(pattern, { 
      cwd: searchPath,
      absolute: true,
      nodir: false
    });

    return matches.filter(match => this.isAllowedPath(match));
  }

  /**
   * Create directory
   */
  async createDirectory(dirPath: string): Promise<void> {
    if (!this.isAllowedPath(dirPath)) {
      throw new Error(`Access denied: ${dirPath} is outside allowed paths`);
    }

    await mkdir(dirPath, { recursive: true });
  }

  /**
   * Delete file or directory
   */
  async delete(targetPath: string): Promise<void> {
    if (!this.isAllowedPath(targetPath)) {
      throw new Error(`Access denied: ${targetPath} is outside allowed paths`);
    }

    const stats = await stat(targetPath);
    
    if (stats.isDirectory()) {
      await rm(targetPath, { recursive: true });
    } else {
      await unlink(targetPath);
    }
  }

  /**
   * Get file/directory info
   */
  async getInfo(targetPath: string): Promise<FileInfo> {
    if (!this.isAllowedPath(targetPath)) {
      throw new Error(`Access denied: ${targetPath} is outside allowed paths`);
    }

    const stats = await stat(targetPath);
    
    return {
      path: targetPath,
      type: stats.isDirectory() ? 'directory' : 'file',
      size: stats.size,
      modified: stats.mtime,
    };
  }
}

let filesystemService: FilesystemMCPService | null = null;

export function getFilesystemMCPService(): FilesystemMCPService {
  if (!filesystemService) {
    filesystemService = new FilesystemMCPService();
  }
  return filesystemService;
}
