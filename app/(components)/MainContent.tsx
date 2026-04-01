'use client';

import { motion } from 'framer-motion';

export default function MainContent() {
  return (
    <motion.div
      className="flex min-h-screen flex-col items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <h1 className="text-4xl font-bold tracking-tight">Jakob Eck Friberg</h1>
      <p className="mt-4 text-text-secondary text-lg">Coming soon.</p>
    </motion.div>
  );
}
