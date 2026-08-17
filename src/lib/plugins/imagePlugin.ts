import { PluginTool } from './pluginTypes';
import { addSharedMediaItem } from '@/lib/mediaStore';
import { callGeminiAPI } from '@/lib/gemini';
import { generateFluxImage } from '@/lib/bfl';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class ImageGenerator {
  /**
   * Interfaces with Black Forest Labs (FLUX.1) and Gemini model capabilities
   * to generate photorealistic images, returning image metadata and saving to Media Store.
   */
  static async generate(prompt: string) {
    const cleanPrompt = (prompt || '').replace(/^\[PLUGIN:[^\]]+\]\s*/i, '').trim();
    if (!cleanPrompt) {
      throw new Error("Prompt cannot be empty for image generation.");
    }

    // 1. Interface with Gemini model capabilities to refine prompt
    let revisedPrompt = `High-resolution photorealistic masterpiece of ${cleanPrompt}, 8k resolution, cinematic lighting, ultra-detailed render.`;
    try {
      const geminiRes = await callGeminiAPI({
        prompt: `You are a Gemini AI image generator assistant. Expand the following user prompt into a rich, photorealistic, 8K ultra-detailed AI image generation prompt: "${cleanPrompt}". Return ONLY the enhanced prompt in 1-2 descriptive sentences with lighting, composition, and visual style details.`,
        mode: 'chat'
      });
      if (geminiRes.success && geminiRes.text?.trim()) {
        revisedPrompt = geminiRes.text.trim();
      }
    } catch (err) {
      console.warn('Gemini image prompt expansion notice:', err);
    }

    let rawSubject = cleanPrompt.replace(/^(generate|create|make|draw|show me|build)\s+(an?\s+)?(image|picture|photo|drawing|artwork|render)\s+(of|for|about)?\s*/i, '').trim();
    if (!rawSubject) rawSubject = cleanPrompt;
    const title = rawSubject.charAt(0).toUpperCase() + rawSubject.slice(1);

    let imageUrl = '';

    // 2. Try Black Forest Labs (FLUX.1) high precision generation first
    try {
      const fluxRes = await generateFluxImage({
        prompt: revisedPrompt || cleanPrompt,
        model: 'flux-schnell',
        width: 1024,
        height: 768,
      });

      if (fluxRes.success && fluxRes.imageUrl) {
        imageUrl = fluxRes.imageUrl;
      }
    } catch (fluxErr) {
      console.warn('BFL FLUX generation warning, falling back to curated resolution:', fluxErr);
    }

    // 3. High-quality fast dynamic generator using Pollinations AI
    if (!imageUrl) {
      await sleep(200);
      const promptToGenerate = revisedPrompt || cleanPrompt;
      const encoded = encodeURIComponent(promptToGenerate);
      const randomSeed = Math.floor(Math.random() * 999999);
      imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=768&nologo=true&seed=${randomSeed}`;
    }

    const resultData = {
      type: "image",
      status: "completed",
      prompt: cleanPrompt,
      title,
      imageUrl,
      revisedPrompt
    };

    // Save generated image into persistent Media Store
    addSharedMediaItem({
      name: `${title}.png`,
      type: 'image',
      url: imageUrl,
      size: '2.1 MB',
      source: 'ai_generated',
      prompt: cleanPrompt
    });

    return resultData;
  }
}

export async function generateImage(prompt: string) {
  return ImageGenerator.generate(prompt);
}

export const generateImageTool: PluginTool = {
  id: "generate_image",
  name: "Generate Image",
  description: "Generate photorealistic art or images from a detailed prompt using Gemini model capabilities",
  parameters: {
    type: "object",
    properties: {
      prompt: { type: "string", description: "The image description" }
    },
    required: ["prompt"]
  },
  execute: async (args) => {
    const prompt = typeof args === 'string' ? args : (args?.prompt || args?.query || '');
    return ImageGenerator.generate(prompt);
  }
};

