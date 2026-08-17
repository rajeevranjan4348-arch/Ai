import React, { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';

interface DocumentPanelProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onDocumentsChange: (hasDocuments: boolean) => void;
}

const ACCEPTED_TYPES = ['.pdf', '.txt', '.md'];
const ACCEPTED_MIME = ['application/pdf', 'text/plain', 'text/markdown'];

function getFileExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() || '';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const DocumentPanel: React.FC<DocumentPanelProps> = ({
  sessionId,
  isOpen,
  onClose,
  onDocumentsChange,
}) => {
  const { documents, isUploading, uploadProgress, uploadDocument, removeDocument } =
    useDocumentUpload({ sessionId, onDocumentsChange });

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const valid = fileArray.filter(
        f => ACCEPTED_MIME.includes(f.type) || ACCEPTED_TYPES.includes(`.${getFileExtension(f.name)}`)
      );
      valid.forEach(f => uploadDocument(f));
    },
    [uploadDocument]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = '';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.8 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-[#111111] border-l border-white/5 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 shrink-0">
              <div>
                <h2 className="text-[13px] font-semibold text-white/80">Documents</h2>
                <p className="text-[11px] text-white/30 mt-0.5">
                  AI will reference these when answering
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
                aria-label="Close panel"
              >
                <X size={15} />
              </button>
            </div>

            {/* Drop Zone */}
            <div className="px-3 pt-3 shrink-0">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'relative border border-dashed rounded-xl p-4 cursor-pointer transition-all duration-200',
                  'flex flex-col items-center gap-2 text-center',
                  isDragging
                    ? 'border-white/30 bg-white/5 scale-[1.01]'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/3'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={ACCEPTED_TYPES.join(',')}
                  multiple
                  onChange={handleInputChange}
                />

                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
                    isDragging ? 'bg-white/10' : 'bg-white/5'
                  )}
                >
                  {isUploading ? (
                    <Loader2 size={16} className="text-white/50 animate-spin" />
                  ) : (
                    <Upload size={16} className="text-white/40" />
                  )}
                </div>

                <div>
                  <p className="text-[12px] text-white/50 font-medium">
                    {isDragging ? 'Drop files here' : 'Drop files or click to upload'}
                  </p>
                  <p className="text-[10.5px] text-white/25 mt-0.5">PDF, TXT, MD supported</p>
                </div>

                {/* Upload progress bar */}
                <AnimatePresence>
                  {isUploading && uploadProgress > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 rounded-b-xl overflow-hidden"
                    >
                      <motion.div
                        className="h-full bg-emerald-400/60"
                        initial={{ width: '0%' }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ ease: 'linear', duration: 0.3 }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Document list */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
              <AnimatePresence initial={false}>
                {documents.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-3 py-12 text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/3 flex items-center justify-center">
                      <FileText size={18} className="text-white/15" />
                    </div>
                    <p className="text-[12px] text-white/25 max-w-[200px] leading-relaxed">
                      No documents uploaded yet. Add files to help the AI answer better.
                    </p>
                  </motion.div>
                ) : (
                  documents.map((doc, i) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.97 }}
                      transition={{ delay: i * 0.04, duration: 0.2 }}
                      className="group flex items-start gap-2.5 p-2.5 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors"
                    >
                      {/* File icon */}
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText size={13} className="text-white/40" />
                      </div>

                      {/* File info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[12px] text-white/70 font-medium truncate"
                          title={doc.name}
                        >
                          {doc.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {doc.status === 'processing' && (
                            <>
                              <Loader2 size={9} className="text-amber-400/60 animate-spin shrink-0" />
                              <span className="text-[10px] text-amber-400/50">Processing…</span>
                            </>
                          )}
                          {doc.status === 'ready' && (
                            <>
                              <CheckCircle size={9} className="text-emerald-400/60 shrink-0" />
                              <span className="text-[10px] text-emerald-400/50">
                                Ready{doc.chunkCount ? ` · ${doc.chunkCount} chunks` : ''}
                              </span>
                            </>
                          )}
                          {doc.status === 'error' && (
                            <>
                              <AlertCircle size={9} className="text-red-400/60 shrink-0" />
                              <span className="text-[10px] text-red-400/50">Failed to process</span>
                            </>
                          )}
                          {doc.status === 'uploading' && (
                            <>
                              <Loader2 size={9} className="text-white/40 animate-spin shrink-0" />
                              <span className="text-[10px] text-white/30">Uploading…</span>
                            </>
                          )}
                          {doc.size && (
                            <span className="text-[10px] text-white/20 ml-auto shrink-0">
                              {formatBytes(doc.size)}
                            </span>
                          )}
                        </div>

                        {/* Per-doc progress bar */}
                        {doc.status === 'uploading' && typeof doc.progress === 'number' && (
                          <div className="mt-1.5 h-px bg-white/8 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-white/30"
                              initial={{ width: '0%' }}
                              animate={{ width: `${doc.progress}%` }}
                              transition={{ ease: 'linear', duration: 0.3 }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => removeDocument(doc.id)}
                        className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/8 text-white/25 hover:text-white/60 transition-all shrink-0"
                        title="Remove document"
                        aria-label="Remove document"
                      >
                        <X size={12} />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Footer note */}
            {documents.length > 0 && (
              <div className="px-4 py-3 border-t border-white/5 shrink-0">
                <p className="text-[10.5px] text-white/25 leading-relaxed">
                  AI will reference these documents when answering questions in this session.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
