# 🎓 Frontend - Predictor de Riesgo Académico

Interfaz web moderna desarrollada con **Astro** para el sistema de predicción de riesgo académico.

## 🚀 Características

- ✅ Diseño moderno y responsive
- ✅ Interfaz intuitiva con sliders interactivos
- ✅ Gráficos de radar con Chart.js
- ✅ Resultados en tiempo real
- ✅ Análisis personalizado con Markdown
- ✅ Optimizado para producción

## 📋 Requisitos

- Node.js 18 o superior
- npm 9 o superior

## ⚡ Instalación Rápida

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/academic-risk-predictor-frontend.git
cd academic-risk-predictor-frontend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar la URL del Backend

Edita el archivo `src/pages/prediccion-academica/index.astro` y actualiza la URL del API:

```javascript
// Línea ~530
const response = await fetch('https://TU-BACKEND.onrender.com/predict', {
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

El sitio estará disponible en: **http://localhost:4321**

### 5. Build para producción

```bash
npm run build
```

Los archivos compilados estarán en la carpeta `dist/`

## 📁 Estructura del Proyecto

```
academic-risk-predictor-frontend/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── BaseHead.astro
│   │   ├── Header.astro
│   │   └── Footer.astro
│   ├── pages/              # Páginas del sitio
│   │   ├── index.astro     # Página principal
│   │   └── prediccion-academica/
│   │       └── index.astro # Página de predicción
│   ├── styles/
│   │   └── global.css      # Estilos globales
│   └── consts.ts           # Constantes del sitio
├── public/
│   └── favicon.png         # Favicon
├── astro.config.mjs        # Configuración de Astro
├── package.json            # Dependencias
├── tsconfig.json           # Configuración TypeScript
├── .gitignore
└── README.md
```

## 🌐 Despliegue

### Vercel (Recomendado - Gratis)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Crea una cuenta en [Vercel.com](https://vercel.com)
2. Conecta tu repositorio de GitHub
3. Vercel detectará automáticamente Astro
4. **IMPORTANTE**: Agrega la variable de entorno:
   - `PUBLIC_API_URL` = URL de tu backend desplegado

5. Deploy automático

### Netlify

1. Crea una cuenta en [Netlify.com](https://netlify.com)
2. Conecta tu repositorio
3. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Deploy

### Cloudflare Pages

1. Crea una cuenta en [Cloudflare](https://pages.cloudflare.com)
2. Conecta tu repositorio
3. Framework preset: **Astro**
4. Deploy

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# URL del Backend
PUBLIC_API_URL=https://tu-backend.onrender.com
```

### Actualizar URL del API

Si despliegas el backend, actualiza la URL en:

`src/pages/prediccion-academica/index.astro`

```javascript
// Busca esta línea y reemplaza con tu URL
const response = await fetch('https://TU-BACKEND.onrender.com/predict', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
});
```

## 🛠️ Tecnologías

- **Astro** 5.14+ - Framework web ultrarrápido
- **Tailwind CSS** - Estilos utility-first
- **Chart.js** 4.4+ - Gráficos interactivos
- **Marked** - Renderizado de Markdown
- **TypeScript** - Tipado estático

## 📱 Responsive Design

El sitio está optimizado para:
- 📱 Móviles (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large screens (1280px+)

## 🎨 Personalización

### Colores

Edita `src/styles/global.css`:

```css
:root {
    --accent: #29A842;      /* Color principal */
    --accent-light: #45c75e;
    --accent-dark: #1f8033;
}
```

### Título y Descripción

Edita `src/consts.ts`:

```typescript
export const SITE_TITLE = 'Tu Título';
export const SITE_DESCRIPTION = 'Tu descripción';
```

## 🧪 Comandos Disponibles

| Comando | Acción |
|---------|--------|
| `npm install` | Instalar dependencias |
| `npm run dev` | Servidor de desarrollo en `localhost:4321` |
| `npm run build` | Build para producción en `dist/` |
| `npm run preview` | Preview del build localmente |
| `npm run astro ...` | Ejecutar comandos CLI de Astro |

## 🚀 Performance

- ⚡ Score de Lighthouse: 95+
- 📦 Tamaño de bundle optimizado
- 🖼️ Imágenes optimizadas automáticamente
- 🔄 Carga de JavaScript minimalista

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/NuevaCaracteristica`)
3. Commit tus cambios (`git commit -m 'Agrega nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto.

## 🆘 Soporte

¿Problemas? Abre un **Issue** en GitHub.

---

**Desarrollado con ❤️ usando Astro y Tailwind CSS**

