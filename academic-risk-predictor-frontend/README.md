# 🎓 Predictor de Riesgo Académico - Frontend

Sistema de predicción de riesgo académico con diseño moderno, múltiples gráficas y chatbot integrado.

## 🚀 Características

- **Diseño Moderno**: Interfaz profesional con Bootstrap 5
- **Múltiples Gráficas**: Velocímetro, gráficos de barras y radar
- **Chatbot Integrado**: Consejero académico virtual con IA
- **Detalles Matemáticos**: Modal con fórmulas y cálculos completos usando KaTeX
- **Responsive**: Adaptado a todos los dispositivos
- **Análisis en Tiempo Real**: Conexión directa con API de predicción

## 📦 Tecnologías

- **Astro** - Framework principal
- **Bootstrap 5** - Diseño y componentes
- **Chart.js** - Gráficas interactivas
- **KaTeX** - Renderizado de fórmulas matemáticas
- **TypeScript** - Tipado estático

## 🛠️ Instalación Local

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar en desarrollo
npm run dev

# 3. Abrir en el navegador
# http://localhost:4321
```

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── BaseHead.astro      # Meta tags y SEO
│   ├── Header.astro         # Navegación principal
│   └── Footer.astro         # Pie de página
├── pages/
│   ├── index.astro          # Página de inicio (landing)
│   └── prediccion-academica/
│       └── index.astro      # Página de predicción completa
├── styles/
│   └── global.css           # Estilos globales
└── consts.ts                # Constantes del sitio
```

## 🎨 Diseño

### Colores Principales
- **Primario**: `#667eea` (Púrpura)
- **Secundario**: `#764ba2` (Morado)
- **Éxito**: `#10b981` (Verde)
- **Advertencia**: `#f59e0b` (Naranja)
- **Peligro**: `#ef4444` (Rojo)

### Componentes
- **Hero Section**: Sección principal con gradiente
- **Feature Cards**: Tarjetas de características con hover
- **Stats Section**: Estadísticas destacadas
- **Process Steps**: Pasos numerados del proceso
- **Chatbot**: Chat flotante con IA
- **Modal Matemático**: Detalles técnicos de la predicción

## 📊 Gráficas Implementadas

1. **Velocímetro (Gauge)**: Muestra el porcentaje de riesgo
2. **Gráfico de Barras**: Compara datos del estudiante vs promedio
3. **Gráfico de Radar**: Perfil completo del estudiante

## 🤖 Chatbot

El chatbot está integrado y permite:
- Hacer preguntas sobre el rendimiento académico
- Obtener consejos personalizados
- Aclarar dudas sobre la predicción
- Solicitar recomendaciones específicas

## 🔗 Conexión con Backend

La aplicación se conecta a:
```
https://academic-risk-predictor-api.onrender.com
```

Endpoints utilizados:
- `POST /predict` - Realizar predicción
- `POST /chat` - Chatbot con IA
- `GET /health` - Estado del servidor

## 🚀 Despliegue en Vercel

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Desplegar
vercel --prod

# 3. El sitio estará disponible en tu dominio Vercel
```

### Variables de Entorno

No se requieren variables de entorno en el frontend, ya que la URL del backend está hardcodeada.

## 📱 Responsive Design

- **Desktop**: Diseño a dos columnas (formulario + resultados)
- **Tablet**: Diseño apilado con ajustes de espaciado
- **Mobile**: Interfaz optimizada para pantallas pequeñas

## 🎯 Páginas

### Inicio (`/`)
- Landing page sin jerga técnica
- Explica qué hace el sistema
- Call-to-actions claros
- Estadísticas destacadas
- Proceso paso a paso

### Predicción Académica (`/prediccion-academica`)
- Formulario con sliders interactivos
- 5 variables de entrada
- Resultados en tiempo real
- Múltiples gráficas
- Análisis con IA
- Chatbot integrado
- Modal matemático con fórmulas

## 🧪 Pruebas Locales

1. Verifica que el backend esté corriendo
2. Completa el formulario con datos de prueba
3. Verifica que aparezcan:
   - Porcentaje de riesgo
   - Velocímetro
   - Gráficas de barras y radar
   - Análisis con recomendaciones
4. Prueba el chatbot haciendo preguntas
5. Abre el modal matemático

## 📝 Notas

- El backend puede tardar 30-50 segundos en responder si está "dormido" (plan gratuito de Render)
- Las gráficas se actualizan automáticamente con cada predicción
- El chatbot requiere que hayas hecho al menos una predicción
- Los estilos son completamente personalizables en cada archivo `.astro`

## 🆘 Soporte

Si encuentras problemas:
1. Verifica que el backend esté activo: https://academic-risk-predictor-api.onrender.com/health
2. Revisa la consola del navegador para errores
3. Asegúrate de tener Node.js 18+ instalado
4. Limpia caché: `npm run clean` (si lo implementas)

## 📄 Licencia

Este proyecto fue desarrollado como sistema académico de predicción.
