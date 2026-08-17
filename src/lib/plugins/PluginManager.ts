import { Plugin, PluginContext, PluginExecutionResult } from './pluginTypes';
import { PLUGINS, hasPermission } from './PluginRegistry';

export class PluginManager {
  private registry: Plugin[] = PLUGINS;

  get(id: string): Plugin | undefined {
    if (!id) return undefined;
    const cleanId = id.toLowerCase().trim();
    const normalized = cleanId
      .replace('-creation', '')
      .replace('-master', '')
      .replace('-mode', '')
      .replace('doc-analysis', 'file')
      .replace('files', 'file')
      .replace('interpreter', 'code')
      .replace('calculator', 'math');

    return this.registry.find(plugin => plugin.id === cleanId || plugin.id === normalized);
  }

  getAll(): Plugin[] {
    return this.registry;
  }

  getTool(pluginId: string, toolId?: string) {
    const plugin = this.get(pluginId);
    if (!plugin) return undefined;
    return toolId ? plugin.tools.find(tool => tool.id === toolId) : plugin.tools[0];
  }

  async execute(
    pluginId: string,
    toolId: string | undefined,
    input: any,
    context: PluginContext
  ): Promise<PluginExecutionResult> {
    const startTime = Date.now();
    const plugin = this.get(pluginId);

    if (!plugin) {
      return {
        success: false,
        pluginId,
        toolId: toolId || 'unknown',
        error: `Plugin "${pluginId}" is not registered.`,
        metadata: { duration: Date.now() - startTime, timestamp: startTime }
      };
    }

    if (!hasPermission(plugin)) {
      return {
        success: false,
        pluginId: plugin.id,
        toolId: toolId || 'unknown',
        error: `Permission denied for plugin "${plugin.name}".`,
        metadata: { duration: Date.now() - startTime, timestamp: startTime }
      };
    }

    const tool = this.getTool(plugin.id, toolId);
    if (!tool) {
      return {
        success: false,
        pluginId: plugin.id,
        toolId: toolId || 'unknown',
        error: `Tool "${toolId}" not found for plugin "${plugin.name}".`,
        metadata: { duration: Date.now() - startTime, timestamp: startTime }
      };
    }

    try {
      const data = await tool.execute(input, context);
      return {
        success: true,
        pluginId: plugin.id,
        toolId: tool.id,
        data,
        metadata: { duration: Date.now() - startTime, timestamp: startTime }
      };
    } catch (err: any) {
      return {
        success: false,
        pluginId: plugin.id,
        toolId: tool.id,
        error: err?.message || `${plugin.name} execution failed`,
        metadata: { duration: Date.now() - startTime, timestamp: startTime }
      };
    }
  }

  async run(pluginId: string, args: any, context: PluginContext, toolId?: string) {
    return this.execute(pluginId, toolId, args, context);
  }
}

export const pluginManager = new PluginManager();
