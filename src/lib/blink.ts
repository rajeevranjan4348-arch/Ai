import { createClient } from '@blinkdotnew/sdk';

export const blink = createClient({
  projectId: (import.meta as any).env?.VITE_BLINK_PROJECT_ID || 'perplexity-9xplge2w',
  publishableKey: (import.meta as any).env?.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_xxx',
});
