import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { VitePWA } from 'vite-plugin-pwa'   // ← deshabilitado hasta instalar el paquete

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // VitePWA({
    //   strategies: 'injectManifest',
    //   srcDir: 'public',
    //   filename: 'sw.js',
    //   registerType: 'autoUpdate',
    //   injectRegister: 'auto',
    //   manifest: {
    //     name: 'Academic Risk',
    //     short_name: 'AcadRisk',
    //     description: 'Plataforma académica inteligente — predicción de riesgo y seguimiento de notas',
    //     theme_color: '#1A2B4A',
    //     background_color: '#f4f5f0',
    //     display: 'standalone',
    //     start_url: '/',
    //     scope: '/',
    //     lang: 'es',
    //     orientation: 'portrait-primary',
    //     icons: [
    //       { src: '/assets/ar-icon.png', sizes: '192x192', type: 'image/png' },
    //       { src: '/assets/ar-icon.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    //     ],
    //   },
    //   injectManifest: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    //   },
    //   devOptions: {
    //     enabled: true,
    //     type: 'module',
    //   },
    // }),
  ],
})
