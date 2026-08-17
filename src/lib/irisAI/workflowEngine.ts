import { WorkflowGraph, WorkflowNode, WorkflowEdge } from './types';

export class IrisWorkflowManager {
  private workflows: Map<string, WorkflowGraph> = new Map();

  constructor() {
    // Default starter workflow
    this.saveWorkflow(
      'Default Automation Pipeline',
      'System startup trigger connected to RAG Oracle and Voice Dispatcher',
      [
        { id: 'node-1', type: 'trigger', label: 'Voice Intent Trigger' },
        { id: 'node-2', type: 'processor', label: 'RAG Oracle Context Lookup' },
        { id: 'node-3', type: 'output', label: 'Synthesized Response' },
      ],
      [
        { id: 'edge-1-2', source: 'node-1', target: 'node-2' },
        { id: 'edge-2-3', source: 'node-2', target: 'node-3' },
      ]
    );
  }

  public saveWorkflow(
    name: string,
    description: string,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): WorkflowGraph {
    const workflow: WorkflowGraph = {
      name,
      description,
      nodes,
      edges,
      updatedAt: Date.now(),
    };
    this.workflows.set(name, workflow);
    return workflow;
  }

  public getWorkflows(): WorkflowGraph[] {
    return Array.from(this.workflows.values());
  }

  public getWorkflow(name: string): WorkflowGraph | undefined {
    return this.workflows.get(name);
  }

  public deleteWorkflow(name: string): boolean {
    return this.workflows.delete(name);
  }
}

export const globalIrisWorkflowManager = new IrisWorkflowManager();
