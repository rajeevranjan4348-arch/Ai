import { getBFLKeyInfo } from './settings';

export interface BFLGenerateOptions {
  prompt: string;
  model?: 'flux-pro-1.1' | 'flux-dev' | 'flux-schnell';
  width?: number;
  height?: number;
  promptUpsampling?: boolean;
}

export interface BFLResponse {
  imageUrl?: string;
  success: boolean;
  error?: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate high-fidelity photorealistic image using Black Forest Labs (FLUX.1) API.
 */
export async function generateFluxImage(options: BFLGenerateOptions): Promise<BFLResponse> {
  const { key: apiKey } = getBFLKeyInfo();

  if (!apiKey) {
    return {
      success: false,
      error: 'BFL API Key is not configured. Please add your key in Settings > Developer.',
    };
  }

  const {
    prompt,
    model = 'flux-schnell',
    width = 1024,
    height = 768,
    promptUpsampling = false,
  } = options;

  try {
    const endpoint = `https://api.bfl.ml/v1/${model}`;
    const createRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-key': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        width,
        height,
        prompt_upsampling: promptUpsampling,
      }),
    });

    const createData = await createRes.json().catch(() => ({}));

    if (!createRes.ok || !createData.id) {
      const errMsg = createData?.error || createData?.message || `BFL Request Error (${createRes.status})`;
      return {
        success: false,
        error: errMsg,
      };
    }

    const taskId = createData.id;
    const pollingUrl = createData.polling_url || `https://api.bfl.ml/v1/get_result?id=${taskId}`;

    // Poll for task completion (up to 20 seconds, checking every 1.5s)
    const maxAttempts = 15;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await sleep(1500);

      try {
        const pollRes = await fetch(pollingUrl, {
          method: 'GET',
          headers: {
            'x-key': apiKey,
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        if (!pollRes.ok) continue;

        const pollData = await pollRes.json().catch(() => ({}));

        if (pollData.status === 'Ready' && pollData.result?.sample) {
          return {
            imageUrl: pollData.result.sample,
            success: true,
          };
        }

        if (pollData.status === 'Error' || pollData.status === 'Failed') {
          return {
            success: false,
            error: pollData.error || 'BFL Image rendering failed.',
          };
        }
      } catch (pollErr) {
        console.warn('BFL polling check warning:', pollErr);
      }
    }

    return {
      success: false,
      error: 'BFL Image generation timed out while processing.',
    };
  } catch (err: any) {
    console.error('BFL API generate error:', err);
    return {
      success: false,
      error: err?.message || 'Failed to connect to Black Forest Labs FLUX API',
    };
  }
}
