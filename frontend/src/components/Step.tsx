import React from 'react';

type Props = {
  Icon: React.FC<any>;
  title: string;
  description?: string;
};

export default function Step({ Icon, title, description }: Props) {
  return (
    <div className="flex-1 min-w-0 flex flex-col items-center text-center px-3 py-4 h-full">
      <div className="flex flex-col items-center justify-center gap-2 h-full w-full">
        <div className="p-3 rounded-lg bg-slate-100">
          <Icon size={28} className="text-sky-600" />
        </div>
        <div className="mt-2 font-semibold">{title}</div>
        {description && <div className="text-sm text-slate-600 mt-1">{description}</div>}
      </div>
    </div>
  );
}
