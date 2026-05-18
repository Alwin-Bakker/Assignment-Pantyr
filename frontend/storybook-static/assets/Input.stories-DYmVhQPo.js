import{a as g,j as n}from"./jsx-runtime-CSChVUvx.js";import"./index-S5jQ8nhJ.js";import"./_commonjsHelpers-C4iS2aBk.js";function o({label:a,className:p="",multiline:x=!1,rows:f=4,...r}){const l=r.id;return g("div",{className:`flex flex-col space-y-1 ${p}`,children:[a&&n("label",{htmlFor:l,className:"text-sm text-slate-600",children:a}),x?n("textarea",{...r,rows:f,id:l,className:"rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"}):n("input",{...r,id:l,className:"h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"})]})}try{o.displayName="Input",o.__docgenInfo={description:"",displayName:"Input",props:{label:{defaultValue:null,description:"",name:"label",required:!1,type:{name:"string"}},multiline:{defaultValue:{value:"false"},description:"",name:"multiline",required:!1,type:{name:"boolean"}},rows:{defaultValue:{value:"4"},description:"",name:"rows",required:!1,type:{name:"number"}}}}}catch{}const _={title:"Components/Input",component:o},e={args:{id:"example-text",label:"Your name",placeholder:"e.g. Alex",value:""}},t={args:{id:"example-textarea",label:"Story context",multiline:!0,rows:4,value:"Some long context..."}};var s,c,u;e.parameters={...e.parameters,docs:{...(s=e.parameters)==null?void 0:s.docs,source:{originalSource:`{
  args: {
    id: 'example-text',
    label: 'Your name',
    placeholder: 'e.g. Alex',
    value: ''
  }
}`,...(u=(c=e.parameters)==null?void 0:c.docs)==null?void 0:u.source}}};var i,d,m;t.parameters={...t.parameters,docs:{...(i=t.parameters)==null?void 0:i.docs,source:{originalSource:`{
  args: {
    id: 'example-textarea',
    label: 'Story context',
    multiline: true,
    rows: 4,
    value: 'Some long context...'
  }
}`,...(m=(d=t.parameters)==null?void 0:d.docs)==null?void 0:m.source}}};const v=["TextInput","TextArea"];export{t as TextArea,e as TextInput,v as __namedExportsOrder,_ as default};
