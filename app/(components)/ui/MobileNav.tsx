import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MobileNav({
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[5] flex gap-3 lg:hidden">
      <button
        onClick={onPrev}
        disabled={!hasPrev}
        aria-label="Previous card"
        className="flex items-center justify-center w-10 h-10 rounded-lg border border-white bg-[#35383B] text-white transition-colors hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={onNext}
        disabled={!hasNext}
        aria-label="Next card"
        className="flex items-center justify-center w-10 h-10 rounded-lg border border-white bg-[#35383B] text-white transition-colors hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
