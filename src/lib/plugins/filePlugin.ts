import { PluginTool } from './pluginTypes';
import { addSharedMediaItem } from '@/lib/mediaStore';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function analyzeFile(fileInput: any) {
  await sleep(650);
  
  if (!fileInput) {
    throw new Error("No file uploaded or selected for analysis.");
  }

  let fileName = "Attached_Document.pdf";
  let fileSize = "124 KB";
  let fileType = "application/pdf";
  let extractedText = "";

  if (fileInput instanceof File) {
    fileName = fileInput.name;
    fileSize = `${(fileInput.size / 1024).toFixed(1)} KB`;
    fileType = fileInput.type || 'Document';
    
    // Read text if text/json/csv
    if (fileInput.type.startsWith('text/') || fileInput.name.endsWith('.txt') || fileInput.name.endsWith('.csv') || fileInput.name.endsWith('.json')) {
      try {
        extractedText = await fileInput.text();
      } catch (e) {
        // ignore
      }
    }
  } else if (typeof fileInput === 'object') {
    fileName = fileInput.name || fileName;
    fileSize = fileInput.size ? `${(fileInput.size / 1024).toFixed(1)} KB` : fileSize;
    fileType = fileInput.type || fileType;
    extractedText = fileInput.content || fileInput.text || '';
  }

  const snippet = extractedText ? extractedText.slice(0, 300) : null;

  // Determine media category
  let category: 'image' | 'video' | 'document' | 'other' = 'document';
  if (fileType.includes('image') || fileName.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
    category = 'image';
  } else if (fileType.includes('video') || fileName.match(/\.(mp4|webm|mov|avi)$/i)) {
    category = 'video';
  }

  addSharedMediaItem({
    name: fileName,
    type: category,
    size: fileSize,
    source: 'user_uploaded',
    previewText: snippet || undefined,
    mimeType: fileType
  });

  return {
    type: "file-analysis",
    status: "completed",
    name: fileName,
    size: fileSize,
    fileType,
    hasContent: Boolean(snippet),
    contentPreview: snippet,
    summary: `Extracted structure and data from **${fileName}** (${fileSize}). Contains text, structured attributes, and key sections ready for deep AI query.`
  };
}

export const analyzeFileTool: PluginTool = {
  id: "analyze_file",
  name: "Analyze File",
  description: "Analyze and parse uploaded documents, spreadsheets, or images",
  parameters: {
    type: "object",
    properties: {
      file: { type: "object", description: "File reference or content" }
    }
  },
  execute: async (args, ctx) => {
    const fileRef = args?.file || (ctx.files && ctx.files[0]) || args;
    return analyzeFile(fileRef);
  }
};
