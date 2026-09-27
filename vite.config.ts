import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
export default defineConfig(({ command, mode }) => {
  const siteOrigin = loadEnv(mode, process.cwd(), '').VITE_SITE_ORIGIN || 'https://melodee.vercel.app';
  return {
  plugins: [react(), { name: 'production-csp', transformIndexHtml(html, ctx) {
    if (command !== 'build') return [];
    const site = ctx.filename.endsWith('site.html');
    const connect = site ? "'self' https://api.github.com" : "'self'";
    const tags = [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob: videe:; connect-src ${connect}; font-src 'self'; object-src 'none'; base-uri 'self'; worker-src 'self'; manifest-src 'self'` }, injectTo: 'head' as const }];
    return site ? { html: html.replaceAll('https://melodee.vercel.app', siteOrigin), tags } : tags;
  } }],
  base: './',
  server: { port: 5173, strictPort: true },
  build: { rollupOptions: { input: { main: resolve('index.html'), site: resolve('site.html') } } }
};
});
