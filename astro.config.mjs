// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
    site: "https://predictor-academico.vercel.app",  // Actualiza con tu dominio
    output: 'static',
    adapter: vercel(),
    // Configuración de build
    build: {
        inlineStylesheets: 'auto',
    },
    // Habilitar source maps para debugging
    vite: {
        build: {
            sourcemap: true,
        },
    },
});
