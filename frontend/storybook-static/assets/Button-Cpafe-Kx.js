import { j as c } from './jsx-runtime-CSChVUvx.js';
function o({ children: a, variant: r = 'primary', ...s }) {
  const t = 'px-4 py-2 rounded-md font-medium inline-flex items-center gap-2 justify-center';
  let e = '';
  r === 'primary'
    ? (e = `${t} bg-sky-600 text-white hover:bg-sky-700`)
    : r === 'secondary'
    ? (e = `${t} bg-sky-50 text-sky-700 border border-transparent hover:bg-sky-100`)
    : r === 'danger'
    ? (e = `${t} bg-[#fd4c4c] text-white hover:bg-red-600`)
    : r === 'outline'
    ? (e = `${t} bg-transparent border border-slate-200 text-slate-700 hover:bg-slate-50`)
    : (e = `${t} bg-transparent border border-slate-200 text-slate-700 hover:bg-slate-50`);
  const n = s.disabled ? ' opacity-50 cursor-not-allowed pointer-events-none' : '',
    { className: l, ...i } = s,
    d = [e + n, l].filter(Boolean).join(' ');
  return c('button', { className: d, ...i, children: a });
}
try {
  (o.displayName = 'Button'),
    (o.__docgenInfo = {
      description: '',
      displayName: 'Button',
      props: {
        variant: {
          defaultValue: { value: 'primary' },
          description: '',
          name: 'variant',
          required: !1,
          type: {
            name: 'enum',
            value: [
              { value: '"primary"' },
              { value: '"secondary"' },
              { value: '"outline"' },
              { value: '"ghost"' },
              { value: '"danger"' },
            ],
          },
        },
      },
    });
} catch {}
export { o as B };
