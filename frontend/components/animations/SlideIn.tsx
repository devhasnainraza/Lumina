'use client';

import { motion } from 'framer-motion';
import { slideInVariants } from '@/lib/constants/animations';

interface SlideInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function SlideIn({ children, delay = 0, duration = 0.3, className }: SlideInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideInVariants}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
