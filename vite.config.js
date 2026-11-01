import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

// <!-- @include header {"page":"home"} --> → partials/header.html, with {{page}} vars and active-link helpers
function partials() {
  const render = (html) => html.replace(/<!--\s*@include\s+([\w-]+)\s*(\{.*?\})?\s*-->/g, (_, name, json) => {
    const vars = json ? JSON.parse(json) : {};
    let out = readFileSync(resolve(__dirname, `partials/${name}.html`), 'utf8');
    out = out.replace(/\{\{active:(\w+)\}\}/g, (_, p) => (vars.page === p ? 'is-active" aria-current="page' : ''));
    out = out.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
    return render(out);
  });
  return { name: 'naturik-partials', transformIndexHtml: { order: 'pre', handler: render }, handleHotUpdate({ file, server }) { if (file.includes('/partials/')) server.ws.send({ type: 'full-reload' }); } };
}

export default defineConfig({
  base: './',
  plugins: [partials()],
  build: {
    target: 'es2020',
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        shop: resolve(__dirname, 'shop.html'),
        contact: resolve(__dirname, 'contact.html'),
      },
    },
    chunkSizeWarningLimit: 900,
  },
});
