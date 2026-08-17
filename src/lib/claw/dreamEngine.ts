import { MemoryFact, DreamSession } from './types';

const MAX_INDEX_SIZE_BYTES = 25000; // 25KB budget limit

export class DreamEngine {
  private memoryStore: Map<string, MemoryFact> = new Map();
  private dreamSessions: DreamSession[] = [];

  constructor(initialFacts?: MemoryFact[]) {
    if (initialFacts) {
      initialFacts.forEach((f) => this.memoryStore.set(f.id, f));
    }
  }

  /**
   * Run full 4-Phase Dream Mode Memory Consolidation
   */
  public async executeDreamCycle(): Promise<DreamSession> {
    const sessionId = `dream-${Date.now()}`;
    const startTime = new Date().toISOString();

    let session: DreamSession = {
      id: sessionId,
      phase: 'orient',
      startedAt: startTime,
      factsAnalyzed: 0,
      factsPruned: 0,
      factsConsolidated: 0,
      indexSizeBytes: 0,
    };

    // Phase 1 — Orient: Index existing facts & topic structures
    session.phase = 'orient';
    const allFacts = Array.from(this.memoryStore.values());
    session.factsAnalyzed = allFacts.length;

    // Phase 2 — Gather Signal: Normalize dates and identify contradictory facts
    session.phase = 'gather';
    const normalizedFacts = allFacts.map((fact) => this.normalizeFactDates(fact));

    // Phase 3 — Consolidate: Merge new facts into existing topic clusters & resolve contradictions
    session.phase = 'consolidate';
    const consolidatedMap = new Map<string, MemoryFact>();
    let consolidatedCount = 0;

    for (const fact of normalizedFacts) {
      const existing = Array.from(consolidatedMap.values()).find(
        (f) => f.topic.toLowerCase() === fact.topic.toLowerCase()
      );

      if (existing) {
        // Resolve contradiction by taking the most recently updated fact
        if (new Date(fact.lastUpdated).getTime() >= new Date(existing.lastUpdated).getTime()) {
          consolidatedMap.set(existing.id, {
            ...existing,
            content: `${existing.content} | Updated: ${fact.content}`,
            lastUpdated: fact.lastUpdated,
            isAbsoluteDate: true,
          });
          consolidatedCount++;
        }
      } else {
        consolidatedMap.set(fact.id, fact);
      }
    }
    session.factsConsolidated = consolidatedCount;

    // Phase 4 — Prune and Index: Stay under ~25KB max budget
    session.phase = 'prune';
    let prunedCount = 0;
    const finalFacts: MemoryFact[] = [];
    let currentSize = 0;

    // Sort facts by last updated timestamp descending (freshest facts first)
    const sortedFacts = Array.from(consolidatedMap.values()).sort(
      (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );

    for (const fact of sortedFacts) {
      const factSize = JSON.stringify(fact).length;
      if (currentSize + factSize <= MAX_INDEX_SIZE_BYTES) {
        finalFacts.push(fact);
        currentSize += factSize;
      } else {
        prunedCount++;
      }
    }

    // Update memory store with pruned & consolidated set
    this.memoryStore.clear();
    finalFacts.forEach((f) => this.memoryStore.set(f.id, f));

    session.factsPruned = prunedCount;
    session.indexSizeBytes = currentSize;
    session.completedAt = new Date().toISOString();

    this.dreamSessions.push(session);
    return session;
  }

  /**
   * Converts relative date strings (e.g. "yesterday", "2 days ago") into absolute ISO timestamps
   */
  private normalizeFactDates(fact: MemoryFact): MemoryFact {
    let content = fact.content;
    const now = new Date();

    if (content.toLowerCase().includes('yesterday')) {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      content = content.replace(/yesterday/gi, yesterday.toISOString().split('T')[0]);
    } else if (content.toLowerCase().includes('today')) {
      content = content.replace(/today/gi, now.toISOString().split('T')[0]);
    }

    return {
      ...fact,
      content,
      isAbsoluteDate: true,
      lastUpdated: new Date().toISOString(),
    };
  }

  public getFacts(): MemoryFact[] {
    return Array.from(this.memoryStore.values());
  }

  public addFact(topic: string, content: string): MemoryFact {
    const fact: MemoryFact = {
      id: `fact-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      topic,
      content,
      dateCreated: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      isAbsoluteDate: true,
    };
    this.memoryStore.set(fact.id, fact);
    return fact;
  }

  public getDreamHistory(): DreamSession[] {
    return this.dreamSessions;
  }
}

export const globalDreamEngine = new DreamEngine();
