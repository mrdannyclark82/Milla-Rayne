/**
 * Postgres MCP Service
 * Database operations through MCP protocol
 */

import { config } from '../config.js';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';

export interface QueryResult {
  rows: any[];
  rowCount: number;
  fields?: string[];
}

export interface TableInfo {
  name: string;
  schema: string;
  columns: ColumnInfo[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
}

export class PostgresMCPService {
  /**
   * Check if Postgres is available
   */
  isAvailable(): boolean {
    return !!config.database?.url;
  }

  /**
   * Execute a raw SQL query
   */
  async query(sqlQuery: string, params?: any[]): Promise<QueryResult> {
    if (!this.isAvailable()) {
      throw new Error('Postgres not configured');
    }

    try {
      const result = await db.execute(sql.raw(sqlQuery));
      
      return {
        rows: Array.isArray(result) ? result : [result],
        rowCount: Array.isArray(result) ? result.length : 1,
      };
    } catch (error) {
      throw new Error(`Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all tables in the database
   */
  async listTables(schema = 'public'): Promise<string[]> {
    if (!this.isAvailable()) {
      throw new Error('Postgres not configured');
    }

    const result = await this.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1 
      ORDER BY table_name
    `, [schema]);

    return result.rows.map(row => row.table_name);
  }

  /**
   * Describe a table's structure
   */
  async describeTable(tableName: string, schema = 'public'): Promise<TableInfo> {
    if (!this.isAvailable()) {
      throw new Error('Postgres not configured');
    }

    const result = await this.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `, [schema, tableName]);

    const columns: ColumnInfo[] = result.rows.map(row => ({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES',
      default: row.column_default,
    }));

    return {
      name: tableName,
      schema,
      columns,
    };
  }

  /**
   * Get table row count
   */
  async getTableRowCount(tableName: string, schema = 'public'): Promise<number> {
    if (!this.isAvailable()) {
      throw new Error('Postgres not configured');
    }

    const result = await this.query(`
      SELECT COUNT(*) as count 
      FROM "${schema}"."${tableName}"
    `);

    return parseInt(result.rows[0]?.count || '0', 10);
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction(queries: string[]): Promise<QueryResult[]> {
    if (!this.isAvailable()) {
      throw new Error('Postgres not configured');
    }

    const results: QueryResult[] = [];

    try {
      await this.query('BEGIN');

      for (const query of queries) {
        const result = await this.query(query);
        results.push(result);
      }

      await this.query('COMMIT');
    } catch (error) {
      await this.query('ROLLBACK');
      throw error;
    }

    return results;
  }

  /**
   * Get database size
   */
  async getDatabaseSize(): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Postgres not configured');
    }

    const result = await this.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);

    return result.rows[0]?.size || '0 bytes';
  }

  /**
   * Get table indexes
   */
  async getTableIndexes(tableName: string, schema = 'public'): Promise<any[]> {
    if (!this.isAvailable()) {
      throw new Error('Postgres not configured');
    }

    const result = await this.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = $1 AND tablename = $2
    `, [schema, tableName]);

    return result.rows;
  }
}

let postgresService: PostgresMCPService | null = null;

export function getPostgresMCPService(): PostgresMCPService {
  if (!postgresService) {
    postgresService = new PostgresMCPService();
  }
  return postgresService;
}
