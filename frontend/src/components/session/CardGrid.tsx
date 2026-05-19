import React from 'react';

const CARD_VALUES = ['0', '1/2', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?', '∞', '☕'];

type Props = {
  selectedValue: string | null;
  revealed: boolean;
  onEstimate: (value: string) => void;
};

export default function CardGrid({ selectedValue, revealed, onEstimate }: Props) {
  return (
    // 7 cols on sm+ → exactly 2 rows of 7 (no orphan), 4 cols on xs
    <div className="mt-3 grid grid-cols-4 sm:grid-cols-7 gap-2" role="list">
      {CARD_VALUES.map((b) => {
        const isSelected = selectedValue === b;
        return (
          <button
            key={b}
            role="listitem"
            onClick={() => onEstimate(b)}
            disabled={revealed}
            aria-label={b === '☕' ? 'Coffee break estimate' : `Estimate ${b}`}
            className={[
              'w-full rounded-md border-2 py-2 font-semibold text-sm transition-colors',
              isSelected
                ? 'border-p-blue bg-p-blue text-white shadow-md'
                : 'border-p-green bg-white text-p-dark hover:bg-p-overlay',
              revealed ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
          >
            {b}
          </button>
        );
      })}
    </div>
  );
}
