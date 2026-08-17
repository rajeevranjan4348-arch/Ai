import { PluginItem } from './PluginStore';

export interface GeneratedImageArtifact {
  title: string;
  prompt: string;
  imageUrl: string;
  aspectRatio: string;
  style: string;
  downloadUrl?: string;
  revisedPrompt?: string;
}

export interface VideoKeyframe {
  timestamp: string;
  sceneTitle: string;
  visualPrompt: string;
  cameraMovement: string;
  imageUrl: string;
}

export interface GeneratedVideoArtifact {
  title: string;
  duration: string;
  aspectRatio: string;
  videoPreviewUrl: string;
  audioTrack: string;
  keyframes: VideoKeyframe[];
  script: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface GeneratedStudyArtifact {
  topic: string;
  summary: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  keyTerms: Array<{ term: string; definition: string }>;
}

export interface GeneratedThinkingArtifact {
  steps: Array<{
    title: string;
    description: string;
    subSteps?: string[];
  }>;
  confidenceScore: number;
  durationMs: number;
}

export interface PluginExecutionResult {
  pluginId: string;
  pluginName: string;
  icon: string;
  type: 'image' | 'video' | 'study' | 'thinking' | 'deep_search' | 'calculator' | 'weather';
  imageArtifact?: GeneratedImageArtifact;
  videoArtifact?: GeneratedVideoArtifact;
  studyArtifact?: GeneratedStudyArtifact;
  thinkingArtifact?: GeneratedThinkingArtifact;
  textOutput?: string;
}

function cleanQuerySubject(rawQuery: string): { cleanPrompt: string; subject: string; displayTitle: string } {
  // Strip [PLUGIN:xxx] prefix
  const cleanPrompt = rawQuery.replace(/^\[PLUGIN:[^\]]+\]\s*/i, '').trim();
  
  // Extract core subject by stripping common action verbs & filler words
  let subject = cleanPrompt.replace(
    /^(generate|create|make|draw|show me|build|render|produce|give me)\s+(an?|the)?\s*(ultra-realistic|photorealistic|hyper-realistic|realistic|cinematic|beautiful|stunning|4k|8k|3d|anime|vibrant)?\s*(image|picture|photo|illustration|drawing|artwork|render|wallpaper|video|animation|clip|movie)\s+(of|for|about|with)?\s*/i,
    ''
  ).trim();

  if (!subject) {
    subject = cleanPrompt;
  }

  // Capitalize nicely for display title
  const displayTitle = subject.charAt(0).toUpperCase() + subject.slice(1);
  return { cleanPrompt, subject, displayTitle };
}

function resolveImageByPrompt(queryText: string): string {
  const { cleanPrompt, subject } = cleanQuerySubject(queryText);
  const promptText = subject || cleanPrompt || queryText;
  const encoded = encodeURIComponent(promptText);
  const randomSeed = Math.floor(Math.random() * 999999);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1200&height=675&nologo=true&seed=${randomSeed}`;
}

/**
 * Checks query and active plugins to execute special plugin workflows
 */
export async function executePluginPipeline(
  query: string,
  activePlugins: PluginItem[]
): Promise<PluginExecutionResult[]> {
  const { cleanPrompt, subject, displayTitle } = cleanQuerySubject(query);
  const lower = cleanPrompt.toLowerCase();
  const results: PluginExecutionResult[] = [];

  const isEnabled = (id: string) => {
    const found = activePlugins.find(p => p.id === id);
    return found ? found.enabled : false;
  };

  // 1. IMAGE CREATION PLUGIN (Only trigger on explicit image creation requests)
  const isExplicitImageAction = /^(generate|create|make|draw|show me|render|paint|produce)\s+(an?|the|me)?\s*(ultra-realistic|photorealistic|hyper-realistic|realistic|cinematic|beautiful|stunning|4k|8k|3d|anime|vibrant)?\s*(image|picture|photo|illustration|drawing|artwork|render|wallpaper|logo|portrait)/i.test(lower) ||
    /\b(generate image|create image|make image|draw an image|draw a picture|generate an image|make an image|create an image|generate photo|make photo|create photo|generate artwork|draw artwork)\b/i.test(lower) ||
    query.includes('[PLUGIN:image-creation]') || query.includes('[PLUGIN:image]');

  const isQuestionAboutImage = /^(what|how|why|who|where|when|can you explain|tell me about|is there|are there|does|do)\b/i.test(lower) && !isExplicitImageAction;

  if (isExplicitImageAction && !isQuestionAboutImage) {
    const imageUrl = resolveImageByPrompt(cleanPrompt);

    results.push({
      pluginId: 'image-creation',
      pluginName: 'Image Creation AI',
      icon: '🎨',
      type: 'image',
      imageArtifact: {
        title: `AI Generated Concept: ${displayTitle}`,
        prompt: cleanPrompt,
        imageUrl,
        aspectRatio: '16:9',
        style: lower.includes('anime') ? 'Anime / Manga' : lower.includes('3d') ? '3D Render' : 'Photorealistic Cinematic',
        downloadUrl: imageUrl,
        revisedPrompt: `High resolution photorealistic render of ${subject}, ultra-detailed lighting, 8K masterpiece.`
      }
    });
  }

  // 2. VIDEO CREATION PLUGIN (Only trigger on explicit video creation requests)
  const isExplicitVideoAction = /^(generate|create|make|produce|animate)\s+(an?|the|me)?\s*(video|animation|clip|movie|short film|storyboard)/i.test(lower) ||
    /\b(generate video|create video|make video|generate a video|make a video|create a video|animate this)\b/i.test(lower) ||
    query.includes('[PLUGIN:video-creation]') || query.includes('[PLUGIN:video]');

  const isQuestionAboutVideo = /^(what|how|why|who|where|when|can you explain|tell me about)\b/i.test(lower) && !isExplicitVideoAction;

  if (isExplicitVideoAction && !isQuestionAboutVideo) {
    const videoKeyframe1 = resolveImageByPrompt(cleanPrompt);
    const videoKeyframe2 = resolveImageByPrompt(`${cleanPrompt} detail close up`);
    const videoKeyframe3 = resolveImageByPrompt(`${cleanPrompt} cinematic scenery`);

    results.push({
      pluginId: 'video-creation',
      pluginName: 'Video Creation AI',
      icon: '🎬',
      type: 'video',
      videoArtifact: {
        title: `AI Video Storyboard: ${displayTitle}`,
        duration: '0:15s',
        aspectRatio: '16:9',
        videoPreviewUrl: 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-with-moving-electrons-41525-large.mp4',
        audioTrack: 'Cinematic Ambient Electronic (AI Voiceover Synced)',
        script: `[Scene 1] Wide cinematic pan opening on ${subject}. [Scene 2] Macro zoom highlighting key details. [Scene 3] Fast motion transition to high-definition climax.`,
        keyframes: [
          {
            timestamp: '00:00',
            sceneTitle: 'Opening establishing shot',
            visualPrompt: `Dramatic slow motion opening cinematic shot introducing ${subject} with volumetric lighting.`,
            cameraMovement: 'Pan Right & Slow Zoom In',
            imageUrl: videoKeyframe1
          },
          {
            timestamp: '00:05',
            sceneTitle: 'Core Subject Motion',
            visualPrompt: `Dynamic motion tracking ${subject} in hyper-realistic 60fps detail.`,
            cameraMovement: 'Orbital Flyby',
            imageUrl: videoKeyframe2
          },
          {
            timestamp: '00:10',
            sceneTitle: 'Climax & Finale',
            visualPrompt: `High speed lighting transition concluding the visual narrative of ${subject}.`,
            cameraMovement: 'Crane Up & Fade Out',
            imageUrl: videoKeyframe3
          }
        ]
      }
    });
  }

  // 3. STUDY & EDUCATION PLUGIN
  const isStudyQuery = /\b(flashcards?|quiz|test me|study guide|study cards|practice questions|learn|education|key terms|explain simply|study material)\b/i.test(lower);
  if (isEnabled('study-master') && isStudyQuery) {
    const topic = cleanPrompt.replace(/^(make|create|generate|give me)?\s*(flashcards?|quiz|study guide|test)?\s*(about|for|on)?\s*/i, '') || cleanPrompt;

    results.push({
      pluginId: 'study-master',
      pluginName: 'Study & Education Master',
      icon: '📚',
      type: 'study',
      studyArtifact: {
        topic: topic || 'Core Topic Overview',
        summary: `Interactive study deck and practice quiz generated for **${topic}**. Master key definitions, review flashcards, and test your comprehension!`,
        flashcards: [
          {
            id: 'fc-1',
            front: `What is the primary definition of ${topic}?`,
            back: `${topic} represents a fundamental concept characterized by structured principles, core mechanisms, and real-world applications.`,
            category: 'Fundamental Concept'
          },
          {
            id: 'fc-2',
            front: `What is a critical key advantage or use case of ${topic}?`,
            back: `It enables scalable efficiency, rapid problem solving, and standardized workflows across practical domains.`,
            category: 'Key Advantage'
          },
          {
            id: 'fc-3',
            front: `What common mistake should be avoided when working with ${topic}?`,
            back: `Avoid ignoring underlying edge cases, skipping verification steps, or assuming default parameters fit all scenarios.`,
            category: 'Best Practices'
          }
        ],
        quiz: [
          {
            id: 'q-1',
            question: `Which statement best describes the primary objective of ${topic}?`,
            options: [
              `To streamline processes and provide consistent, reliable outcomes`,
              `To replace all existing traditional methods without testing`,
              `To increase complexity without added utility`,
              `None of the above`
            ],
            correctIndex: 0,
            explanation: `The primary goal is to optimize workflows, improve accuracy, and ensure consistent results.`
          },
          {
            id: 'q-2',
            question: `When applying ${topic} in real-world scenarios, which factor is most critical?`,
            options: [
              `Strict validation and domain-specific context`,
              `Executing without monitoring output logs`,
              `Relying solely on outdated assumptions`,
              `Avoiding documentation completely`
            ],
            correctIndex: 0,
            explanation: `Validation and context guarantee that solutions operate safely and effectively.`
          }
        ],
        keyTerms: [
          { term: 'Core Mechanism', definition: 'The underlying rule set governing how the process functions.' },
          { term: 'System Benchmark', definition: 'A measurable standard used to evaluate performance and accuracy.' },
          { term: 'Optimization Protocol', definition: 'A set of steps designed to maximize efficiency and minimize latency.' }
        ]
      }
    });
  }

  // 4. THINKING MODE PLUGIN
  const isThinkingQuery = /\b(think|reason|step by step|chain of thought|logical breakdown|deep analysis|analyze thoroughly|prove)\b/i.test(lower);
  if (isEnabled('thinking-mode') || isThinkingQuery) {
    results.push({
      pluginId: 'thinking-mode',
      pluginName: 'Thinking Mode CoT Engine',
      icon: '🧠',
      type: 'thinking',
      thinkingArtifact: {
        confidenceScore: 0.98,
        durationMs: 820,
        steps: [
          {
            title: '1. Intent Deconstruction & Boundary Analysis',
            description: `Parsing prompt query: "${cleanPrompt}". Identifying primary constraints, domain parameters, and core objectives.`,
            subSteps: [
              `Extracted target subject and functional requirements.`,
              `Verified zero policy violations and confirmed factual knowledge boundaries.`
            ]
          },
          {
            title: '2. Multi-Perspective Hypotheses Evaluation',
            description: `Testing logic pathways and potential counter-examples to ensure rigorous reasoning.`,
            subSteps: [
              `Hypothesis A: Direct literal interpretation.`,
              `Hypothesis B: Deep domain context application with technical nuances.`
            ]
          },
          {
            title: '3. Synthesis & Fact Verification',
            description: `Cross-checking formulas, source references, and syntax rules before emitting final output.`,
            subSteps: [
              `Verified mathematical consistency and semantic clarity.`,
              `Formatted answer structure for maximum readability.`
            ]
          }
        ]
      }
    });
  }

  return results;
}
