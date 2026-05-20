import { a as d, j as a } from './jsx-runtime-CSChVUvx.js';
import './index-S5jQ8nhJ.js';
import './_commonjsHelpers-C4iS2aBk.js';
function t({ title: r, description: o }) {
  return d('div', {
    className: 'p-3',
    children: [
      a('h3', { className: 'font-semibold', children: r }),
      a('p', { className: 'text-sm text-slate-600 mt-1', children: o }),
    ],
  });
}
try {
  (t.displayName = 'Feature'),
    (t.__docgenInfo = {
      description: '',
      displayName: 'Feature',
      props: {
        title: {
          defaultValue: null,
          description: '',
          name: 'title',
          required: !0,
          type: { name: 'string' },
        },
        description: {
          defaultValue: null,
          description: '',
          name: 'description',
          required: !0,
          type: { name: 'string' },
        },
      },
    });
} catch {}
const m = { title: 'Components/Feature', component: t },
  e = {
    args: {
      title: 'Clear voting',
      description: 'Estimates stay hidden until every participant has voted.',
    },
  };
var s, i, n;
e.parameters = {
  ...e.parameters,
  docs: {
    ...((s = e.parameters) == null ? void 0 : s.docs),
    source: {
      originalSource: `{
  args: {
    title: 'Clear voting',
    description: 'Estimates stay hidden until every participant has voted.'
  }
}`,
      ...((n = (i = e.parameters) == null ? void 0 : i.docs) == null ? void 0 : n.source),
    },
  },
};
const u = ['Default'];
export { e as Default, u as __namedExportsOrder, m as default };
