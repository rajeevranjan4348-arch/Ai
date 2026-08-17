import React, { memo } from 'react';
import { motion } from 'framer-motion';

interface MessageItemProps {
  children: React.ReactNode;
  isUser: boolean;
  onDelete?: () => void;
}

export const MessageItem: React.FC<MessageItemProps> = memo(({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative group/msg"
    >
      {children}
    </motion.div>
  );
});

MessageItem.displayName = 'MessageItem';

