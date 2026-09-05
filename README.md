# Figma · Extractor de Interfaces

Herramienta para extraer **todos los frames de nivel superior** de un archivo de Figma como **PNG @2x**, revisarlos en una vista previa y descargarlos en un **ZIP con una carpeta general**.

Funciona 100 % en el navegador: tu token personal de Figma nunca sale de tu equipo.

## Web app (recomendado)

1. Activa GitHub Pages: **Settings → Pages → Source: Deploy from a branch → `main` / `root`**.
2. Abre `https://douglasvelezv.github.io/Figma-Extractor-Interfaces/`.
3. Pega tu **token personal de Figma**
   (Figma → Settings → Security → *Personal access tokens*, scope **File content: Read-only**).
4. Pega el **enlace del archivo** de Figma (`/design/`, `/file/` o `/proto/`).
5. **Cargar frames** → aparece la vista previa con miniaturas y nombres.
6. Ajusta el nombre de la carpeta y el criterio de nombres (original / numérico).
7. Marca/desmarca los que quieras y pulsa **Descargar ZIP**.

### Archivos de la Comunidad

La API de Figma solo lee archivos a los que tu cuenta tiene acceso.

1. Abre `figma.com/community/file/<clave>`.
2. Pulsa **Obtener una copia / Get a copy**.
3. En la pestaña nueva, la clave de la URL **cambia** (`figma.com/design/<CLAVE-NUEVA>/...`).
4. Usa esa URL nueva. Si la clave sigue siendo la misma que la de la Comunidad, la copia no se guardó.

Un 403 con la misma clave que la original = copia no realizada, no es problema del token.

### Nombres de archivo

- **Nombre original del frame** — `Home.png`, `Product Detail.png`… (se limpian caracteres inválidos; los duplicados llevan ` (2)`).
- **Número + nombre** — `0001_Home.png`, `0002_Product_Detail.png`…
- **Solo número** — `0001.png`, `0002.png`…

Opción de crear una subcarpeta por cada página de Figma dentro de la carpeta general.

## Script local (alternativa)

Si el CDN de Figma bloquea la descarga de imágenes por CORS en tu navegador:

```bash
FIGMA_TOKEN=figd_xxx node scripts/extract.mjs "<enlace-de-figma>" --scale 2 --name Interfaces
```

Requiere Node 18+. Genera `salida/Interfaces/` y, si tienes `zip` en el sistema, `salida/Interfaces.zip`.
Añade `--numeric` para nombrar los archivos `0001.png`, `0002.png`…

## Estructura

| Archivo | Qué hace |
|---|---|
| `index.html` / `style.css` / `app.js` | Web app estática |
| `scripts/extract.mjs` | Extractor por línea de comandos |
