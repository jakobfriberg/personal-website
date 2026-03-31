'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import TextIntro from '@/app/(components)/TextIntro';

export default function HomePage() {
  const [introComplete, setIntroComplete] = useState(false);

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
  }, []);

  return (
    <>
      {!introComplete && <TextIntro onComplete={handleIntroComplete} />}

      <motion.div
        className="flex min-h-screen flex-col items-center justify-center px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: introComplete ? 1 : 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <h1 className="text-4xl font-bold tracking-tight">Jakob Eck Friberg</h1>
        <p className="mt-4 text-text-secondary text-lg">Coming soon.</p>
      </motion.div>
    </>
  );
}
