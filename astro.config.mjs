// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    site: "https://predictor-academico.vercel.app",  // Actualiza con tu dominio
    output: 'static',
    // Configuración de build
    build: {
        inlineStylesheets: 'auto',
    }
});