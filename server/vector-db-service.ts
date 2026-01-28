/**
 * Modern Vector Database Service
 * Supports Pinecone and ChromaDB for production-grade memory & RAG
 * Sub-100ms retrieval latency with hybrid search capabilities
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { ChromaClient } from 'chromadb';

export type VectorProvider = 'pinecone' | 'chroma';

interface VectorMetadata {
  userId?: string;
  conversationId?: string;
  timestamp?: number;
  type?: string;
  [key: string]: any;
}

interface VectorSearchResult {
  id: string;
  score: number;
  metadata: VectorMetadata;
  content: string;
}

export interface VectorUpsertOptions {
  id: string;
  values: number[];
  metadata: VectorMetadata;
  content: string;
}

export interface VectorQueryOptions {
  vector: number[];
  topK?: number;
  filter?: Record<string, any>;
  includeMetadata?: boolean;
}

class VectorDatabaseService {
  private provider: VectorProvider;
  private pinecone: Pinecone | null = null;
  private chroma: ChromaClient | null = null;
  private indexName: string;
  private collectionName: string;

  constructor(provider: VectorProvider = 'chroma') {
    this.provider = provider;
    this.indexName = process.env.PINECONE_INDEX || 'milla-memories';
    this.collectionName = process.env.CHROMA_COLLECTION || 'milla-memories';
  }

  /**
   * Initialize the vector database connection
   */
  async initialize(): Promise<void> {
    console.log(`🔌 Initializing ${this.provider} vector database...`);

    if (this.provider === 'pinecone' && process.env.PINECONE_API_KEY) {
      this.pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
      });
      console.log('✅ Pinecone initialized successfully');
    } else if (this.provider === 'chroma') {
      const chromaHost = process.env.CHROMA_HOST || 'http://localhost:8000';
      this.chroma = new ChromaClient({ path: chromaHost });

      try {
        // Create collection if it doesn't exist
        await this.chroma.createCollection({
          name: this.collectionName,
          metadata: { description: 'Milla AI companion memory storage' },
        });
        console.log(`✅ ChromaDB collection '${this.collectionName}' ready`);
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log(`✅ ChromaDB collection '${this.collectionName}' already exists`);
        } else {
          console.error('❌ ChromaDB initialization error:', error);
        }
      }
    } else {
      console.warn('⚠️ No vector database configured, using fallback mode');
    }
  }

  /**
   * Upsert vectors with metadata (insert or update)
   * Supports batch operations for efficiency
   */
  async upsert(vectors: VectorUpsertOptions[]): Promise<void> {
    if (this.provider === 'pinecone' && this.pinecone) {
      const index = this.pinecone.index(this.indexName);
      await index.upsert(
        vectors.map((v) => ({
          id: v.id,
          values: v.values,
          metadata: { ...v.metadata, content: v.content },
        }))
      );
    } else if (this.provider === 'chroma' && this.chroma) {
      const collection = await this.chroma.getCollection({
        name: this.collectionName,
      });

      await collection.add({
        ids: vectors.map((v) => v.id),
        embeddings: vectors.map((v) => v.values),
        metadatas: vectors.map((v) => ({ ...v.metadata, content: v.content })),
        documents: vectors.map((v) => v.content),
      });
    }
  }

  /**
   * Query vectors with hybrid search (vector + metadata filtering)
   * Target: Sub-100ms retrieval latency
   */
  async query(options: VectorQueryOptions): Promise<VectorSearchResult[]> {
    const { vector, topK = 5, filter, includeMetadata = true } = options;

    if (this.provider === 'pinecone' && this.pinecone) {
      const index = this.pinecone.index(this.indexName);
      const queryResponse = await index.query({
        vector,
        topK,
        filter,
        includeMetadata,
      });

      return (
        queryResponse.matches?.map((match) => ({
          id: match.id,
          score: match.score || 0,
          metadata: (match.metadata as VectorMetadata) || {},
          content: (match.metadata?.content as string) || '',
        })) || []
      );
    } else if (this.provider === 'chroma' && this.chroma) {
      const collection = await this.chroma.getCollection({
        name: this.collectionName,
      });

      const queryResults = await collection.query({
        queryEmbeddings: [vector],
        nResults: topK,
        where: filter,
      });

      const results: VectorSearchResult[] = [];
      if (queryResults.ids[0] && queryResults.distances) {
        for (let i = 0; i < queryResults.ids[0].length; i++) {
          results.push({
            id: queryResults.ids[0][i],
            score: 1 - (queryResults.distances[0][i] || 0), // Convert distance to similarity
            metadata: (queryResults.metadatas?.[0]?.[i] as VectorMetadata) || {},
            content: queryResults.documents?.[0]?.[i] || '',
          });
        }
      }

      return results;
    }

    return [];
  }

  /**
   * Delete vectors by ID or filter
   */
  async delete(ids: string[]): Promise<void> {
    if (this.provider === 'pinecone' && this.pinecone) {
      const index = this.pinecone.index(this.indexName);
      await index.deleteMany(ids);
    } else if (this.provider === 'chroma' && this.chroma) {
      const collection = await this.chroma.getCollection({
        name: this.collectionName,
      });
      await collection.delete({ ids });
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{ count: number; dimensions?: number }> {
    if (this.provider === 'pinecone' && this.pinecone) {
      const index = this.pinecone.index(this.indexName);
      const stats = await index.describeIndexStats();
      return {
        count: stats.totalRecordCount || 0,
        dimensions: stats.dimension,
      };
    } else if (this.provider === 'chroma' && this.chroma) {
      const collection = await this.chroma.getCollection({
        name: this.collectionName,
      });
      const count = await collection.count();
      return { count };
    }

    return { count: 0 };
  }
}

// Singleton instance
let vectorDBInstance: VectorDatabaseService | null = null;

export function getVectorDB(provider?: VectorProvider): VectorDatabaseService {
  if (!vectorDBInstance) {
    vectorDBInstance = new VectorDatabaseService(provider);
  }
  return vectorDBInstance;
}

export async function initializeVectorDB(
  provider?: VectorProvider
): Promise<VectorDatabaseService> {
  const db = getVectorDB(provider);
  await db.initialize();
  return db;
}
