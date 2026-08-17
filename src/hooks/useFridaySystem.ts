import { useState, useCallback, useEffect } from 'react';
import {
  globalFridayMCPServer,
  globalFridayVoiceAgent,
  FridayConfig,
  MCPToolDefinition,
  MCPResourceDefinition,
  MCPPromptDefinition,
  AgentGreeting,
  getGreetingByTimeOfDay,
} from '@/lib/friday';

export function useFridaySystem() {
  const [config, setConfig] = useState<FridayConfig>(globalFridayVoiceAgent.getConfig());
  const [greeting, setGreeting] = useState<AgentGreeting>(getGreetingByTimeOfDay());
  const [tools, setTools] = useState<MCPToolDefinition[]>([]);
  const [resources, setResources] = useState<MCPResourceDefinition[]>([]);
  const [prompts, setPrompts] = useState<MCPPromptDefinition[]>([]);
  const [lastBriefing, setLastBriefing] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Load MCP Tools & Resources on mount
  useEffect(() => {
    setTools(globalFridayMCPServer.getTools());
    setResources(globalFridayMCPServer.getResources());
    setPrompts(globalFridayMCPServer.getPrompts());
    setGreeting(getGreetingByTimeOfDay());
  }, []);

  // Execute MCP Tool directly
  const callTool = useCallback(async (toolName: string, params: Record<string, any> = {}) => {
    setIsExecuting(true);
    try {
      const result = await globalFridayMCPServer.executeTool(toolName, params);
      if (typeof result === 'string') {
        setLastBriefing(result);
      }
      return result;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  // Quick action: Fetch World News Brief
  const fetchWorldNewsBrief = useCallback(async () => {
    return await callTool('get_world_news');
  }, [callTool]);

  // Quick action: Fetch Finance Brief
  const fetchFinanceBrief = useCallback(async () => {
    return await callTool('get_world_finance_news');
  }, [callTool]);

  // Update F.R.I.D.A.Y. Voice Provider Config (e.g. Sarvam vs Whisper, Gemini vs OpenAI)
  const updateProviderConfig = useCallback((newConfig: Partial<FridayConfig>) => {
    globalFridayVoiceAgent.updateConfig(newConfig);
    setConfig(globalFridayVoiceAgent.getConfig());
  }, []);

  return {
    config,
    greeting,
    tools,
    resources,
    prompts,
    lastBriefing,
    isExecuting,
    callTool,
    fetchWorldNewsBrief,
    fetchFinanceBrief,
    updateProviderConfig,
    voiceTurnConfig: globalFridayVoiceAgent.getVoiceTurnConfig(),
    systemPrompt: globalFridayMCPServer.getInstructions(),
  };
}
