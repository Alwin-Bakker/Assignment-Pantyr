import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' };

export default function Button({ children, variant = 'primary', className, disabled, ...rest }: Props) {
  const base = 'px-4 py-2 rounded-md font-medium inline-flex items-center gap-2 justify-center transition-colors';
  let styles = '';
  if (variant === 'primary')   styles = `${base} bg-p-blue text-white hover:bg-p-dark`;
  else if (variant === 'secondary') styles = `${base} bg-p-overlay text-p-dark border border-p-green hover:bg-p-green/30`;
  else if (variant === 'danger')    styles = `${base} bg-p-tomato text-white hover:bg-red-600`;
  else if (variant === 'outline')   styles = `${base} bg-transparent border border-p-navy text-p-navy hover:bg-p-navy-tl`;
  else /* ghost */                  styles = `${base} bg-transparent border border-slate-200 text-slate-600 hover:bg-slate-50`;

  const disabledStyles = disabled ? ' opacity-50 cursor-not-allowed pointer-events-none' : '';
  const mergedClassName = [styles + disabledStyles, className].filter(Boolean).join(' ');

  return (
    <button className={mergedClassName} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}
