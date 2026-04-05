'use client';

import { useState } from 'react';

interface PersonalItem {
  id: string;
  icon: string;
  label: string;
  description: string;
  top: string;
  left: string;
}

const ITEMS: PersonalItem[] = [
  { id: 'music', icon: '🎵', label: 'Music', description: 'Placeholder — what I listen to.', top: '15%', left: '10%' },
  { id: 'coffee', icon: '☕', label: 'Coffee', description: 'Placeholder — how I take it.', top: '35%', left: '65%' },
  { id: 'travel', icon: '✈️', label: 'Travel', description: "Placeholder — where I've been.", top: '60%', left: '25%' },
  { id: 'books', icon: '📚', label: 'Books', description: 'Placeholder — what I read.', top: '20%', left: '45%' },
  { id: 'cooking', icon: '🍳', label: 'Cooking', description: 'Placeholder — what I cook.', top: '55%', left: '75%' },
  { id: 'running', icon: '🏃', label: 'Running', description: 'Placeholder — how far I go.', top: '75%', left: '50%' },
  { id: 'film', icon: '🎬', label: 'Film', description: 'Placeholder — what I watch.', top: '40%', left: '15%' },
  { id: 'code', icon: '⌨️', label: 'Side projects', description: 'Placeholder — what I build for fun.', top: '80%', left: '10%' },
];

export default function PersonalPanel() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeItem = ITEMS.find((i) => i.id === activeId);

  return (
    <div
      className={`fixed bottom-0 right-8 z-[4] w-[360px] transition-transform duration-300 ease-in-out ${
        open
          ? 'translate-y-0'
          : 'translate-y-[calc(100%-64px)] hover:translate-y-[calc(100%-80px)]'
      }`}
    >
      <div className="rounded-t-xl border-2 border-b-0 border-white bg-[#2E3134]">
        {/* Header — always visible */}
        <div
          className="flex items-center justify-between px-8 py-5 cursor-pointer"
          onClick={() => {
            setOpen((o) => !o);
            setActiveId(null);
          }}
        >
          <span className="text-white/60 text-sm font-mono">
            Personal
          </span>
          <span
            className="text-white/40 text-xs transition-transform duration-300"
            style={{
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            &#9650;
          </span>
        </div>

        {/* Content — icon scatter area */}
        <div className="relative h-[420px] px-8 pb-8">
          {ITEMS.map((item) => (
            <button
              key={item.id}
              className={`absolute text-2xl transition-all duration-200 hover:scale-125 ${
                activeId === item.id ? 'scale-125' : ''
              }`}
              style={{ top: item.top, left: item.left }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveId(activeId === item.id ? null : item.id);
              }}
              title={item.label}
            >
              {item.icon}
            </button>
          ))}

          {/* Popover */}
          {activeItem && (
            <div
              className="absolute bottom-6 left-8 right-8 rounded-lg border border-white/20 bg-[#3a3d40] p-4 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{activeItem.icon}</span>
                <span className="text-white text-sm font-semibold">
                  {activeItem.label}
                </span>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                {activeItem.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
