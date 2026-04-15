'use client';

import { Volume2, VolumeOff } from 'lucide-react';

import { useSoundContext } from '@/app/context/sound-context';

export default function MuteButton() {
  const { muted, toggleMute } = useSoundContext();
  const Icon = muted ? VolumeOff : Volume2;

  return (
    <div className="fixed bottom-6 left-6 z-[4]">
      <button
        onClick={toggleMute}
        aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
        className="flex items-center justify-center p-2.5 rounded-lg text-white/40 transition-colors hover:text-white/60"
      >
        <Icon size={18} />
      </button>
    </div>
  );
}
