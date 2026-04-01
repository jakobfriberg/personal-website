'use client';

import { useCallback, useState } from 'react';

import MainContent from '@/app/(components)/MainContent';
import TextIntro from '@/app/(components)/TextIntro';

export default function HomePage() {
  const [introComplete, setIntroComplete] = useState(false);
  const handleIntroComplete = useCallback(() => setIntroComplete(true), []);

  return (
    <>
      {!introComplete && <TextIntro onComplete={handleIntroComplete} />}
      {introComplete && <MainContent />}
    </>
  );
}
