import { ContactItem } from './contacts';
import { lookupContactAndTriggerCall } from './contactSearchService';
import { speakTextWithPersona } from './voiceService';
import { toast } from 'sonner';

export interface CallCommandResult {
  isCallCommand: boolean;
  target: string;
  phoneNumber: string | null;
  contactName: string | null;
  spokenMessage: string;
  actionTaken: 'dial' | 'not_found' | 'need_target' | 'none';
}

// Fallback contacts for offline / non-Google signed in sessions
export const DEFAULT_LOCAL_CONTACTS: ContactItem[] = [
  { resourceName: 'local_1', displayName: 'Mom', phone: '+18005550199', email: 'mom@family.com' },
  { resourceName: 'local_2', displayName: 'Dad', phone: '+18005550188', email: 'dad@family.com' },
  { resourceName: 'local_3', displayName: 'Rajeev', phone: '+919876543210', email: 'rajeev@example.com' },
  { resourceName: 'local_4', displayName: 'Amit', phone: '+919812345678', email: 'amit@example.com' },
  { resourceName: 'local_5', displayName: 'Brother', phone: '+18005550177' },
  { resourceName: 'local_6', displayName: 'Emergency', phone: '911' },
];

export function containsCallCommand(text: string): boolean {
  const lower = text.toLowerCase().trim();
  const keywords = ['call ', 'phone ', 'ring ', 'dial ', 'please call ', 'please phone ', 'please ring ', 'please dial '];
  return keywords.some(kw => lower.includes(kw) || lower.startsWith(kw));
}

export function extractCallTarget(command: string): string {
  const patterns = [
    'please call ',
    'please phone ',
    'please ring ',
    'please dial ',
    'make a call to ',
    'place a call to ',
    'call ',
    'phone ',
    'ring ',
    'dial ',
  ];

  let result = command.trim();
  for (const pattern of patterns) {
    if (result.toLowerCase().startsWith(pattern)) {
      result = result.substring(pattern.length).trim();
      break;
    }
  }

  // Remove common filler words like "my", "the"
  result = result.replace(/^(my|the)\s+/i, '').trim();
  return result;
}

export function extractPhoneNumber(text: string): string | null {
  const match = text.match(/(\+?\d[\d\s\-()]{7,}\d)/);
  if (!match) return null;

  const digits = match[0].replace(/[^0-9+]/g, '');
  return digits.length >= 3 ? digits : null;
}

export async function processAndExecuteCallCommand(
  command: string,
  options?: {
    accessToken?: string;
    speakResponse?: boolean;
    onInitiateCall?: (number: string, targetName: string) => void;
  }
): Promise<CallCommandResult> {
  const shouldSpeak = options?.speakResponse !== false;

  if (!containsCallCommand(command)) {
    return {
      isCallCommand: false,
      target: '',
      phoneNumber: null,
      contactName: null,
      spokenMessage: '',
      actionTaken: 'none',
    };
  }

  const target = extractCallTarget(command);

  if (!target) {
    const msg = 'Who would you like me to call?';
    if (shouldSpeak) {
      speakTextWithPersona(msg);
    }
    toast.info(msg);
    return {
      isCallCommand: true,
      target: '',
      phoneNumber: null,
      contactName: null,
      spokenMessage: msg,
      actionTaken: 'need_target',
    };
  }

  // Execute Contact Search Service to request permission if needed, lookup name, and trigger call
  const callRes = await lookupContactAndTriggerCall(target, {
    accessToken: options?.accessToken,
    onInitiateCall: options?.onInitiateCall,
    autoRequestPermission: true,
  });

  if (callRes.found && callRes.phoneNumber) {
    const spokenMsg = `Calling ${callRes.contactName || target}.`;
    if (shouldSpeak) {
      speakTextWithPersona(spokenMsg);
    }
    return {
      isCallCommand: true,
      target,
      phoneNumber: callRes.phoneNumber,
      contactName: callRes.contactName || target,
      spokenMessage: spokenMsg,
      actionTaken: 'dial',
    };
  }

  const notFoundMsg = `I couldn't find ${target} in your contacts.`;
  if (shouldSpeak) {
    speakTextWithPersona(notFoundMsg);
  }

  return {
    isCallCommand: true,
    target,
    phoneNumber: null,
    contactName: null,
    spokenMessage: notFoundMsg,
    actionTaken: 'not_found',
  };
}
