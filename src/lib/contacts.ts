export interface ContactItem {
  resourceName: string;
  displayName: string;
  givenName?: string;
  familyName?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  organization?: string;
  jobTitle?: string;
  birthday?: string;
  address?: string;
}

export const fetchGoogleContacts = async (accessToken: string): Promise<ContactItem[]> => {
  const url = 'https://people.googleapis.com/v1/people/me/connections?' + new URLSearchParams({
    personFields: 'names,emailAddresses,phoneNumbers,photos,organizations,addresses,birthdays',
    pageSize: '100',
    sortOrder: 'FIRST_NAME_ASC'
  });

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch Google Contacts (${res.status})`);
  }

  const data = await res.json();
  const connections = data.connections || [];

  return connections.map((person: any): ContactItem => {
    const nameObj = person.names?.[0];
    const emailObj = person.emailAddresses?.[0];
    const phoneObj = person.phoneNumbers?.[0];
    const photoObj = person.photos?.[0];
    const orgObj = person.organizations?.[0];
    const bdayObj = person.birthdays?.[0];
    const addrObj = person.addresses?.[0];

    let birthdayStr = '';
    if (bdayObj?.date) {
      const { year, month, day } = bdayObj.date;
      birthdayStr = `${year || ''}-${month ? String(month).padStart(2, '0') : ''}-${day ? String(day).padStart(2, '0') : ''}`.replace(/^-|-$/g, '');
    }

    return {
      resourceName: person.resourceName,
      displayName: nameObj?.displayName || 'Unnamed Contact',
      givenName: nameObj?.givenName,
      familyName: nameObj?.familyName,
      email: emailObj?.value || '',
      phone: phoneObj?.value || '',
      photoUrl: photoObj?.url || '',
      organization: orgObj?.name || '',
      jobTitle: orgObj?.title || '',
      birthday: birthdayStr,
      address: addrObj?.formattedValue || ''
    };
  });
};

export const searchGoogleContacts = async (accessToken: string, query: string): Promise<ContactItem[]> => {
  if (!query.trim()) return fetchGoogleContacts(accessToken);

  const url = 'https://people.googleapis.com/v1/people:searchContacts?' + new URLSearchParams({
    query: query.trim(),
    readMask: 'names,emailAddresses,phoneNumbers,photos,organizations,addresses,birthdays',
    pageSize: '30'
  });

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to search Google Contacts (${res.status})`);
  }

  const data = await res.json();
  const results = data.results || [];

  return results.map((item: any): ContactItem => {
    const person = item.person;
    const nameObj = person.names?.[0];
    const emailObj = person.emailAddresses?.[0];
    const phoneObj = person.phoneNumbers?.[0];
    const photoObj = person.photos?.[0];
    const orgObj = person.organizations?.[0];

    return {
      resourceName: person.resourceName,
      displayName: nameObj?.displayName || 'Unnamed Contact',
      givenName: nameObj?.givenName,
      familyName: nameObj?.familyName,
      email: emailObj?.value || '',
      phone: phoneObj?.value || '',
      photoUrl: photoObj?.url || '',
      organization: orgObj?.name || '',
      jobTitle: orgObj?.title || ''
    };
  });
};

export const createGoogleContact = async (
  accessToken: string,
  contact: {
    givenName: string;
    familyName?: string;
    email?: string;
    phone?: string;
    organization?: string;
    jobTitle?: string;
  }
): Promise<ContactItem> => {
  const body: any = {
    names: [
      {
        givenName: contact.givenName,
        familyName: contact.familyName || ''
      }
    ]
  };

  if (contact.email) {
    body.emailAddresses = [{ value: contact.email }];
  }
  if (contact.phone) {
    body.phoneNumbers = [{ value: contact.phone }];
  }
  if (contact.organization || contact.jobTitle) {
    body.organizations = [{ name: contact.organization || '', title: contact.jobTitle || '' }];
  }

  const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to create contact (${res.status})`);
  }

  const person = await res.json();
  const nameObj = person.names?.[0];
  const emailObj = person.emailAddresses?.[0];
  const phoneObj = person.phoneNumbers?.[0];

  return {
    resourceName: person.resourceName,
    displayName: nameObj?.displayName || `${contact.givenName} ${contact.familyName || ''}`.trim(),
    givenName: nameObj?.givenName,
    familyName: nameObj?.familyName,
    email: emailObj?.value || contact.email || '',
    phone: phoneObj?.value || contact.phone || '',
    organization: contact.organization,
    jobTitle: contact.jobTitle
  };
};

export const deleteGoogleContact = async (accessToken: string, resourceName: string): Promise<void> => {
  const res = await fetch(`https://people.googleapis.com/v1/${resourceName}:deleteContact`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to delete contact (${res.status})`);
  }
};

const LOCAL_CONTACTS_KEY = 'k3_local_contacts_v1';

export const DEFAULT_CONTACTS_BOOK: ContactItem[] = [
  { resourceName: 'local_1', displayName: 'Mom', phone: '+18005550199', email: 'mom@family.com' },
  { resourceName: 'local_2', displayName: 'Dad', phone: '+18005550188', email: 'dad@family.com' },
  { resourceName: 'local_3', displayName: 'Rajeev', phone: '+919876543210', email: 'rajeev@example.com' },
  { resourceName: 'local_4', displayName: 'Amit', phone: '+919812345678', email: 'amit@example.com' },
  { resourceName: 'local_5', displayName: 'Brother', phone: '+18005550177' },
  { resourceName: 'local_6', displayName: 'Emergency Services', phone: '911' },
];

export const getLocalContacts = (): ContactItem[] => {
  if (typeof window === 'undefined') return DEFAULT_CONTACTS_BOOK;
  try {
    const saved = localStorage.getItem(LOCAL_CONTACTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load local contacts:', e);
  }
  return DEFAULT_CONTACTS_BOOK;
};

export const saveLocalContact = (contact: Omit<ContactItem, 'resourceName'>): ContactItem => {
  const current = getLocalContacts();
  const newContact: ContactItem = {
    ...contact,
    resourceName: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  };
  const updated = [newContact, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_CONTACTS_KEY, JSON.stringify(updated));
  }
  return newContact;
};

export const deleteLocalContact = (resourceName: string): ContactItem[] => {
  const current = getLocalContacts();
  const updated = current.filter(c => c.resourceName !== resourceName);
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_CONTACTS_KEY, JSON.stringify(updated));
  }
  return updated;
};

