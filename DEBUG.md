# 🐛 Guía de Debugging

## Configuración de Debug para Academic Risk Predictor

Este proyecto ahora incluye configuración completa de debugging para VS Code/Cursor.

## 📋 Requisitos Previos

1. **Extensiones recomendadas** (se instalarán automáticamente):
   - Astro Language Support
   - Prettier
   - ESLint

2. **Node.js** instalado (v18 o superior)

## 🚀 Cómo Usar el Debugging

### Opción 1: Debug en Chrome (Recomendado)
1. Ve a la pestaña "Run and Debug" (Ctrl/Cmd + Shift + D)
2. Selecciona **"🚀 Debug Astro (Chrome)"**
3. Presiona F5 o haz clic en el botón verde "Start Debugging"
4. El servidor se iniciará automáticamente y se abrirá Chrome
5. Coloca breakpoints en tu código `.astro` o `.js`

### Opción 2: Debug en Edge
1. Selecciona **"🔍 Debug Astro (Edge)"**
2. Presiona F5
3. Similar a Chrome pero usa Microsoft Edge

### Opción 3: Debug del Servidor Node
1. Selecciona **"🐛 Debug Servidor Astro"**
2. Presiona F5
3. Útil para debugging de la parte del servidor de Astro

### Opción 4: Attach a un Proceso Node
1. Primero inicia el servidor manualmente con:
   ```bash
   npm run dev -- --inspect
   ```
2. Selecciona **"🔗 Attach to Node Process"**
3. Presiona F5

## 🎯 Uso de Breakpoints

### En archivos .astro
Coloca breakpoints en:
- **Frontmatter** (entre `---`): Para debugging del lado del servidor
- **Scripts inline**: Para debugging del lado del cliente

### En JavaScript
Coloca breakpoints directamente en las líneas de código que quieres inspeccionar.

### Ejemplo práctico:

```astro
---
// 👈 Coloca un breakpoint aquí para debug del servidor
const data = await fetch('https://api.example.com/data');
const json = await data.json();
---

<script>
  // 👈 Coloca un breakpoint aquí para debug del cliente
  document.getElementById('button').addEventListener('click', () => {
    console.log('clicked');
  });
</script>
```

## 🔧 Debugging del Código Actual

Para debuggear `prediccion-academica/index.astro`:

1. Abre el archivo
2. Coloca breakpoints en las funciones JavaScript:
   - `realizarPrediccion()`
   - `mostrarResultados()`
   - `crearGraficoVelocimetro()`
   - etc.
3. Inicia el debug con F5
4. Interactúa con la aplicación en el navegador
5. La ejecución se detendrá en tus breakpoints

## 📊 Debugging de la API

Si necesitas debuggear las llamadas a la API:

1. Coloca breakpoints antes y después de los `fetch`:

```javascript
// Breakpoint aquí 👇
const response = await fetch(`${API_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});
// Breakpoint aquí 👇
const result = await response.json();
```

2. Inspecciona:
   - Variables locales
   - Call stack
   - Network requests
   - Console output

## 💡 Tips

- **F5**: Iniciar/Continuar debugging
- **F10**: Step over (siguiente línea)
- **F11**: Step into (entrar en función)
- **Shift+F11**: Step out (salir de función)
- **Ctrl/Cmd+Shift+F5**: Reiniciar debugging
- **Shift+F5**: Detener debugging

## ⚠️ Troubleshooting

### El debugger no se conecta
- Asegúrate de que no hay otro proceso usando el puerto 4321
- Cierra otras instancias del servidor dev
- Reinicia VS Code/Cursor

### Los breakpoints aparecen grises
- Verifica que los source maps estén habilitados
- Recarga la página en el navegador
- Reinicia el debugging

### No puedo debuggear el código inline
- El debugging de scripts inline en `.astro` puede ser limitado
- Considera mover la lógica compleja a archivos `.js` o `.ts` separados

## 📚 Recursos Adicionales

- [Astro Debugging Guide](https://docs.astro.build/en/guides/debugging/)
- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

---

¡Happy Debugging! 🎉

