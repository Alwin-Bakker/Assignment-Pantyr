import { a as o, j as e } from './jsx-runtime-CSChVUvx.js';
import { r as l } from './index-S5jQ8nhJ.js';
import { B as f } from './Button-Cpafe-Kx.js';
import './_commonjsHelpers-C4iS2aBk.js';
function s({
  open: r,
  onOpenChange: n,
  title: a,
  description: c,
  confirmLabel: C = 'Confirm',
  cancelLabel: b = 'Cancel',
  onConfirm: v,
}) {
  const d = l.useRef(null),
    u = l.useRef(null);
  return (
    l.useEffect(() => {
      function m(t) {
        t.key === 'Escape' && n(!1);
      }
      return (
        r &&
          ((u.current = document.activeElement),
          document.addEventListener('keydown', m),
          setTimeout(() => {
            var t;
            return (t = d.current) == null ? void 0 : t.focus();
          }, 0)),
        () => {
          var t;
          document.removeEventListener('keydown', m), (t = u.current) == null || t.focus();
        }
      );
    }, [r, n]),
    r
      ? o('div', {
          className: 'fixed inset-0 z-50 flex items-center justify-center',
          children: [
            e('div', { className: 'fixed inset-0 bg-black/40', onClick: () => n(!1) }),
            o('div', {
              role: 'alertdialog',
              'aria-modal': 'true',
              'aria-labelledby': 'alert-dialog-title',
              'aria-describedby': 'alert-dialog-description',
              ref: d,
              tabIndex: -1,
              className: 'z-50 bg-white rounded-md p-6 max-w-lg w-[90%] shadow-lg',
              children: [
                e('h3', {
                  id: 'alert-dialog-title',
                  className: 'text-lg font-medium',
                  children: a,
                }),
                c &&
                  e('div', {
                    id: 'alert-dialog-description',
                    className: 'mt-2 text-sm text-slate-600',
                    children: c,
                  }),
                o('div', {
                  className: 'mt-4 flex justify-end gap-2',
                  children: [
                    e(f, { variant: 'outline', onClick: () => n(!1), children: b }),
                    e(f, {
                      variant: 'primary',
                      onClick: async () => {
                        try {
                          await v();
                        } finally {
                          n(!1);
                        }
                      },
                      children: C,
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      : null
  );
}
try {
  (s.displayName = 'AlertDialog'),
    (s.__docgenInfo = {
      description: '',
      displayName: 'AlertDialog',
      props: {
        open: {
          defaultValue: null,
          description: '',
          name: 'open',
          required: !0,
          type: { name: 'boolean' },
        },
        onOpenChange: {
          defaultValue: null,
          description: '',
          name: 'onOpenChange',
          required: !0,
          type: { name: '(open: boolean) => void' },
        },
        title: {
          defaultValue: null,
          description: '',
          name: 'title',
          required: !0,
          type: { name: 'ReactNode' },
        },
        description: {
          defaultValue: null,
          description: '',
          name: 'description',
          required: !1,
          type: { name: 'ReactNode' },
        },
        confirmLabel: {
          defaultValue: { value: 'Confirm' },
          description: '',
          name: 'confirmLabel',
          required: !1,
          type: { name: 'string' },
        },
        cancelLabel: {
          defaultValue: { value: 'Cancel' },
          description: '',
          name: 'cancelLabel',
          required: !1,
          type: { name: 'string' },
        },
        onConfirm: {
          defaultValue: null,
          description: '',
          name: 'onConfirm',
          required: !0,
          type: { name: '() => void | Promise<void>' },
        },
      },
    });
} catch {}
const _ = { title: 'Components/AlertDialog', component: s },
  i = {
    render: () =>
      e(() => {
        const [n, a] = l.useState(!0);
        return o('div', {
          children: [
            e('button', { onClick: () => a(!0), children: 'Open' }),
            e(s, {
              open: n,
              onOpenChange: a,
              title: 'Confirm action',
              description: 'Are you sure you want to perform this action?',
              confirmLabel: 'Confirm',
              cancelLabel: 'Cancel',
              onConfirm: async () => {},
            }),
          ],
        });
      }, {}),
  };
var p, y, g;
i.parameters = {
  ...i.parameters,
  docs: {
    ...((p = i.parameters) == null ? void 0 : p.docs),
    source: {
      originalSource: `{
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(true);
      return <div>\r
          <button onClick={() => setOpen(true)}>Open</button>\r
          <AlertDialog open={open} onOpenChange={setOpen} title="Confirm action" description="Are you sure you want to perform this action?" confirmLabel="Confirm" cancelLabel="Cancel" onConfirm={async () => {
          // dummy confirm
        }} />\r
        </div>;
    };
    return <Demo />;
  }
}`,
      ...((g = (y = i.parameters) == null ? void 0 : y.docs) == null ? void 0 : g.source),
    },
  },
};
const k = ['OpenDialog'];
export { i as OpenDialog, k as __namedExportsOrder, _ as default };
