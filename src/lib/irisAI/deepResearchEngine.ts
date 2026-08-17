import { DeepResearchResult } from './types';

export class DeepResearchEngine {
  /**
   * Synthesizes web search results into a structured Deep Research Markdown report
   */
  public synthesizeResearch(
    query: string,
    rawSources: { url: string; title?: string; content: string }[]
  ): DeepResearchResult {
    if (!rawSources || rawSources.length === 0) {
      return {
        success: false,
        query,
        error: 'No search context available to synthesize.',
      };
    }

    const reportHeader = `### Deep Research Report: "${query}"\n\n`;
    const summaryBody = rawSources
      .map(
        (src, idx) =>
          `#### Source ${idx + 1}: ${src.title || src.url}\n${src.content.slice(0, 300)}...\n- **URL**: ${src.url}`
      )
      .join('\n\n');

    const fullSummary = `${reportHeader}${summaryBody}\n\n*Synthesized autonomously by IRIS Deep Research Engine.*`;

    return {
      success: true,
      query,
      summary: fullSummary,
      sources: rawSources,
    };
  }
}

export const globalDeepResearchEngine = new DeepResearchEngine();
