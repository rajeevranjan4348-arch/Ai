import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  UserPlus,
  Trash2,
  Mail,
  Phone,
  Building,
  RefreshCw,
  LogOut,
  Users,
  Check,
  Copy,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken
} from '@/lib/firebase';
import {
  ContactItem,
  fetchGoogleContacts,
  searchGoogleContacts,
  createGoogleContact,
  deleteGoogleContact,
  getLocalContacts,
  saveLocalContact,
  deleteLocalContact
} from '@/lib/contacts';
import {
  getContactsPermissionStatus,
  requestContactsPermission,
  ContactsPermissionStatus
} from '@/lib/nativeContactsService';
import { toast } from 'react-hot-toast';

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContact?: (contact: ContactItem) => void;
}

export const ContactsModal: React.FC<ContactsModalProps> = ({
  isOpen,
  onClose,
  onSelectContact
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getAccessToken());
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<ContactsPermissionStatus>(getContactsPermissionStatus());
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const handleGrantPermission = async () => {
    setIsRequestingPermission(true);
    try {
      const res = await requestContactsPermission();
      setPermissionStatus(res.status);
      loadContacts(accessToken || undefined);
    } catch (e) {
      console.warn('Permission request error:', e);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Add Contact Form State
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation Modals
  const [confirmAddData, setConfirmAddData] = useState<boolean>(false);
  const [contactToDelete, setContactToDelete] = useState<ContactItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setNeedsAuth(false);
      },
      () => {
        setNeedsAuth(true);
        setUser(null);
        setAccessToken(null);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  // Load Contacts (Google or Local fallback)
  const loadContacts = async (tokenToUse?: string) => {
    const token = tokenToUse || accessToken || getAccessToken();
    if (!token) {
      const localData = getLocalContacts();
      setContacts(localData);
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchGoogleContacts(token);
      setContacts(data);
    } catch (err: any) {
      console.error('Error loading contacts, using local fallback:', err);
      const localData = getLocalContacts();
      setContacts(localData);
      if (err.message?.includes('401') || err.message?.includes('UNAUTHENTICATED')) {
        setNeedsAuth(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadContacts(accessToken || undefined);
    }
  }, [isOpen, accessToken, needsAuth]);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        setNeedsAuth(false);
        toast.success(`Signed in as ${res.user.displayName || res.user.email}`);
        loadContacts(res.accessToken);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      toast.error('Sign in failed. Showing local contact book.');
      const localData = getLocalContacts();
      setContacts(localData);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    const token = accessToken || getAccessToken();

    if (!query.trim()) {
      loadContacts(token || undefined);
      return;
    }

    if (!token) {
      const lower = query.toLowerCase();
      const filtered = getLocalContacts().filter(c =>
        c.displayName.toLowerCase().includes(lower) ||
        c.phone?.toLowerCase().includes(lower) ||
        c.email?.toLowerCase().includes(lower)
      );
      setContacts(filtered);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchGoogleContacts(token, query);
      setContacts(results);
    } catch (err: any) {
      console.error('Search error, searching local contacts:', err);
      const lower = query.toLowerCase();
      const filtered = getLocalContacts().filter(c =>
        c.displayName.toLowerCase().includes(lower) ||
        c.phone?.toLowerCase().includes(lower) ||
        c.email?.toLowerCase().includes(lower)
      );
      setContacts(filtered);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1 Add Contact submission -> prompt user confirmation dialog
  const promptAddConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!givenName.trim()) {
      toast.error('First name is required');
      return;
    }
    setConfirmAddData(true);
  };

  // Step 2 Execute Add Contact after user explicitly confirms in dialog
  const handleConfirmCreateContact = async () => {
    const token = accessToken || getAccessToken();

    setIsSubmitting(true);
    try {
      if (token) {
        const newContact = await createGoogleContact(token, {
          givenName: givenName.trim(),
          familyName: familyName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          organization: organization.trim(),
          jobTitle: jobTitle.trim()
        });
        toast.success(`Added ${newContact.displayName} to Google Contacts!`);
      } else {
        const displayName = `${givenName.trim()} ${familyName.trim()}`.trim();
        const localCreated = saveLocalContact({
          displayName,
          givenName: givenName.trim(),
          familyName: familyName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          organization: organization.trim(),
          jobTitle: jobTitle.trim()
        });
        toast.success(`Added ${localCreated.displayName} to local contact book!`);
      }

      setGivenName('');
      setFamilyName('');
      setEmail('');
      setPhone('');
      setOrganization('');
      setJobTitle('');
      setIsAddingContact(false);
      setConfirmAddData(false);
      loadContacts(token || undefined);
    } catch (err: any) {
      console.error('Error creating contact:', err);
      toast.error(err.message || 'Failed to create contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Delete Contact after user explicitly confirms
  const handleConfirmDeleteContact = async () => {
    if (!contactToDelete) return;
    const token = accessToken || getAccessToken();

    setIsSubmitting(true);
    try {
      if (token && !contactToDelete.resourceName.startsWith('local_')) {
        await deleteGoogleContact(token, contactToDelete.resourceName);
        toast.success(`Deleted ${contactToDelete.displayName} from Google Contacts`);
      } else {
        deleteLocalContact(contactToDelete.resourceName);
        toast.success(`Deleted ${contactToDelete.displayName} from local address book`);
      }
      setContactToDelete(null);
      loadContacts(token || undefined);
    } catch (err: any) {
      console.error('Error deleting contact:', err);
      toast.error(err.message || 'Failed to delete contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyContact = (contact: ContactItem) => {
    const details = [
      contact.displayName,
      contact.email ? `Email: ${contact.email}` : '',
      contact.phone ? `Phone: ${contact.phone}` : '',
      contact.organization ? `Org: ${contact.organization}` : ''
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(details);
    setCopiedId(contact.resourceName);
    toast.success('Contact info copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Users size={20} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  Google Contacts
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-normal">
                    Workspace
                  </span>
                </h2>
                <p className="text-xs text-neutral-400">
                  {user ? user.email : 'Connect your Google account to view contacts'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {user && (
                <button
                  onClick={() => {
                    logout();
                    setUser(null);
                    setAccessToken(null);
                    setNeedsAuth(true);
                    setContacts([]);
                  }}
                  className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  title="Sign out of Google"
                >
                  <LogOut size={16} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {needsAuth ? (
              /* Sign In Card */
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-5">
                <div className="p-4 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Users size={36} />
                </div>
                <div className="max-w-md space-y-2">
                  <h3 className="text-lg font-semibold text-white">
                    Access your Google Contacts
                  </h3>
                  <p className="text-sm text-neutral-400">
                    Sign in with Google to view, search, and manage your contacts directly inside the app with permission.
                  </p>
                </div>

                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white text-neutral-900 font-medium hover:bg-neutral-100 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <span>{isLoggingIn ? 'Signing in...' : 'Sign in with Google'}</span>
                </button>
              </div>
            ) : (
              /* Authenticated View */
              <>
                {/* Device Contacts Permission & Native Search Status Card */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-neutral-900 to-purple-950/40 border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                      <UserCheck size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">Device Native Contacts</span>
                        {permissionStatus === 'granted' ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Access Granted
                          </span>
                        ) : permissionStatus === 'denied' ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                            Denied
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Permission Needed
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-snug">
                        Enables Rishi AI to query native address book when you say "Call Mom" or "Phone Dad".
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleGrantPermission}
                    disabled={isRequestingPermission}
                    className="shrink-0 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <UserPlus size={14} />
                    <span>{permissionStatus === 'granted' ? 'Sync Contacts' : 'Grant Permission'}</span>
                  </button>
                </div>

                {/* Search & Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
                  <div className="relative w-full sm:w-72">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search contacts..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => loadContacts()}
                      disabled={isLoading}
                      className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                      title="Refresh contacts"
                    >
                      <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>

                    <button
                      onClick={() => setIsAddingContact(prev => !prev)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                    >
                      <UserPlus size={15} />
                      <span>{isAddingContact ? 'Cancel' : 'New Contact'}</span>
                    </button>
                  </div>
                </div>

                {/* Add Contact Form Inline */}
                <AnimatePresence>
                  {isAddingContact && (
                    <motion.form
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      onSubmit={promptAddConfirmation}
                      className="p-4 bg-neutral-950 rounded-xl border border-blue-500/20 space-y-3 overflow-hidden"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-blue-400">
                        <span>ADD NEW GOOGLE CONTACT</span>
                        <span className="text-neutral-500 font-normal">Will be saved to Google Account</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          required
                          placeholder="First Name *"
                          value={givenName}
                          onChange={(e) => setGivenName(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={familyName}
                          onChange={(e) => setFamilyName(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="email"
                          placeholder="Email Address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Organization / Company"
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Job Title"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddingContact(false)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                        >
                          Save Contact
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Contacts List */}
                {isLoading && contacts.length === 0 ? (
                  <div className="py-12 text-center text-neutral-400 space-y-2">
                    <RefreshCw size={24} className="animate-spin mx-auto text-blue-400" />
                    <p className="text-xs">Fetching Google Contacts...</p>
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="py-12 text-center text-neutral-500 space-y-2">
                    <Users size={32} className="mx-auto opacity-40" />
                    <p className="text-sm">No contacts found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <div
                        key={contact.resourceName}
                        className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 hover:border-neutral-700 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {contact.photoUrl ? (
                            <img
                              src={contact.photoUrl}
                              alt={contact.displayName}
                              className="w-10 h-10 rounded-full object-cover shrink-0 border border-neutral-800"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold flex items-center justify-center shrink-0">
                              {contact.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-white truncate">
                              {contact.displayName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-400">
                              {contact.email && (
                                <span className="flex items-center gap-1 truncate">
                                  <Mail size={12} className="shrink-0 text-neutral-500" />
                                  {contact.email}
                                </span>
                              )}
                              {contact.phone && (
                                <span className="flex items-center gap-1 shrink-0">
                                  <Phone size={12} className="shrink-0 text-neutral-500" />
                                  {contact.phone}
                                </span>
                              )}
                              {contact.organization && (
                                <span className="flex items-center gap-1 truncate text-neutral-500">
                                  <Building size={12} className="shrink-0" />
                                  {contact.organization} {contact.jobTitle ? `(${contact.jobTitle})` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          {onSelectContact && (
                            <button
                              onClick={() => {
                                onSelectContact(contact);
                                toast.success(`Selected ${contact.displayName}`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-xs font-medium border border-blue-500/30 transition-colors"
                            >
                              Insert
                            </button>
                          )}

                          <button
                            onClick={() => handleCopyContact(contact)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                            title="Copy contact details"
                          >
                            {copiedId === contact.resourceName ? (
                              <Check size={15} className="text-green-400" />
                            ) : (
                              <Copy size={15} />
                            )}
                          </button>

                          <button
                            onClick={() => setContactToDelete(contact)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                            title="Delete contact"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-neutral-800 bg-neutral-950/80 text-xs text-neutral-500 flex items-center justify-between">
            <span>Google People API v1</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <UserCheck size={13} />
              OAuth Scopes Active
            </span>
          </div>
        </motion.div>

        {/* Confirmation Modal for Creating Contact */}
        {confirmAddData && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 text-blue-400">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <UserPlus size={20} />
                </div>
                <h3 className="text-base font-semibold text-white">Create Google Contact?</h3>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                Are you sure you want to add <strong className="text-white">{givenName} {familyName}</strong> to your Google Contacts? This will save the contact directly to your Google account.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setConfirmAddData(false)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCreateContact}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white"
                >
                  {isSubmitting ? 'Creating...' : 'Yes, Create Contact'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal for Deleting Contact */}
        {contactToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 text-red-400">
                <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="text-base font-semibold text-white">Delete Contact?</h3>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-white">{contactToDelete.displayName}</strong> from your Google Contacts? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setContactToDelete(null)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteContact}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white"
                >
                  {isSubmitting ? 'Deleting...' : 'Yes, Delete Contact'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
