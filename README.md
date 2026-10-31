# NM Electroclima · web

Web pública y panel interno de NM Electroclima (Néstor Melián): electricidad, energía solar, climatización, refrigeración y maquinaria de hostelería en Andalucía.

Repositorio de origen: `melianeliezer05-a11y/Lancet-antigravity-web`. Rediseño completo el 2026-10-30.

## Stack

React 19 · React Router 7 · Vite 8 · Supabase (tablas `leads_clientes`, `proyectos`, `resenas`) con respaldo en `localStorage`. CSS propio (sin utilidades de Tailwind en la interfaz).

## Rutas

- `/` landing pública: portada con esquema unifilar animado, servicios, método, trabajos (desde Supabase), opiniones y aviso urgente.
- `/admin` panel interno: avisos en tiempo real, publicar o borrar trabajos y ver opiniones.

## Sistema visual «plano técnico»

- Papel hueso `#f2efe6`, azul tinta `#0f2740`, azul del logo `#2b7fb8`, naranja del rayo `#f0a12e` (texto naranja sobre papel: `#9a5400`).
- Tipografías: Archivo (títulos y texto) e IBM Plex Mono (etiquetas técnicas).
- Cada sección es una «hoja» numerada; las ilustraciones son SVG propios en `src/components/Illustrations.jsx`; la marca en `src/components/Mark.jsx`.
- Movimiento: dibujo del esquema, pulso de corriente y aparición al hacer scroll; todo se desactiva con `prefers-reduced-motion`.
- Estilos: `src/index.css` (web pública) y `src/pages/admin.css` (panel).

## Desarrollo

Requiere Node 20 o superior.

```bash
npm ci
npm run dev
npm run build
npm run lint
```

## Pendiente conocido

- La clave del panel `/admin` está en el código del cliente (`PanelAdmin.jsx`): cualquiera que abra el JS publicado puede leerla. Migrar a Supabase Auth con políticas RLS.
- La URL y la clave anónima de Supabase están escritas en `src/supabaseClient.js`; pasarlas a variables `VITE_*`.
- Faltan fotos reales de trabajos: subirlas desde `/admin`.
