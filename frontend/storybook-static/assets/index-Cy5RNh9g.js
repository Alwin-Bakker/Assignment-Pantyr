import { R as r } from './index-S5jQ8nhJ.js';
import './_commonjsHelpers-C4iS2aBk.js';
const o = r.createContext({});
function i(t) {
  const e = r.useContext(o);
  return r.useMemo(() => (typeof t == 'function' ? t(e) : { ...e, ...t }), [e, t]);
}
const f = {};
function l({ components: t, children: e, disableParentContext: u }) {
  let n;
  return (
    u ? (n = typeof t == 'function' ? t({}) : t || f) : (n = i(t)),
    r.createElement(o.Provider, { value: n }, e)
  );
}
export { o as MDXContext, l as MDXProvider, i as useMDXComponents };
