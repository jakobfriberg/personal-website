import { type AnchorHTMLAttributes, type ButtonHTMLAttributes } from 'react';

type BaseProps = {
  variant?: 'primary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
};

type AsButton = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type AsLink = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type ButtonProps = AsButton | AsLink;

const SIZE_CLASSES = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-5 text-base',
} as const;

const VARIANT_CLASSES = {
  primary: 'bg-white text-[#2E3134] hover:bg-white/90',
  outline:
    'bg-transparent text-white border border-white hover:bg-white/10',
} as const;

const BASE_CLASSES = [
  'inline-flex items-center justify-center gap-2',
  'whitespace-nowrap rounded-md font-medium',
  'transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2E3134]',
  'disabled:pointer-events-none disabled:opacity-50',
  '[&_svg]:pointer-events-none [&_svg]:shrink-0',
].join(' ');

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const classes =
    `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`.trim();

  if ('href' in props && props.href) {
    return <a className={classes} {...(props as AsLink)} />;
  }

  return <button className={classes} {...(props as AsButton)} />;
}
