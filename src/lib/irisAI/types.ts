export interface VectorChunk {
  filePath: string;
  chunk: string;
  embedding: number[];
  score?: number;
}

export interface OracleQueryResult {
  success: boolean;
  answer?: string;
  scannedFiles?: string[];
  error?: string;
}

export interface DeepResearchResult {
  success: boolean;
  query: string;
  summary?: string;
  sources?: { url: string; title?: string; content: string }[];
  error?: string;
}

export interface CoreMemoryFact {
  id: string;
  fact: string;
  timestamp: string;
  category?: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  data?: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface WorkflowGraph {
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  updatedAt: number;
}

export interface LiveCodingResult {
  success: boolean;
  filePath?: string;
  code?: string;
  error?: string;
}
