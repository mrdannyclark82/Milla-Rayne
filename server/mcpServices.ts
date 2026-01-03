/**
 * MCP Services Integration
 * Unified interface for all Model Context Protocol services
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { config } from './config.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MCPService {
  name: string;
  client: Client | null;
  connected: boolean;
  capabilities: string[];
}

/**
 * MCP Services Manager
 * Manages multiple MCP server connections
 */
class MCPServicesManager {
  private services: Map<string, MCPService> = new Map();
  
  constructor() {
    this.initializeServices();
  }

  /**
   * Initialize all configured MCP services
   */
  private async initializeServices() {
    // Filesystem MCP
    if (config.mcp?.filesystem?.enabled) {
      await this.connectFilesystem();
    }

    // GitHub MCP
    if (config.mcp?.github?.enabled && config.github.token) {
      await this.connectGitHub();
    }

    // Memory MCP
    if (config.mcp?.memory?.enabled) {
      await this.connectMemory();
    }

    // Brave Search MCP
    if (config.mcp?.braveSearch?.enabled && config.mcp?.braveSearch?.apiKey) {
      await this.connectBraveSearch();
    }

    // Postgres MCP
    if (config.mcp?.postgres?.enabled && config.database?.url) {
      await this.connectPostgres();
    }

    // Puppeteer MCP
    if (config.mcp?.puppeteer?.enabled) {
      await this.connectPuppeteer();
    }

    console.log(`✅ MCP Services initialized: ${Array.from(this.services.keys()).join(', ')}`);
  }

  /**
   * Connect to Filesystem MCP server
   */
  private async connectFilesystem() {
    try {
      const service: MCPService = {
        name: 'filesystem',
        client: null,
        connected: false,
        capabilities: ['read_file', 'write_file', 'list_directory', 'search_files']
      };
      
      this.services.set('filesystem', service);
      console.log('📁 Filesystem MCP service registered');
    } catch (error) {
      console.error('❌ Failed to connect Filesystem MCP:', error);
    }
  }

  /**
   * Connect to GitHub MCP server
   */
  private async connectGitHub() {
    try {
      const service: MCPService = {
        name: 'github',
        client: null,
        connected: false,
        capabilities: ['search_repositories', 'get_file_contents', 'create_issue', 'create_pr', 'list_commits']
      };
      
      this.services.set('github', service);
      console.log('🐙 GitHub MCP service registered');
    } catch (error) {
      console.error('❌ Failed to connect GitHub MCP:', error);
    }
  }

  /**
   * Connect to Memory MCP server
   */
  private async connectMemory() {
    try {
      const service: MCPService = {
        name: 'memory',
        client: null,
        connected: false,
        capabilities: ['store_memory', 'retrieve_memory', 'search_memory', 'delete_memory']
      };
      
      this.services.set('memory', service);
      console.log('🧠 Memory MCP service registered');
    } catch (error) {
      console.error('❌ Failed to connect Memory MCP:', error);
    }
  }

  /**
   * Connect to Brave Search MCP server
   */
  private async connectBraveSearch() {
    try {
      const service: MCPService = {
        name: 'brave-search',
        client: null,
        connected: false,
        capabilities: ['web_search', 'local_search', 'news_search', 'image_search']
      };
      
      this.services.set('brave-search', service);
      console.log('🔍 Brave Search MCP service registered');
    } catch (error) {
      console.error('❌ Failed to connect Brave Search MCP:', error);
    }
  }

  /**
   * Connect to Postgres MCP server
   */
  private async connectPostgres() {
    try {
      const service: MCPService = {
        name: 'postgres',
        client: null,
        connected: false,
        capabilities: ['query', 'list_tables', 'describe_table', 'execute']
      };
      
      this.services.set('postgres', service);
      console.log('🐘 Postgres MCP service registered');
    } catch (error) {
      console.error('❌ Failed to connect Postgres MCP:', error);
    }
  }

  /**
   * Connect to Puppeteer MCP server
   */
  private async connectPuppeteer() {
    try {
      const service: MCPService = {
        name: 'puppeteer',
        client: null,
        connected: false,
        capabilities: ['screenshot', 'navigate', 'click', 'type', 'extract']
      };
      
      this.services.set('puppeteer', service);
      console.log('🎭 Puppeteer MCP service registered');
    } catch (error) {
      console.error('❌ Failed to connect Puppeteer MCP:', error);
    }
  }

  /**
   * Get a specific MCP service
   */
  getService(name: string): MCPService | undefined {
    return this.services.get(name);
  }

  /**
   * Get all registered services
   */
  getAllServices(): MCPService[] {
    return Array.from(this.services.values());
  }

  /**
   * Check if a service is available
   */
  isServiceAvailable(name: string): boolean {
    const service = this.services.get(name);
    return service?.connected ?? false;
  }

  /**
   * Disconnect all services
   */
  async disconnectAll() {
    for (const [name, service] of this.services) {
      if (service.client) {
        try {
          await service.client.close();
          console.log(`Disconnected ${name} MCP service`);
        } catch (error) {
          console.error(`Error disconnecting ${name}:`, error);
        }
      }
    }
    this.services.clear();
  }
}

// Singleton instance
let mcpManager: MCPServicesManager | null = null;

/**
 * Get the global MCP Services Manager instance
 */
export function getMCPManager(): MCPServicesManager {
  if (!mcpManager) {
    mcpManager = new MCPServicesManager();
  }
  return mcpManager;
}

/**
 * Individual service exports for convenience
 */

export async function filesystemSearch(query: string, path?: string): Promise<any[]> {
  const manager = getMCPManager();
  const service = manager.getService('filesystem');
  
  if (!service) {
    throw new Error('Filesystem MCP service not available');
  }

  // Implementation will use native fs for now
  return [];
}

export async function githubSearch(query: string, filters?: any): Promise<any[]> {
  const manager = getMCPManager();
  const service = manager.getService('github');
  
  if (!service) {
    throw new Error('GitHub MCP service not available');
  }

  // Use existing GitHub integration
  return [];
}

export async function braveWebSearch(query: string, options?: any): Promise<any[]> {
  const manager = getMCPManager();
  const service = manager.getService('brave-search');
  
  if (!service?.connected) {
    throw new Error('Brave Search MCP service not available');
  }

  // Implementation
  return [];
}

export async function postgresQuery(sql: string, params?: any[]): Promise<any[]> {
  const manager = getMCPManager();
  const service = manager.getService('postgres');
  
  if (!service?.connected) {
    throw new Error('Postgres MCP service not available');
  }

  // Use existing database connection
  return [];
}

export async function puppeteerScreenshot(url: string, options?: any): Promise<Buffer> {
  const manager = getMCPManager();
  const service = manager.getService('puppeteer');
  
  if (!service?.connected) {
    throw new Error('Puppeteer MCP service not available');
  }

  // Implementation
  return Buffer.from([]);
}

export async function memoryStore(key: string, value: any, metadata?: any): Promise<void> {
  const manager = getMCPManager();
  const service = manager.getService('memory');
  
  if (!service) {
    throw new Error('Memory MCP service not available');
  }

  // Use existing SQLite memory system
}

export async function memoryRetrieve(query: string): Promise<any[]> {
  const manager = getMCPManager();
  const service = manager.getService('memory');
  
  if (!service) {
    throw new Error('Memory MCP service not available');
  }

  // Use existing SQLite memory system
  return [];
}
