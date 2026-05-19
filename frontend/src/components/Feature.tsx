import React from 'react';

type Props = {
  title: string;
  description: string;
};

export default function Feature({ title, description }: Props) {
  return (
    <div className="p-3 rounded-lg border border-p-green bg-white">
      <h3 className="font-semibold text-p-dark">{title}</h3>
      <p className="text-sm text-p-grey mt-1">{description}</p>
    </div>
  );
}
