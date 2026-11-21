# AGENTS.md: Spool web

Proyecto de Linear: [Spool (P-DEV-1)](https://linear.app/javier-castilla/project/spool-3fb294a151f0)

Web pública de Spool: landing y documentación, con Starlight (Astro) y React para los componentes interactivos. Cómo se compila y qué hay en cada carpeta, en el README.

- La rama base es `develop`, como en el resto de Spool.
- La web está en inglés.
- Lo que cuenta una página se comprueba en el código de los módulos antes de escribirlo: el README del DSL y Notion no valen como fuente.
- `npm run build` es la comprobación: compila, indexa el buscador y falla si hay enlaces internos rotos.
- El servidor de desarrollo se arranca con `npx astro dev --background` y se para con `npx astro dev stop` al terminar.
