// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineNuxtConfig({
  app: {
    head: {
      titleTemplate: '%s | MoneyMind',
      title: 'Home',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
  compatibilityDate: 'latest',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', 'shadcn-nuxt', '@pinia/nuxt'],
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './app/components/ui',
  },
  css: ['@/app/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./', import.meta.url)),
        '@/app': fileURLToPath(new URL('./app', import.meta.url)),
        '@/lib': fileURLToPath(new URL('./lib', import.meta.url)),
        '@/utils': fileURLToPath(new URL('./utils', import.meta.url)),
      },
    },
  },
  devServer: {
    port: 3001,
  },
  ssr: false,
  runtimeConfig: {
    public: {
      serverURL: process.env.NUXT_PUBLIC_SERVER_URL,
    },
  },
});
