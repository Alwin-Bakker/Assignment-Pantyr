import React from 'react';

type BaseProps = { label?: string; className?: string };

type InputFieldProps = BaseProps &
  React.InputHTMLAttributes<HTMLInputElement> & {
    multiline?: false;
    rows?: never;
  };

type TextareaProps = BaseProps &
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    multiline: true;
    rows?: number;
  };

type Props = InputFieldProps | TextareaProps;

export default function Input({ label, className = '', multiline, rows = 4, ...props }: Props) {
  const id = props.id;
  const sharedClassName =
    'rounded-md border border-p-green bg-white px-3 py-2 text-sm text-p-black placeholder:text-p-grey focus:outline-none focus:ring-2 focus:ring-p-blue';

  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-p-dark">
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          rows={rows}
          id={id}
          className={sharedClassName}
        />
      ) : (
        <input
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          id={id}
          className={`h-10 ${sharedClassName}`}
        />
      )}
    </div>
  );
}

