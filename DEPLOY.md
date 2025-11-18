# 🚀 Guía de Despliegue - Frontend

## Desplegar en Vercel (Recomendado - Gratis)

### Paso 1: Preparar el Repositorio en GitHub

1. Ve a [GitHub](https://github.com) y crea un nuevo repositorio:
   - Nombre: `academic-risk-predictor-frontend`
   - Visibilidad: Público
   - **NO** marques "Add README" ni ".gitignore" (ya los tienes)

2. En tu terminal, dentro de la carpeta `academic-risk-predictor-frontend`:

```bash
git init
git add .
git commit -m "Initial commit: Frontend con Astro"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/academic-risk-predictor-frontend.git
git push -u origin main
```

### Paso 2: Actualizar la URL del API

ANTES de desplegar, debes actualizar la URL del backend en el código.

Edita: `src/pages/prediccion-academica/index.astro`

Busca la línea ~530:
```javascript
const response = await fetch('http://localhost:8000/predict', {
```

Cámbiala por tu URL de Render:
```javascript
const response = await fetch('https://TU-API.onrender.com/predict', {
```

**Guarda el archivo y haz commit:**
```bash
git add .
git commit -m "Actualizar URL del backend para producción"
git push
```

### Paso 3: Desplegar en Vercel

1. Ve a [Vercel.com](https://vercel.com) y crea una cuenta (usa tu GitHub)

2. Click en "Add New..." → "Project"

3. Importa tu repositorio:
   - Busca `academic-risk-predictor-frontend`
   - Click en "Import"

4. Configuración del proyecto:
   - **Framework Preset**: Astro (detectado automáticamente)
   - **Build Command**: `npm run build` (automático)
   - **Output Directory**: `dist` (automático)
   - **Install Command**: `npm install` (automático)

5. **NO** necesitas variables de entorno por ahora

6. Click en "Deploy"

7. Espera 1-2 minutos mientras Vercel hace el build y despliegue

### Paso 4: Obtener tu URL

Una vez desplegado, Vercel te dará una URL como:
```
https://academic-risk-predictor-frontend.vercel.app
```

### Paso 5: Probar el Sitio

1. Abre la URL en tu navegador
2. Ve a la página de predicción
3. Ingresa datos y haz click en "Analizar"
4. Deberías ver tu predicción funcionando

---

## Alternativa: Desplegar en Netlify

### Paso 1: Subir a GitHub (mismo que arriba)

### Paso 2: Desplegar en Netlify

1. Ve a [Netlify.com](https://netlify.com) y crea una cuenta

2. Click en "Add new site" → "Import an existing project"

3. Conecta con GitHub y selecciona `academic-risk-predictor-frontend`

4. Configuración del build:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

5. Click en "Deploy site"

6. Una vez desplegado, obtendrás una URL como:
```
https://predictor-academico.netlify.app
```

---

## 🎨 Personalización Post-Despliegue

### Cambiar el Dominio

#### En Vercel:
1. Ve a tu proyecto → Settings → Domains
2. Agrega un dominio personalizado (gratis con Vercel)

#### En Netlify:
1. Ve a Site settings → Domain management
2. Agrega un dominio personalizado

### Optimización

Vercel y Netlify automáticamente:
- ✅ Minifican el código
- ✅ Optimizan imágenes
- ✅ Configuran HTTPS
- ✅ Configuran CDN global
- ✅ Habilitan cache

---

## 🔄 Actualizar el Sitio

### Método Automático (Recomendado)

Simplemente haz push a tu repositorio:

```bash
git add .
git commit -m "Actualización del frontend"
git push
```

Vercel/Netlify detectará el cambio y redesplegar automáticamente en ~1 minuto.

### Método Manual en Vercel

1. Ve a tu proyecto en Vercel
2. Click en "Deployments"
3. Click en "..." → "Redeploy"

---

## ⚙️ Variables de Entorno (Opcional)

Si quieres hacer la URL del API configurable:

### Paso 1: Crear archivo de configuración

Crea `src/config.ts`:
```typescript
export const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';
```

### Paso 2: Usar en el código

En `src/pages/prediccion-academica/index.astro`:
```javascript
import { API_URL } from '../../config';

// ...
const response = await fetch(`${API_URL}/predict`, {
```

### Paso 3: Configurar en Vercel

1. Ve a tu proyecto → Settings → Environment Variables
2. Agrega:
   - **Key**: `PUBLIC_API_URL`
   - **Value**: `https://tu-api.onrender.com`
3. Redeploy

---

## 🔧 Troubleshooting

### Error: "Failed to fetch"
- ✅ Verifica que la URL del backend sea correcta
- ✅ Verifica que el backend esté desplegado y funcionando
- ✅ Abre la consola del navegador (F12) para ver el error exacto

### Error: CORS
- ✅ Verifica que el backend tenga CORS configurado para `allow_origins=["*"]`
- ✅ Esto ya debería estar configurado en tu `main.py`

### El sitio se ve roto
- ✅ Verifica que los archivos en `src/` estén completos
- ✅ Revisa los logs de build en Vercel/Netlify

### El gráfico no aparece
- ✅ Verifica que Chart.js se esté cargando (CDN)
- ✅ Abre la consola del navegador para ver errores

---

## 📊 Analytics (Opcional)

### Vercel Analytics

1. Ve a tu proyecto → Analytics
2. Click en "Enable"
3. Gratis para 100k pageviews/mes

### Google Analytics

1. Agrega el script en `src/components/BaseHead.astro`
2. Antes del `</head>`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 🌍 URLs de Producción

Una vez desplegado, tendrás:

**Frontend**: `https://tu-frontend.vercel.app`  
**Backend**: `https://tu-backend.onrender.com`

Comparte estas URLs con cualquiera para que prueben tu sistema!

---

## 📱 Preview de Branches

Vercel automáticamente crea un preview para cada branch y PR:
- Branch `main` → Producción
- Otras branches → Preview URLs automáticos

---

**¡Listo!** Tu aplicación completa está en producción 🎉

**URLs finales**:
- Frontend: https://tu-frontend.vercel.app
- Backend API: https://tu-backend.onrender.com
- API Docs: https://tu-backend.onrender.com/docs

**¡Comparte tu proyecto!** 🚀

