import { Mail } from 'lucide-react';
import { type ReactNode } from 'react';

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const LINKS: { href: string; icon: ReactNode; label: string }[] = [
  {
    href: 'https://www.linkedin.com/in/jakob-friberg-b61261105',
    icon: <LinkedInIcon />,
    label: 'LinkedIn',
  },
  {
    href: 'mailto:jakobfriberg1@gmail.com',
    icon: <Mail size={18} />,
    label: 'Email',
  },
];

export default function SocialLinks() {
  return (
    <div className="fixed bottom-6 right-6 z-[4] flex flex-col items-start gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
        Contact
      </span>
      <div className="flex gap-2">
      {LINKS.map(({ href, icon, label }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="flex items-center justify-center p-2.5 rounded-lg border border-white bg-[#35383B] text-white transition-colors hover:bg-white/10"
        >
          {icon}
        </a>
      ))}
      </div>
    </div>
  );
}
