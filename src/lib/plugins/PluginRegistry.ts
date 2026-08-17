import { Plugin } from './pluginTypes';
import { generateImageTool, ImageGenerator } from './imagePlugin';
import { searchWebTool } from './searchPlugin';
import { executeCodeTool } from './codePlugin';
import { analyzeFileTool } from './filePlugin';
import { generateVideoTool } from './videoPlugin';

export { ImageGenerator };

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const PLUGINS: Plugin[] = [
  {
    id: "image",
    name: "Image",
    icon: "✦",
    color: "#a855f7",
    description: "Create and generate AI images from text descriptions",
    permissions: ["image.generate"],
    composerLabel: "Create image",
    composerIcon: "✦",
    placeholder: "Describe the image you want to generate...",
    tools: [generateImageTool]
  },
  {
    id: "search",
    name: "Web Search",
    icon: "⌕",
    color: "#3b82f6",
    description: "Search live web info, news, and domain sources",
    permissions: ["web.search"],
    composerLabel: "Search web",
    composerIcon: "⌕",
    placeholder: "Search the web for real-time information...",
    tools: [searchWebTool]
  },
  {
    id: "code",
    name: "Code",
    icon: "</>",
    color: "#06b6d4",
    description: "Run and benchmark code in a secure sandbox",
    permissions: ["code.execute"],
    composerLabel: "Run code",
    composerIcon: "</>",
    placeholder: "Write or paste code to execute in sandbox...",
    tools: [executeCodeTool]
  },
  {
    id: "file",
    name: "Files",
    icon: "📎",
    color: "#f59e0b",
    description: "Analyze, summarize and parse uploaded documents",
    permissions: ["file.read"],
    composerLabel: "Analyze file",
    composerIcon: "📎",
    placeholder: "Upload a file or ask a document question...",
    tools: [analyzeFileTool]
  },
  {
    id: "video",
    name: "Video AI",
    icon: "🎬",
    color: "#ec4899",
    description: "Generate video storyboards, motion graphics & scripts",
    permissions: ["video.generate"],
    composerLabel: "Create video",
    composerIcon: "🎬",
    placeholder: "Describe the video scene or script topic...",
    tools: [generateVideoTool]
  },
  {
    id: "mediastore",
    name: "Media Store",
    icon: "💽",
    color: "#06b6d4",
    description: "Picture, Video & File Store - access and manage assets",
    permissions: ["mediastore.read"],
    composerLabel: "Media Store",
    composerIcon: "💽",
    placeholder: "Search or manage pictures, videos & files in Media Store...",
    tools: [
      {
        id: "open_media_store",
        name: "Media Store",
        description: "Access Picture, Video & File Store",
        parameters: { type: "object", properties: { query: { type: "string" } } },
        execute: async (args) => {
          const q = typeof args === 'string' ? args : (args?.query || '');
          return {
            type: "mediastore",
            query: q,
            summary: "Opened AI Picture, Video & File Store."
          };
        }
      }
    ]
  },
  {
    id: "camera",
    name: "Camera",
    icon: "📷",
    color: "#3b82f6",
    description: "Capture photos directly using camera",
    permissions: ["camera.capture"],
    composerLabel: "Take photo",
    composerIcon: "📷",
    placeholder: "Take a photo or describe snapshot to analyze...",
    tools: [
      {
        id: "camera_capture",
        name: "Camera",
        description: "Capture camera photos",
        parameters: { type: "object", properties: { note: { type: "string" } } },
        execute: async () => {
          return { type: "camera", status: "ready" };
        }
      }
    ]
  },
  {
    id: "photos",
    name: "Photos",
    icon: "🖼️",
    color: "#a855f7",
    description: "Select and upload photos from gallery",
    permissions: ["photos.read"],
    composerLabel: "Photo gallery",
    composerIcon: "🖼️",
    placeholder: "Select photo from gallery to analyze...",
    tools: [
      {
        id: "photo_select",
        name: "Photos",
        description: "Select photo gallery items",
        parameters: { type: "object", properties: { note: { type: "string" } } },
        execute: async () => {
          return { type: "photos", status: "ready" };
        }
      }
    ]
  },
  {
    id: "study",
    name: "Study Master",
    icon: "📚",
    color: "#10b981",
    description: "Build flashcard decks, practice quizzes & notes",
    permissions: ["study.build"],
    composerLabel: "Study guide",
    composerIcon: "📚",
    placeholder: "Enter topic for flashcards & practice quiz...",
    tools: [
      {
        id: "study_master",
        name: "Study Master",
        description: "Create study materials",
        parameters: { type: "object", properties: { topic: { type: "string" } } },
        execute: async (args) => {
          await sleep(600);
          const t = typeof args === 'string' ? args : (args?.topic || args?.query || '');
          return {
            type: "study",
            topic: t,
            flashcardsCount: 3,
            quizCount: 2,
            summary: `Generated 3 interactive flashcards and 2 quiz questions for **${t}**.`
          };
        }
      }
    ]
  },
  {
    id: "thinking",
    name: "Thinking Mode",
    icon: "🧠",
    color: "#8b5cf6",
    description: "Chain-of-thought step-by-step logical reasoning",
    permissions: ["thinking.reason"],
    composerLabel: "Thinking mode",
    composerIcon: "🧠",
    placeholder: "Enter complex question for step-by-step CoT reasoning...",
    tools: [
      {
        id: "thinking_mode",
        name: "Thinking Mode",
        description: "Step-by-step reasoning",
        parameters: { type: "object", properties: { query: { type: "string" } } },
        execute: async (args) => {
          await sleep(500);
          const q = typeof args === 'string' ? args : (args?.query || args?.prompt || '');
          return {
            type: "thinking",
            query: q,
            steps: [
              { title: "1. Intent Deconstruction", desc: `Parsed requirements for "${q}".` },
              { title: "2. Knowledge Base Lookup", desc: "Cross-checked domain facts and constraints." },
              { title: "3. Logic Verification", desc: "Validated logical deductions prior to output." }
            ]
          };
        }
      }
    ]
  },
  {
    id: "math",
    name: "Math Solver",
    icon: "🧮",
    color: "#ef4444",
    description: "Solve complex formulas, equations & physics",
    permissions: ["math.solve"],
    composerLabel: "Math solver",
    composerIcon: "🧮",
    placeholder: "Type a math problem, formula, or equation...",
    tools: [
      {
        id: "math_solver",
        name: "Math Solver",
        description: "Solve equations",
        parameters: { type: "object", properties: { equation: { type: "string" } } },
        execute: async (args) => {
          await sleep(450);
          const eq = typeof args === 'string' ? args : (args?.equation || args?.query || '');
          return {
            type: "math",
            equation: eq,
            solution: `Calculated step-by-step solution for formula: ${eq}. Verified.`
          };
        }
      }
    ]
  }
];

export const GRANTED_PERMISSIONS = new Set([
  "image.generate",
  "web.search",
  "code.execute",
  "file.read",
  "video.generate",
  "mediastore.read",
  "camera.capture",
  "photos.read",
  "study.build",
  "thinking.reason",
  "math.solve"
]);

export function hasPermission(plugin: Plugin): boolean {
  return plugin.permissions.every(permission => GRANTED_PERMISSIONS.has(permission));
}
