import { VectorChunk, OracleQueryResult } from './types';

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0.0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const sqrtA = Math.sqrt(normA);
  const sqrtB = Math.sqrt(normB);

  if (sqrtA === 0 || sqrtB === 0) return 0.0;
  return dotProduct / (sqrtA * sqrtB);
}

export class RAGOracleEngine {
  private vectorDB: VectorChunk[] = [];
  private processedFiles: Set<string> = new Set();

  constructor(initialChunks?: VectorChunk[]) {
    if (initialChunks) {
      this.vectorDB = [...initialChunks];
      initialChunks.forEach((c) => this.processedFiles.add(c.filePath));
    }
  }

  /**
   * Adds text chunk embeddings to vector memory bank
   */
  public addChunk(filePath: string, chunk: string, embedding: number[]) {
    this.vectorDB.push({ filePath, chunk, embedding });
    this.processedFiles.add(filePath);
  }

  /**
   * Queries vector memory using cosine similarity ranking
   */
  public consultOracle(queryEmbedding: number[], topK = 3): { chunks: VectorChunk[]; contextText: string } {
    if (this.vectorDB.length === 0) {
      return { chunks: [], contextText: '' };
    }

    const rankedChunks = this.vectorDB
      .map((item) => ({
        ...item,
        score: cosineSimilarity(queryEmbedding, item.embedding),
      }))
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, topK);

    const contextText = rankedChunks
      .map((c) => `// File: ${c.filePath}\n${c.chunk}`)
      .join('\n\n');

    return {
      chunks: rankedChunks,
      contextText,
    };
  }

  public getVectorDBSize(): number {
    return this.vectorDB.length;
  }

  public getProcessedFilesCount(): number {
    return this.processedFiles.size;
  }

  public clearMemory() {
    this.vectorDB = [];
    this.processedFiles.clear();
  }
}

export const globalRAGOracleEngine = new RAGOracleEngine();
