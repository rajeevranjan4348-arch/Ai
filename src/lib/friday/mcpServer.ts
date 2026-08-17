import {
  MCPToolDefinition,
  MCPResourceDefinition,
  MCPPromptDefinition,
} from './types';
import {
  getWorldNews,
  getWorldFinanceNews,
  openWorldMonitor,
  openFinanceWorldMonitor,
  getCurrentTime,
  getSystemInfo,
  formatJson,
  wordCount,
  searchWeb,
  fetchUrl,
} from './mcpTools';
import {
  promptSummarize,
  promptExplainCode,
  FRIDAY_SYSTEM_PROMPT,
} from './prompts';

export class FridayMCPServer {
  private name: string;
  private instructions: string;
  private tools: Map<string, MCPToolDefinition> = new Map();
  private resources: Map<string, MCPResourceDefinition> = new Map();
  private prompts: Map<string, MCPPromptDefinition> = new Map();

  constructor(name = 'Friday') {
    this.name = name;
    this.instructions = FRIDAY_SYSTEM_PROMPT;
    this.registerAllDefaults();
  }

  private registerAllDefaults() {
    // 1. Register Web Tools
    this.registerTool({
      name: 'get_world_news',
      description: "Fetches latest global headlines from major news outlets simultaneously. Use when user asks 'What's going on in the world?'.",
      category: 'web',
    });

    this.registerTool({
      name: 'get_world_finance_news',
      description: 'Fetches current finance and market headlines from major financial outlets.',
      category: 'web',
    });

    this.registerTool({
      name: 'open_world_monitor',
      description: 'Opens live World Monitor map dashboard (worldmonitor.app).',
      category: 'web',
    });

    this.registerTool({
      name: 'open_finance_world_monitor',
      description: 'Opens live Finance World Monitor dashboard (finance.worldmonitor.app).',
      category: 'web',
    });

    this.registerTool({
      name: 'search_web',
      description: 'Search the web for a given query and return a summary.',
      category: 'web',
      parameters: { query: { type: 'string', required: true } },
    });

    this.registerTool({
      name: 'fetch_url',
      description: 'Fetch the raw text content of a URL.',
      category: 'web',
      parameters: { url: { type: 'string', required: true } },
    });

    // 2. Register System Tools
    this.registerTool({
      name: 'get_current_time',
      description: 'Return current date and time in ISO 8601 format.',
      category: 'system',
    });

    this.registerTool({
      name: 'get_system_info',
      description: 'Return basic information about the host system.',
      category: 'system',
    });

    // 3. Register Utility Tools
    this.registerTool({
      name: 'format_json',
      description: 'Pretty-print a JSON string.',
      category: 'utils',
      parameters: { data: { type: 'string', required: true } },
    });

    this.registerTool({
      name: 'word_count',
      description: 'Count characters, words, and lines in a text block.',
      category: 'utils',
      parameters: { text: { type: 'string', required: true } },
    });

    // 4. Register Resources
    this.registerResource({
      uri: 'friday://info',
      name: 'Server Info',
      description: 'Returns basic info about this MCP server.',
      content: 'Friday FastMCP Server (SSE Transport Emulator)\nStark Industries AI Assistant Core.\nVersion 2.5.',
    });

    // 5. Register Prompts
    this.registerPrompt({
      name: 'summarize',
      description: 'Prompt to summarize a block of text.',
      template: (args) => promptSummarize(args.text || ''),
    });

    this.registerPrompt({
      name: 'explain_code',
      description: 'Prompt to explain code step by step.',
      template: (args) => promptExplainCode(args.code || '', args.language || 'Python'),
    });
  }

  public registerTool(tool: MCPToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  public registerResource(resource: MCPResourceDefinition) {
    this.resources.set(resource.uri, resource);
  }

  public registerPrompt(prompt: MCPPromptDefinition) {
    this.prompts.set(prompt.name, prompt);
  }

  /**
   * Execute tool call directly
   */
  public async executeTool(toolName: string, params: Record<string, any> = {}): Promise<any> {
    switch (toolName) {
      case 'get_world_news':
        return await getWorldNews();
      case 'get_world_finance_news':
        return await getWorldFinanceNews();
      case 'open_world_monitor':
        return openWorldMonitor();
      case 'open_finance_world_monitor':
        return openFinanceWorldMonitor();
      case 'get_current_time':
        return getCurrentTime();
      case 'get_system_info':
        return getSystemInfo();
      case 'format_json':
        return formatJson(params.data || '');
      case 'word_count':
        return wordCount(params.text || '');
      case 'search_web':
        return searchWeb(params.query || '');
      case 'fetch_url':
        return await fetchUrl(params.url || '');
      default:
        throw new Error(`Unknown MCP Tool: ${toolName}`);
    }
  }

  public getTools(): MCPToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public getResources(): MCPResourceDefinition[] {
    return Array.from(this.resources.values());
  }

  public getPrompts(): MCPPromptDefinition[] {
    return Array.from(this.prompts.values());
  }

  public getServerName(): string {
    return this.name;
  }

  public getInstructions(): string {
    return this.instructions;
  }
}

export const globalFridayMCPServer = new FridayMCPServer();
