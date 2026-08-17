import { ClawToolDefinition } from './types';

export const CLAW_SYSTEM_TOOLS: ClawToolDefinition[] = [
  {
    name: 'TaskCreate',
    description: 'Creates a new task in the multi-agent swarm task list.',
    category: 'task',
    parameters: {
      teamId: { type: 'string', required: true },
      title: { type: 'string', required: true },
      description: { type: 'string', required: true },
      assignedRole: { type: 'string', enum: ['read-only', 'full-coder', 'reviewer', 'architect'] },
    },
  },
  {
    name: 'TaskList',
    description: 'Lists all active tasks across team agents.',
    category: 'task',
    parameters: {
      teamId: { type: 'string', required: true },
    },
  },
  {
    name: 'TaskUpdate',
    description: 'Updates task progress, status, or completion output.',
    category: 'task',
    parameters: {
      taskId: { type: 'string', required: true },
      status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'blocked'] },
      output: { type: 'string' },
    },
  },
  {
    name: 'EnterPlanMode',
    description: 'Enters read-only research and architectural planning mode.',
    category: 'system',
    parameters: {
      objective: { type: 'string', required: true },
    },
  },
  {
    name: 'ExitPlanMode',
    description: 'Exits plan mode and enables full execution capabilities.',
    category: 'system',
    parameters: {},
  },
  {
    name: 'ScheduleCron',
    description: 'Schedules a recurring background tick or task with jitter.',
    category: 'system',
    parameters: {
      cronExpression: { type: 'string', required: true },
      prompt: { type: 'string', required: true },
    },
  },
  {
    name: 'BriefTool',
    description: 'Sends a concise proactive status message (≤25 words guideline).',
    category: 'system',
    parameters: {
      message: { type: 'string', required: true },
      status: { type: 'string', enum: ['normal', 'proactive'] },
    },
  },
  {
    name: 'SkillTool',
    description: 'Invokes specialized domain skills dynamically.',
    category: 'system',
    parameters: {
      skillName: { type: 'string', required: true },
    },
  },
];
