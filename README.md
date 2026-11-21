# Spool web

Public website of [Spool](https://github.com/Spool-FRAMEWORK): the landing page and the documentation. Built with [Starlight](https://starlight.astro.build) on Astro, with React for interactive components.

## Requirements

Node.js 22 or later.

## Commands

| Command           | Action                                                        |
| :---------------- | :------------------------------------------------------------ |
| `npm install`     | Installs dependencies                                         |
| `npm run dev`     | Starts the local server at `localhost:4321`                   |
| `npm run build`   | Builds the site into `dist/`, indexes search and checks links |
| `npm run preview` | Serves the built site locally                                 |

## Structure

- `src/content/docs/`: one folder per documentation section. Each Markdown or MDX file is a page, and the sidebar is generated from these folders (`astro.config.mjs`).
- `src/content/docs/index.mdx`: the landing page.
- `src/components/`: Astro and React components used by the pages.
- `public/`: static files served as they are.

## Configuration

| Variable         | Purpose                                                   |
| :--------------- | :-------------------------------------------------------- |
| `SITE_URL`       | Public URL of the site. Required for the sitemap.         |
| `SITE_BASE_PATH` | Path the site is served under, when it is not the root.   |
