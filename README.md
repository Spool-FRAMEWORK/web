# Spool web

Public website of [Spool](https://github.com/Spool-FRAMEWORK): the landing page and the documentation. Built with [Starlight](https://starlight.astro.build) on Astro, with React for interactive components.

## Requirements

Node.js, in the version written in `.nvmrc`.

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

## Continuous integration

`.github/workflows/build.yml` installs the dependencies and runs `npm run build` on every push and pull request, so a broken page or an internal link to a page that does not exist fails the build.

## Deployment

`.github/workflows/deploy-pages.yml` publishes the site to GitHub Pages on every push to `develop`. It builds with the repository variables `SITE_URL` and `SITE_BASE_PATH`, so moving the site to another address only means changing those variables.

## Configuration

| Variable         | Purpose                                                   |
| :--------------- | :-------------------------------------------------------- |
| `SITE_URL`       | Public URL of the site. Required for the sitemap.         |
| `SITE_BASE_PATH` | Path the site is served under, when it is not the root. Internal links in Markdown are written from the root (`/getting-started/`) and get this prefix when the site is built. |
