import { useState, useCallback, useEffect } from 'react';
import {
  globalRAGOracleEngine,
  globalDeepResearchEngine,
  globalIrisPermanentMemory,
  globalIrisWorkflowManager,
  globalIrisAppOperationEngine,
  CoreMemoryFact,
  WorkflowGraph,
  VectorChunk,
} from '@/lib/irisAI';

export function useIrisAISystem() {
  const [memoryFacts, setMemoryFacts] = useState<CoreMemoryFact[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowGraph[]>([]);
  const [vectorDbSize, setVectorDbSize] = useState(0);

  const refreshState = useCallback(() => {
    setMemoryFacts(globalIrisPermanentMemory.getFacts());
    setWorkflows(globalIrisWorkflowManager.getWorkflows());
    setVectorDbSize(globalRAGOracleEngine.getVectorDBSize());
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Save new fact to permanent memory bank
  const saveMemoryFact = useCallback(
    (factText: string, category?: string) => {
      const fact = globalIrisPermanentMemory.saveFact(factText, category);
      refreshState();
      return fact;
    },
    [refreshState]
  );

  // Search permanent memory bank
  const searchMemory = useCallback((query: string) => {
    return globalIrisPermanentMemory.searchFacts(query);
  }, []);

  // Consult RAG Oracle
  const consultRAGOracle = useCallback((queryEmbedding: number[], topK = 3) => {
    return globalRAGOracleEngine.consultOracle(queryEmbedding, topK);
  }, []);

  // Ingest code chunk into RAG vector memory
  const ingestVectorChunk = useCallback(
    (filePath: string, chunk: string, embedding: number[]) => {
      globalRAGOracleEngine.addChunk(filePath, chunk, embedding);
      refreshState();
    },
    [refreshState]
  );

  // Execute Deep Research synthesis
  const executeDeepResearch = useCallback(
    (query: string, rawSources: { url: string; title?: string; content: string }[]) => {
      return globalDeepResearchEngine.synthesizeResearch(query, rawSources);
    },
    []
  );

  // Execute autonomous app opening and operating
  const executeAppOperation = useCallback(
    (commandStr: string) => {
      const result = globalIrisAppOperationEngine.executeOperation(commandStr);
      refreshState();
      return result;
    },
    [refreshState]
  );

  return {
    memoryFacts,
    workflows,
    vectorDbSize,
    saveMemoryFact,
    searchMemory,
    consultRAGOracle,
    ingestVectorChunk,
    executeDeepResearch,
    executeAppOperation,
    refreshState,
  };
}

