import { SwarmTeam, SwarmTask, AgentRole } from './types';

export class TeamSwarmOrchestrator {
  private teams: Map<string, SwarmTeam> = new Map();

  constructor() {
    // Create default master team
    this.createTeam('DevOps Swarm', ['read-only', 'full-coder', 'architect']);
  }

  public createTeam(name: string, agentRoles: AgentRole[]): SwarmTeam {
    const team: SwarmTeam = {
      id: `team-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      agentRoles,
      tasks: [],
      createdAt: new Date().toISOString(),
    };
    this.teams.set(team.id, team);
    return team;
  }

  public createTask(teamId: string, title: string, description: string, assignedRole: AgentRole): SwarmTask | null {
    const team = this.teams.get(teamId);
    if (!team) return null;

    const task: SwarmTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      teamId,
      title,
      description,
      assignedRole,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    team.tasks.push(task);
    return task;
  }

  public updateTaskStatus(teamId: string, taskId: string, status: SwarmTask['status'], output?: string): SwarmTask | null {
    const team = this.teams.get(teamId);
    if (!team) return null;

    const task = team.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    task.status = status;
    if (output) task.output = output;
    if (status === 'completed') {
      task.completedAt = new Date().toISOString();
    }

    return task;
  }

  public getTeams(): SwarmTeam[] {
    return Array.from(this.teams.values());
  }

  public getTeam(teamId: string): SwarmTeam | undefined {
    return this.teams.get(teamId);
  }
}

export const globalTeamSwarmOrchestrator = new TeamSwarmOrchestrator();
