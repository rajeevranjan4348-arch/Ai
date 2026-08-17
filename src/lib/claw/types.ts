export type Species =
  | 'duck' | 'goose' | 'blob' | 'cat' | 'dragon' | 'octopus' | 'owl'
  | 'penguin' | 'turtle' | 'snail' | 'ghost' | 'axolotl' | 'capybara'
  | 'cactus' | 'robot' | 'rabbit' | 'mushroom' | 'chonk';

export type Eye = '·' | '✦' | '×' | '◉' | '@' | '°';
export type Hat = 'none' | 'crown' | 'tophat' | 'propeller' | 'halo' | 'wizard' | 'beanie' | 'tinyduck';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export const STAT_NAMES = ['DEBUGGING', 'PATIENCE', 'CHAOS', 'WISDOM', 'SNARK'] as const;
export type StatName = typeof STAT_NAMES[number];

export interface CompanionBones {
  rarity: Rarity;
  species: Species;
  eye: Eye;
  hat: Hat;
  shiny: boolean;
  stats: Record<StatName, number>;
}

export interface MemoryFact {
  id: string;
  topic: string;
  content: string;
  dateCreated: string; // ISO String
  lastUpdated: string; // ISO String
  isAbsoluteDate: boolean;
  sourceSessionId?: string;
}

export interface DreamSession {
  id: string;
  phase: 'orient' | 'gather' | 'consolidate' | 'prune';
  startedAt: string;
  completedAt?: string;
  factsAnalyzed: number;
  factsPruned: number;
  factsConsolidated: number;
  indexSizeBytes: number;
}

export interface UndercoverFilterResult {
  originalText: string;
  sanitizedText: string;
  isSanitized: boolean;
  strippedCodenames: string[];
}

export interface KairosTrigger {
  id: string;
  type: 'cron' | 'error_detection' | 'idle_check' | 'proactive_alert';
  description: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  scheduledTime?: string;
  intervalMs?: number;
}

export type AgentRole = 'read-only' | 'full-coder' | 'reviewer' | 'architect';

export interface SwarmTask {
  id: string;
  teamId: string;
  title: string;
  description: string;
  assignedRole: AgentRole;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  createdAt: string;
  completedAt?: string;
  output?: string;
}

export interface SwarmTeam {
  id: string;
  name: string;
  agentRoles: AgentRole[];
  tasks: SwarmTask[];
  createdAt: string;
}

export interface ClawToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  category: 'file' | 'search' | 'task' | 'team' | 'mcp' | 'repl' | 'system';
}
