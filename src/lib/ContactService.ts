import { ContactItem, getLocalContacts, searchGoogleContacts, saveLocalContact } from './contacts';
import {
  queryNativeContacts,
  getContactsPermissionStatus,
  setContactsPermissionStatus,
  requestContactsPermission,
  ContactsPermissionStatus
} from './nativeContactsService';
import { toast } from 'sonner';

export interface ContactLookupResult {
  found: boolean;
  phoneNumber: string | null;
  contactName: string | null;
  contact: ContactItem | null;
  permissionStatus: ContactsPermissionStatus;
  message: string;
  source: 'native' | 'google' | 'local' | 'direct_number' | 'none';
}

export class ContactService {
  /**
   * Check contact permission status via navigator.permissions or fallback store
   */
  public static async checkPermission(): Promise<ContactsPermissionStatus> {
    if (typeof navigator !== 'undefined' && navigator.permissions && typeof navigator.permissions.query === 'function') {
      try {
        const permissionDesc = { name: 'contacts' as any };
        const status = await navigator.permissions.query(permissionDesc);
        if (status.state === 'granted') {
          setContactsPermissionStatus('granted');
          return 'granted';
        } else if (status.state === 'denied') {
          setContactsPermissionStatus('denied');
          return 'denied';
        }
      } catch (e) {
        // navigator.permissions 'contacts' name not standard in all browsers
      }
    }

    return getContactsPermissionStatus();
  }

  /**
   * Prompt user to grant contacts permission
   */
  public static async requestPermission(): Promise<ContactsPermissionStatus> {
    const res = await requestContactsPermission();
    return res.status;
  }

  /**
   * Primary lookup function: Resolves names, relationship terms (e.g. Mom, Dad),
   * or direct phone numbers to numbers for AI call triggers.
   */
  public static async lookupContact(
    nameOrQuery: string,
    options?: { accessToken?: string; autoPromptPermission?: boolean }
  ): Promise<ContactLookupResult> {
    const query = nameOrQuery.trim();
    if (!query) {
      return {
        found: false,
        phoneNumber: null,
        contactName: null,
        contact: null,
        permissionStatus: await this.checkPermission(),
        message: 'No search term provided.',
        source: 'none',
      };
    }

    // 1. Direct phone number check
    const phoneMatch = query.match(/(\+?\d[\d\s\-()]{6,}\d)/);
    if (phoneMatch) {
      const cleanPhone = phoneMatch[0].replace(/[^0-9+]/g, '');
      if (cleanPhone.length >= 3) {
        return {
          found: true,
          phoneNumber: cleanPhone,
          contactName: query,
          contact: null,
          permissionStatus: await this.checkPermission(),
          message: `Direct phone number identified: ${cleanPhone}`,
          source: 'direct_number',
        };
      }
    }

    // 2. Permission check / request
    let currentPermission = await this.checkPermission();
    if (currentPermission !== 'granted' && options?.autoPromptPermission) {
      currentPermission = await this.requestPermission();
    }

    // 3. Search Native Contacts API / address book
    try {
      const nativeRes = await queryNativeContacts(query);
      if (nativeRes.matchedContact && nativeRes.matchedContact.phone) {
        return {
          found: true,
          phoneNumber: nativeRes.matchedContact.phone,
          contactName: nativeRes.matchedContact.displayName,
          contact: nativeRes.matchedContact,
          permissionStatus: currentPermission,
          message: `Found in native contacts: ${nativeRes.matchedContact.displayName}`,
          source: 'native',
        };
      }
    } catch (err) {
      console.warn('Native contacts lookup failed:', err);
    }

    // 4. Search Google Contacts API if logged in
    if (options?.accessToken) {
      try {
        const googleContacts = await searchGoogleContacts(options.accessToken, query);
        if (googleContacts.length > 0 && googleContacts[0].phone) {
          const matched = googleContacts[0];
          return {
            found: true,
            phoneNumber: matched.phone!,
            contactName: matched.displayName,
            contact: matched,
            permissionStatus: currentPermission,
            message: `Found in Google Contacts: ${matched.displayName}`,
            source: 'google',
          };
        }
      } catch (err) {
        console.warn('Google Contacts lookup failed:', err);
      }
    }

    // 5. Search local contacts store & relationship aliases
    const localContacts = getLocalContacts();
    const queryLower = query.toLowerCase();

    const aliasMap: Record<string, string[]> = {
      mom: ['mom', 'mother', 'mummy', 'mommy', 'ma'],
      dad: ['dad', 'father', 'pappa', 'daddy', 'pa'],
      brother: ['brother', 'bro'],
      sister: ['sister', 'sis'],
    };

    let targetAliases = [queryLower];
    for (const [key, aliases] of Object.entries(aliasMap)) {
      if (aliases.includes(queryLower)) {
        targetAliases = Array.from(new Set([...aliases, key]));
        break;
      }
    }

    const matched = localContacts.find(c => {
      const nameLower = c.displayName.toLowerCase();
      const phone = c.phone || '';
      return targetAliases.some(alias => nameLower.includes(alias) || phone.includes(alias));
    });

    if (matched && matched.phone) {
      return {
        found: true,
        phoneNumber: matched.phone,
        contactName: matched.displayName,
        contact: matched,
        permissionStatus: currentPermission,
        message: `Found in local contacts: ${matched.displayName}`,
        source: 'local',
      };
    }

    return {
      found: false,
      phoneNumber: null,
      contactName: query,
      contact: null,
      permissionStatus: currentPermission,
      message: `Contact "${query}" not found in address book.`,
      source: 'none',
    };
  }

  /**
   * Search function to resolve names or query terms to matching contact records and phone numbers
   */
  public static async search(
    query: string,
    options?: { accessToken?: string; autoPromptPermission?: boolean }
  ): Promise<ContactLookupResult> {
    return this.lookupContact(query, options);
  }

  public static async searchContacts(
    query: string,
    options?: { accessToken?: string; autoPromptPermission?: boolean }
  ): Promise<ContactLookupResult> {
    return this.lookupContact(query, options);
  }

  /**
   * Helper function for the AI to quickly resolve names to numbers for phone call triggers
   */
  public static async resolveNameToNumber(name: string, accessToken?: string): Promise<string | null> {
    const result = await this.lookupContact(name, { accessToken, autoPromptPermission: true });
    return result.found ? result.phoneNumber : null;
  }
}

export default ContactService;
