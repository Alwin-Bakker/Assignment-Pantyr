module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        'p-blue':    '#19a9a0',   // pantyr-nordic-blue
        'p-green':   '#89d4c6',   // pantyr-nordic-green
        'p-yellow':  '#e8e73f',   // mev-yellow
        'p-navy':    '#346c9f',   // mev-blue
        'p-gold':    '#c5a887',   // atlas-gold
        'p-black':   '#1e1e1e',   // pantyr-black
        'p-tomato':  '#fd4c4c',   // tomato
        'p-bg':      '#f1f5f8',   // light-blue (page background)
        'p-royal':   '#13234c',   // atlas-royal-blue
        'p-grey':    '#7f7f7f',   // grey
        'p-dark':    '#303654',   // dark-slate-blue
        'p-light':   '#89d4c61a', // pantyr-light (very light green tint)
        'p-overlay': '#89d4c63d', // pantyr-overlay
        'p-navy-tl': '#346c9f4d', // mev-blue-translucent
      },
    },
  },
  plugins: [],
};

