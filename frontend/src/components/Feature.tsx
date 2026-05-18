import React from 'react';

type Props = {
  title: string;
  description: string;
};

export default function Feature({ title, description }: Props) {
  return (
    <div className="p-3">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-slate-600 mt-1">{description}</p>
    </div>
  );
}
