import type { Config } from 'tailwindcss';
export default { content:['./src/**/*.{ts,tsx}'], theme:{ extend:{ colors:{ brand:'#1d6fe8', teal:'#0f766e', surface:'#f7f8fa', line:'#e5e7eb' }, borderRadius:{ card:'14px' }, boxShadow:{ soft:'0 1px 6px rgba(0,0,0,.06)' } } } } satisfies Config;
