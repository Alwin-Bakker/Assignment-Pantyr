import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' };

export default function Button({ children, variant = 'primary', ...props }: Props) {
  const base = 'px-4 py-2 rounded-md font-medium inline-flex items-center gap-2 justify-center';
  let styles = '';
  if (variant === 'primary') styles = `${base} bg-sky-600 text-white hover:bg-sky-700`;
  else if (variant === 'secondary') styles = `${base} bg-sky-50 text-sky-700 border border-transparent hover:bg-sky-100`;
  else if (variant === 'danger') styles = `${base} bg-[#fd4c4c] text-white hover:bg-red-600`;
  else if (variant === 'outline') styles = `${base} bg-transparent border border-slate-200 text-slate-700 hover:bg-slate-50`;
  else styles = `${base} bg-transparent border border-slate-200 text-slate-700 hover:bg-slate-50`;

  // Append disabled styles
  const disabledStyles = props.disabled ? ' opacity-50 cursor-not-allowed pointer-events-none' : '';

  // Merge className prop instead of letting it overwrite our computed styles
  const { className, ...rest } = props as any;
  const mergedClassName = [styles + disabledStyles, className].filter(Boolean).join(' ');

  return (
    <button className={mergedClassName} {...(rest as any)}>
      {children}
    </button>
  );
}
