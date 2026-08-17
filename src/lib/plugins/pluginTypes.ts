export type PluginTool = {
  id: string;
  name: string;
  description: string;
  parameters?: Record<string, any>;
  execute: (args: any, ctx: PluginContext) => Promise<any>;
};

export type Plugin = {
  id: string;
  name: string;
  icon: string;
  color?: string;
  description: string;
  permissions: string[];
  composerLabel: string;
  composerIcon?: string;
  placeholder?: string;
  tools: PluginTool[];
};

export type PluginContext = {
  userMessage: string;
  conversationId: string;
  addMessage?: (message: any) => void;
  files?: File[];
};

export type PluginExecutionResult = {
  success: boolean;
  pluginId: string;
  toolId: string;
  data?: any;
  error?: string;
  metadata?: {
    duration: number;
    timestamp: number;
  };
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  pluginId?: string;
  toolId?: string;
  toolResult?: PluginExecutionResult;
  createdAt?: string;
};
