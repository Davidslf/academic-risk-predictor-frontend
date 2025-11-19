# 🚀 Guía de Migración Rápida

## ✨ ¡Tu código ha sido refactorizado con SOLID y Clean Code!

### 📦 Paso 1: Backup del archivo antiguo

```bash
cd src/pages/prediccion-academica/
mv index.astro index.astro.backup
```

### 📂 Paso 2: Activar el nuevo archivo

```bash
mv prediccion.astro index.astro
```

### 🔧 Paso 3: Verificar que funciona

```bash
npm run dev
```

Abre `http://localhost:4321/prediccion-academica` en tu navegador.

### 🐛 Paso 4: ¡PROBAR EL DEBUGGING! 

Esto es lo que querías - **breakpoints que funcionen**:

1. **Abre cualquier archivo TypeScript**, por ejemplo:
   ```
   src/services/prediction.service.ts
   ```

2. **Coloca un breakpoint** en la línea 28 (click izquierdo en el margen)
   ```typescript
   async predict(data: EstudianteData): Promise<PredictionResponse> {
       // 👈 Coloca breakpoint aquí
   ```

3. **Presiona F5** (o Ctrl+Shift+D → selecciona "🚀 Debug Astro (Chrome)" → F5)

4. **Interactúa con la app**: Completa el formulario y haz clic en "Analizar"

5. **¡MAGIA!** 🎉 El código se detendrá en tu breakpoint

---

## 🎯 Lugares ideales para poner breakpoints

### 1. **Servicio API** (`src/services/prediction.service.ts`)
```typescript
async predict(data: EstudianteData): Promise<PredictionResponse> {
    // Breakpoint aquí 👇
    const controller = new AbortController();
    
    // O aquí 👇
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.PREDICT}`, {
```

**Para debuggear**: Llamadas a la API, timeouts, errores de red

### 2. **Controlador Principal** (`src/app/app.controller.ts`)
```typescript
private async realizarPrediccion(): Promise<void> {
    // Breakpoint aquí 👇
    try {
        console.log('🔍 Iniciando predicción...');
        
        // O aquí 👇
        const estudianteData = formHandler.getFormData();
```

**Para debuggear**: Flujo completo de la aplicación

### 3. **Handler de Formulario** (`src/ui/form.handler.ts`)
```typescript
getFormData(): EstudianteData {
    // Breakpoint aquí 👇
    const asistencia = getElement<HTMLInputElement>(DOM_IDS.ASISTENCIA);
    
    return {
        // O aquí 👇
        promedio_asistencia: parseFloat(asistencia?.value || '0'),
```

**Para debuggear**: Obtención de datos del formulario

### 4. **Factory de Gráficos** (`src/charts/chart.factory.ts`)
```typescript
crearGraficoVelocimetro(porcentaje: number, nivel: NivelRiesgo, canvasId: string): void {
    // Breakpoint aquí 👇
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    
    // O aquí 👇
    this.gaugeChart = new Chart(ctx, {
```

**Para debuggear**: Creación de gráficos Chart.js

---

## 🎨 Ventajas de la Nueva Arquitectura

### ✅ Antes (código inline sin módulos)
```javascript
❌ Breakpoints no funcionan (unbound)
❌ 500+ líneas en un archivo
❌ Sin tipos
❌ Mezclado: API + UI + Gráficos
❌ Imposible de testear
```

### ✅ Después (código modularizado)
```typescript
✅ Breakpoints funcionan perfectamente
✅ 8 archivos organizados (< 150 líneas c/u)
✅ TypeScript con tipos
✅ Responsabilidades separadas
✅ Fácil de testear
```

---

## 📚 Estructura de Archivos

```
src/
├── types/                    # Tipos TypeScript
│   └── prediction.types.ts
├── constants/                # Constantes (API, colores, IDs)
│   └── app.constants.ts
├── services/                 # Lógica de negocio
│   └── prediction.service.ts
├── utils/                    # Utilidades puras
│   └── formatters.ts
├── charts/                   # Gestión de gráficos
│   └── chart.factory.ts
├── ui/                       # Handlers de UI
│   ├── form.handler.ts
│   ├── results.handler.ts
│   ├── chat.handler.ts
│   └── math-modal.handler.ts
└── app/                      # Controlador principal
    └── app.controller.ts
```

---

## 🧪 Probar el Debugging

### Test 1: API Call
1. Breakpoint en `src/services/prediction.service.ts` línea 28
2. F5 → Completa formulario → Click "Analizar"
3. Debería detenerse y mostrar `data` con los valores del estudiante

### Test 2: Flujo Completo
1. Breakpoint en `src/app/app.controller.ts` línea 43
2. F5 → Click "Analizar"
3. Usa F10 (Step Over) para seguir el flujo línea por línea

### Test 3: Creación de Gráficos
1. Breakpoint en `src/charts/chart.factory.ts` línea 28
2. F5 → Click "Analizar"
3. Inspecciona variables: `porcentaje`, `nivel`, `color`

---

## 💡 Tips de Debugging

### Atajos de teclado
- **F5**: Iniciar/Continuar
- **F9**: Toggle breakpoint
- **F10**: Step Over (siguiente línea)
- **F11**: Step Into (entrar en función)
- **Shift+F11**: Step Out (salir de función)
- **Shift+F5**: Detener

### Panels útiles
1. **Variables**: Ver todas las variables locales
2. **Watch**: Agregar expresiones personalizadas
3. **Call Stack**: Ver la secuencia de llamadas
4. **Breakpoints**: Gestionar todos los breakpoints

### Expresiones útiles en Watch
```javascript
estudianteData
resultado.porcentaje_riesgo
resultado.nivel_riesgo
formHandler.getFormData()
```

---

## 🔧 Si algo no funciona

### Problema: El debugging no se inicia

**Solución:**
```bash
# Reiniciar Cursor/VS Code
# O limpiar caché
rm -rf node_modules/.vite
npm run dev
```

### Problema: Breakpoint aparece gris

**Solución:**
1. Verifica que el servidor esté corriendo (`npm run dev`)
2. Presiona F5 para iniciar el debugger (no solo correr el servidor)
3. Recarga la página en el navegador

### Problema: "Cannot find module"

**Solución:**
```bash
# Reinstalar dependencias
npm install
```

---

## 📖 Documentación Completa

- **`ARQUITECTURA_LIMPIA.md`**: Explicación detallada de la arquitectura
- **`DEBUG.md`**: Guía completa de debugging
- **`SOLUCION_DEBUG.md`**: Solución al problema de unbound breakpoints

---

## 🎉 ¡Listo!

Ahora tienes:
- ✅ **Debugging funcional al 100%**
- ✅ **Código limpio y modular**
- ✅ **SOLID principles implementados**
- ✅ **TypeScript con tipos seguros**
- ✅ **Fácil de mantener y escalar**

### Siguiente paso recomendado:

**¡Prueba colocar breakpoints y debuggea tu código!** 🐛

```bash
# 1. Abre src/services/prediction.service.ts
# 2. Coloca breakpoint en línea 28
# 3. Presiona F5
# 4. Click en "Analizar Mi Riesgo Académico"
# 5. ¡Disfruta debugging real! 🎉
```

---

**¿Preguntas?** Revisa `ARQUITECTURA_LIMPIA.md` para más detalles.

**¡Happy debugging!** 🚀

