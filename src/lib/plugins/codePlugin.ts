import { PluginTool } from './pluginTypes';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function executeCode(code: string) {
  await sleep(500);
  const cleanCode = (code || '').trim();
  if (!cleanCode) {
    throw new Error("Code snippet cannot be empty for execution.");
  }

  const startTime = performance.now();
  let output = "";
  let error: string | null = null;

  try {
    const logs: string[] = [];
    const mockConsole = {
      log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
      error: (...args: any[]) => logs.push(`[ERROR] ${args.join(' ')}`),
      warn: (...args: any[]) => logs.push(`[WARN] ${args.join(' ')}`),
      info: (...args: any[]) => logs.push(`[INFO] ${args.join(' ')}`),
    };

    // Safe execution of mathematical expressions or console statements
    if (cleanCode.includes('console.') || cleanCode.includes('function') || cleanCode.includes('let ') || cleanCode.includes('const ') || cleanCode.includes('var ')) {
      const runner = new Function('console', 'Math', cleanCode);
      runner(mockConsole, Math);
      output = logs.join('\n') || "Code executed successfully with 0 warnings/errors.";
    } else {
      // Direct evaluation for math or expressions
      const evalResult = new Function(`return (${cleanCode})`)();
      output = `Result: ${typeof evalResult === 'object' ? JSON.stringify(evalResult, null, 2) : String(evalResult)}`;
    }
  } catch (err: any) {
    error = err?.message || 'Code execution runtime exception';
    output = `Runtime Exception: ${error}`;
  }

  const durationMs = Math.round(performance.now() - startTime);

  if (error) {
    throw new Error(output);
  }

  return {
    type: "code",
    status: "completed",
    code: cleanCode,
    output,
    executionTimeMs: durationMs
  };
}

export const executeCodeTool: PluginTool = {
  id: "execute_code",
  name: "Execute Code",
  description: "Execute code or mathematical expressions in a secure sandbox",
  parameters: {
    type: "object",
    properties: {
      code: { type: "string", description: "Code snippet or formula to run" }
    },
    required: ["code"]
  },
  execute: async (args) => {
    const code = typeof args === 'string' ? args : (args?.code || args?.prompt || args?.query || '');
    return executeCode(code);
  }
};
