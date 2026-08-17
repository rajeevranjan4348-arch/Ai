import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingIndicatorProps {
  isVisible: boolean;
  message?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ isVisible, message }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 bg-foreground text-background px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50"
        >
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm font-medium">{message || 'Loading...'}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
