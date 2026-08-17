import { useState, useCallback, useEffect } from 'react';
import { blink } from '@/lib/blink';

export interface UploadedDocument {
  id: string;
  name: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  progress?: number;
  size?: number;
  chunkCount?: number;
  errorMessage?: string;
  createdAt: string;
}

interface UseDocumentUploadOptions {
  sessionId: string;
  onDocumentsChange?: (hasDocuments: boolean) => void;
}

export function getCollectionName(sessionId: string): string {
  // Sanitize sessionId for collection name (alphanumeric + underscores only)
  const safe = sessionId.replace(/[^a-z0-9_]/gi, '_').toLowerCase().slice(0, 40);
  return `docs_${safe}`;
}

async function ensureCollection(collectionName: string): Promise<void> {
  try {
    await blink.rag.createCollection({
      name: collectionName,
      description: 'User-uploaded research documents',
    });
  } catch (error: any) {
    // 409 = already exists — that's fine
    const isExists =
      error?.message?.includes('409') ||
      error?.message?.includes('already exists') ||
      error?.code === 'COLLECTION_EXISTS';
    if (!isExists) throw error;
  }
}

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

const TEXT_TYPES = ['text/plain', 'text/markdown', 'text/csv', 'application/json'];
const TEXT_EXTS = ['txt', 'md', 'csv', 'json'];

function isTextFile(file: File): boolean {
  if (TEXT_TYPES.includes(file.type)) return true;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return TEXT_EXTS.includes(ext);
}

export function useDocumentUpload({
  sessionId,
  onDocumentsChange,
}: UseDocumentUploadOptions) {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    onDocumentsChange?.(documents.length > 0);
  }, [documents.length, onDocumentsChange]);

  const updateDoc = useCallback(
    (id: string, patch: Partial<UploadedDocument>) => {
      setDocuments(prev => prev.map(d => (d.id === id ? { ...d, ...patch } : d)));
    },
    []
  );

  const uploadDocument = useCallback(
    async (file: File) => {
      const localId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      setDocuments(prev => [
        {
          id: localId,
          name: file.name,
          status: 'uploading',
          progress: 0,
          size: file.size,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setIsUploading(true);

      try {
        const collectionName = getCollectionName(sessionId);

        // 1. Ensure RAG collection exists
        await ensureCollection(collectionName);
        updateDoc(localId, { progress: 15 });

        let extractedText = '';

        if (isTextFile(file)) {
          // 2a. Plain text: read directly
          extractedText = await readFileAsText(file);
          updateDoc(localId, { progress: 40 });
        } else {
          // 2b. Binary (PDF, DOCX): upload to storage, extract text via blink.data
          const storagePath = `docs/${sessionId}/${Date.now()}_${file.name}`;
          const storageResult = await blink.storage.upload(file, storagePath, { upsert: true });
          updateDoc(localId, { progress: 40 });

          const publicUrl = (storageResult as any).publicUrl || (storageResult as any).url;
          if (!publicUrl) throw new Error('Storage upload failed: no URL returned');

          const extraction = await blink.data.extractFromUrl(publicUrl);
          extractedText =
            typeof extraction === 'string'
              ? extraction
              : Array.isArray(extraction)
              ? extraction.join('\n')
              : '';

          updateDoc(localId, { progress: 70 });

          if (!extractedText.trim()) {
            throw new Error('No text could be extracted from this file.');
          }
        }

        // 3. Upload extracted content to RAG
        const ragDoc = await blink.rag.upload({
          collectionName,
          filename: file.name,
          content: extractedText,
          metadata: {
            sessionId,
            originalFilename: file.name,
            uploadedAt: new Date().toISOString(),
          },
        });

        updateDoc(localId, { status: 'processing', progress: 100 });

        // 4. Poll until ready
        const maxAttempts = 45;
        const pollInterval = 2000;
        let finalDoc = ragDoc;

        if (ragDoc.status === 'pending' || ragDoc.status === 'processing') {
          for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(r => setTimeout(r, pollInterval));
            const polled = await blink.rag.getDocument(ragDoc.id);

            const pct = 100 + Math.min(attempt / maxAttempts, 1) * 0; // stays at 100 during processing

            if (polled.status === 'ready') {
              finalDoc = polled;
              break;
            } else if (polled.status === 'error') {
              throw new Error(polled.errorMessage || 'Document processing failed');
            }
          }
        }

        // Replace local stub with real RAG doc ID
        setDocuments(prev =>
          prev.map(d =>
            d.id === localId
              ? {
                  ...d,
                  id: finalDoc.id,
                  status: 'ready',
                  chunkCount: (finalDoc as any).chunkCount,
                  progress: undefined,
                }
              : d
          )
        );
      } catch (error: any) {
        const isAuthError =
          error?.message?.includes('401') ||
          error?.message?.includes('Unauthorized') ||
          error?.message?.includes('auth');

        updateDoc(localId, {
          status: 'error',
          progress: undefined,
          errorMessage: isAuthError
            ? 'Sign in required to upload documents'
            : error?.message || 'Upload failed',
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [sessionId, updateDoc]
  );

  const removeDocument = useCallback(async (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    // Try to delete from RAG (may fail silently for local/error docs)
    if (!id.startsWith('doc_')) {
      try {
        await blink.rag.deleteDocument(id);
      } catch {
        // Silently ignore — might already be deleted or local-only
      }
    }
  }, []);

  return {
    documents,
    isUploading,
    uploadProgress,
    uploadDocument,
    removeDocument,
    getCollectionName: () => getCollectionName(sessionId),
  };
}
