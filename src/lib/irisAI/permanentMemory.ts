import { CoreMemoryFact } from './types';

export class IrisPermanentMemory {
  private memoryBank: Map<string, CoreMemoryFact> = new Map();

  constructor() {
    // Register initial system facts
    this.saveFact('User prefers concise technical responses with code snippets.', 'preferences');
    this.saveFact('IRIS Neural OS layer configured for autonomous execution.', 'system');
  }

  public saveFact(factText: string, category = 'general'): CoreMemoryFact {
    const id = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const factObj: CoreMemoryFact = {
      id,
      fact: factText,
      timestamp: new Date().toISOString(),
      category,
    };
    this.memoryBank.set(id, factObj);
    return factObj;
  }

  public getFacts(): CoreMemoryFact[] {
    return Array.from(this.memoryBank.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public searchFacts(query: string): CoreMemoryFact[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getFacts();

    return this.getFacts().filter(
      (m) => m.fact.toLowerCase().includes(q) || (m.category && m.category.toLowerCase().includes(q))
    );
  }

  public deleteFact(id: string): boolean {
    return this.memoryBank.delete(id);
  }

  public clearAllMemory() {
    this.memoryBank.clear();
  }
}

export const globalIrisPermanentMemory = new IrisPermanentMemory();
