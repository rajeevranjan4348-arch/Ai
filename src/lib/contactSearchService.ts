import { ContactItem, getLocalContacts, searchGoogleContacts } from './contacts';
import {
  queryNativeContacts,
  getContactsPermissionStatus,
  ContactsPermissionStatus
} from './nativeContactsService';
import { ContactService } from './ContactService';
import { toast } from 'sonner';

export interface ContactLookupResult {
  found: boolean;
  contact: ContactItem | null;
  phoneNumber: string | null;
  contactName: string | null;
  permissionStatus: ContactsPermissionStatus;
  message: string;
  source: 'native' | 'google' | 'local' | 'direct_number' | 'none';
}

export interface CallExecutionResult extends ContactLookupResult {
  callInitiated: boolean;
}

/**
 * Checks or requests device 'Contacts' permission for the AI assistant
 */
export async function ensureContactsPermission(): Promise<ContactsPermissionStatus> {
  const current = await ContactService.checkPermission();
  if (current === 'granted') {
    return 'granted';
  }

  // Request permission from the user
  return await ContactService.requestPermission();
}

/**
 * Performs a comprehensive contact search by name, relationship alias, phone or email.
 */
export async function searchContactsByName(
  query: string,
  options?: {
    accessToken?: string;
    autoRequestPermission?: boolean;
  }
): Promise<{
  contacts: ContactItem[];
  matchedContact: ContactItem | null;
  permissionStatus: ContactsPermissionStatus;
  source: 'native' | 'google' | 'local' | 'none';
}> {
  let status = getContactsPermissionStatus();
  if (options?.autoRequestPermission && status === 'prompt') {
    status = await ensureContactsPermission();
  }

  const queryTrimmed = query.trim();
  if (!queryTrimmed) {
    const allLocal = getLocalContacts();
    return {
      contacts: allLocal,
      matchedContact: allLocal[0] || null,
      permissionStatus: status,
      source: 'local',
    };
  }

  // 1. Query Native device contacts
  try {
    const nativeRes = await queryNativeContacts(queryTrimmed);
    if (nativeRes.matchedContact && nativeRes.matchedContact.phone) {
      return {
        contacts: nativeRes.contacts,
        matchedContact: nativeRes.matchedContact,
        permissionStatus: status,
        source: 'native',
      };
    }
  } catch (err) {
    console.warn('Native contacts search error:', err);
  }

  // 2. Query Google Contacts API if OAuth token provided
  if (options?.accessToken) {
    try {
      const googleResults = await searchGoogleContacts(options.accessToken, queryTrimmed);
      if (googleResults.length > 0 && googleResults[0].phone) {
        return {
          contacts: googleResults,
          matchedContact: googleResults[0],
          permissionStatus: status,
          source: 'google',
        };
      }
    } catch (e) {
      console.warn('Google Contacts search error:', e);
    }
  }

  // 3. Fallback search in local address book
  const queryLower = queryTrimmed.toLowerCase();
  const localList = getLocalContacts();
  
  const relationshipAliases: Record<string, string[]> = {
    mom: ['mom', 'mother', 'mummy', 'mommy', 'ma'],
    dad: ['dad', 'father', 'pappa', 'daddy', 'pa'],
    brother: ['brother', 'bro'],
    sister: ['sister', 'sis'],
  };

  let aliases = [queryLower];
  for (const [key, aliasList] of Object.entries(relationshipAliases)) {
    if (aliasList.includes(queryLower)) {
      aliases = Array.from(new Set([...aliasList, key]));
      break;
    }
  }

  const matches = localList.filter(c => {
    const nameLower = c.displayName.toLowerCase();
    const phone = c.phone || '';
    const emailLower = (c.email || '').toLowerCase();

    return aliases.some(alias =>
      nameLower === alias ||
      nameLower.includes(alias) ||
      phone.includes(alias) ||
      emailLower.includes(alias)
    );
  });

  const bestMatch = matches[0] || null;

  return {
    contacts: matches,
    matchedContact: bestMatch,
    permissionStatus: status,
    source: matches.length > 0 ? 'local' : 'none',
  };
}

/**
 * Perform AI contact lookup for a target name and trigger phone call
 */
export async function lookupContactAndTriggerCall(
  targetNameOrNumber: string,
  options?: {
    accessToken?: string;
    onInitiateCall?: (phone: string, name: string) => void;
    autoRequestPermission?: boolean;
  }
): Promise<CallExecutionResult> {
  const target = targetNameOrNumber.trim();
  if (!target) {
    return {
      found: false,
      contact: null,
      phoneNumber: null,
      contactName: null,
      permissionStatus: getContactsPermissionStatus(),
      message: 'Please specify a contact name or phone number to call.',
      source: 'none',
      callInitiated: false,
    };
  }

  // Check if target is directly a phone number
  const phoneDigitsMatch = target.match(/(\+?\d[\d\s\-()]{6,}\d)/);
  if (phoneDigitsMatch) {
    const directPhone = phoneDigitsMatch[0].replace(/[^0-9+]/g, '');
    if (directPhone.length >= 3) {
      toast.success(`📞 Direct Call Initiated: ${directPhone}`);
      
      if (options?.onInitiateCall) {
        options.onInitiateCall(directPhone, target);
      } else if (typeof window !== 'undefined') {
        window.location.href = `tel:${directPhone}`;
      }

      return {
        found: true,
        contact: null,
        phoneNumber: directPhone,
        contactName: target,
        permissionStatus: getContactsPermissionStatus(),
        message: `Calling ${target} at ${directPhone}.`,
        source: 'direct_number',
        callInitiated: true,
      };
    }
  }

  // Use central ContactService for contact resolution & permissions
  const lookupRes = await ContactService.lookupContact(target, {
    accessToken: options?.accessToken,
    autoPromptPermission: options?.autoRequestPermission ?? true,
  });

  if (lookupRes.found && lookupRes.phoneNumber) {
    const phone = lookupRes.phoneNumber;
    const name = lookupRes.contactName || target;

    toast.success(`📞 Calling ${name} (${phone})`);

    if (options?.onInitiateCall) {
      options.onInitiateCall(phone, name);
    } else if (typeof window !== 'undefined') {
      window.location.href = `tel:${phone}`;
    }

    return {
      found: true,
      contact: lookupRes.contact,
      phoneNumber: phone,
      contactName: name,
      permissionStatus: lookupRes.permissionStatus,
      message: `Calling ${name} at ${phone}.`,
      source: lookupRes.source,
      callInitiated: true,
    };
  }

  const notFoundMessage = `Could not find "${target}" in your device contacts or address book.`;
  toast.error(notFoundMessage);

  return {
    found: false,
    contact: null,
    phoneNumber: null,
    contactName: target,
    permissionStatus: lookupRes.permissionStatus,
    message: notFoundMessage,
    source: 'none',
    callInitiated: false,
  };
}
