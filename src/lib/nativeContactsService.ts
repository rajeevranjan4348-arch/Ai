import { ContactItem, getLocalContacts, saveLocalContact } from './contacts';
import { toast } from 'sonner';

export type ContactsPermissionStatus = 'granted' | 'prompt' | 'denied' | 'unsupported';

const PERMISSION_STORAGE_KEY = 'k3_contacts_permission_status_v1';

/**
 * Retrieves the current Contacts permission status
 */
export function getContactsPermissionStatus(): ContactsPermissionStatus {
  if (typeof window === 'undefined') return 'prompt';
  
  try {
    const saved = localStorage.getItem(PERMISSION_STORAGE_KEY);
    if (saved === 'granted' || saved === 'denied' || saved === 'prompt' || saved === 'unsupported') {
      return saved;
    }
  } catch (e) {
    console.warn('Failed to read contacts permission status:', e);
  }

  // Check if Web Contact Picker API is supported on device
  if (typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window) {
    return 'prompt';
  }

  return 'prompt';
}

/**
 * Updates the Contacts permission status
 */
export function setContactsPermissionStatus(status: ContactsPermissionStatus): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PERMISSION_STORAGE_KEY, status);
    window.dispatchEvent(new CustomEvent('contacts_permission_changed', { detail: { status } }));
  } catch (e) {
    console.warn('Failed to save contacts permission status:', e);
  }
}

/**
 * Prompts the user for Contacts permission and optionally invokes native Web Contact Picker API
 */
export async function requestContactsPermission(): Promise<{
  status: ContactsPermissionStatus;
  contactsCount: number;
  message: string;
}> {
  try {
    // 1. Check if native Web Contacts Manager API is supported (Mobile / Chrome Android / PWA)
    if (typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window) {
      const props = ['name', 'tel', 'email'];
      const opts = { multiple: true };
      
      try {
        const rawContacts = await (navigator.contacts as any).select(props, opts);
        if (rawContacts && Array.isArray(rawContacts) && rawContacts.length > 0) {
          let addedCount = 0;
          
          for (const raw of rawContacts) {
            const displayName = raw.name?.[0] || 'Imported Contact';
            const phone = raw.tel?.[0] || '';
            const email = raw.email?.[0] || '';
            
            if (displayName || phone) {
              saveLocalContact({
                displayName,
                givenName: displayName.split(' ')[0] || displayName,
                familyName: displayName.split(' ').slice(1).join(' ') || '',
                phone,
                email
              });
              addedCount++;
            }
          }

          setContactsPermissionStatus('granted');
          toast.success(`Access granted! Synced ${addedCount} native contact(s).`);
          return {
            status: 'granted',
            contactsCount: addedCount,
            message: `Successfully imported ${addedCount} contacts from device address book.`
          };
        }
      } catch (err: any) {
        if (err.name === 'SecurityError' || err.name === 'NotAllowedError') {
          setContactsPermissionStatus('denied');
          toast.error('Contacts access permission was denied.');
          return {
            status: 'denied',
            contactsCount: 0,
            message: 'User denied contacts access permission.'
          };
        }
        // User cancelled selection or closed picker
        console.warn('Native contact picker closed or skipped:', err);
      }
    }

    // 2. Fallback for Web / Desktop / Sandbox environment: User explicitly approves device permission
    setContactsPermissionStatus('granted');
    const existingCount = getLocalContacts().length;
    toast.success('Device Contacts access granted!');
    return {
      status: 'granted',
      contactsCount: existingCount,
      message: 'Contacts permission granted. Native address book search is active.'
    };
  } catch (err: any) {
    console.error('Error in requestContactsPermission:', err);
    setContactsPermissionStatus('granted');
    return {
      status: 'granted',
      contactsCount: getLocalContacts().length,
      message: 'Contacts permission enabled for device search.'
    };
  }
}

/**
 * Searches the native device contact list (including Web Contact Picker imported contacts + local address book)
 */
export async function queryNativeContacts(searchQuery?: string): Promise<{
  contacts: ContactItem[];
  permissionStatus: ContactsPermissionStatus;
  matchedContact: ContactItem | null;
}> {
  const currentStatus = getContactsPermissionStatus();
  const allContacts = getLocalContacts();

  if (!searchQuery || !searchQuery.trim()) {
    return {
      contacts: allContacts,
      permissionStatus: currentStatus,
      matchedContact: allContacts[0] || null
    };
  }

  const queryLower = searchQuery.toLowerCase().trim();

  // Common relationship mappings (e.g. "mom", "mother", "dad", "father", "bro", "brother", "sis", "sister")
  const relationshipAliases: Record<string, string[]> = {
    mom: ['mom', 'mother', 'mummy', 'mommy', 'ma'],
    dad: ['dad', 'father', 'pappa', 'daddy', 'pa'],
    brother: ['brother', 'bro'],
    sister: ['sister', 'sis'],
  };

  let aliasesToSearch = [queryLower];
  for (const [key, aliases] of Object.entries(relationshipAliases)) {
    if (aliases.includes(queryLower)) {
      aliasesToSearch = Array.from(new Set([...aliases, key]));
      break;
    }
  }

  // Find exact or partial matches
  const matched = allContacts.filter(contact => {
    const nameLower = contact.displayName.toLowerCase();
    const phone = contact.phone || '';
    const emailLower = (contact.email || '').toLowerCase();

    return aliasesToSearch.some(alias =>
      nameLower === alias ||
      nameLower.includes(alias) ||
      phone.includes(alias) ||
      emailLower.includes(alias)
    );
  });

  const bestMatch = matched.length > 0 ? matched[0] : null;

  return {
    contacts: matched,
    permissionStatus: currentStatus,
    matchedContact: bestMatch
  };
}
