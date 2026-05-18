import React from 'react';

type Props = (React.InputHTMLAttributes<HTMLInputElement> | React.TextareaHTMLAttributes<HTMLTextAreaElement>) & {
  label?: string;
  multiline?: boolean;
  rows?: number;
};

export default function Input({ label, className = '', multiline = false, rows = 4, ...props }: Props) {
  const id = (props as any).id as string | undefined;
  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm text-slate-600">
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          rows={rows}
          id={id}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      ) : (
        <input
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          id={id}
          className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      )}
    </div>
  );
}
