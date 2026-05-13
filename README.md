# Bunko Shelf

Bunko Shelf is a free and self-hosted web app for organizing and reading manga and digital books. It is developed with Next.js and PostgreSQL. Bunko Shelf is designed to be fast, lightweight, and easy to use, with an intuitive interface and other useful features to enhance your reading experience.

## Install

Create a Bunko Shelf project with the installation wizard (The command will perform the installation in the directory where it is executed):

```bash
npx @itsmrtr/bunkoshelf .
```

The wizard creates:

- a local `.env`
- a minimal `package.json`
- the dependency on the published `@itsmrtr/bunkoshelf` package

Then set your PostgreSQL connection string in `.env`:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/bunkoshelf
```

Start the app:

```bash
npm start
```

By default, Bunko Shelf uses port `3060`.

## Runtime

On startup Bunko Shelf:

- loads `.env` from the wrapper project
- runs SQL migrations against PostgreSQL
- boots the compiled Next.js standalone server

## Publish flow

This package is built for npm distribution:

- `pnpm build:release` generates `dist/`
- Next.js runs with `output: "standalone"`
- migrations are copied into the published artifact
- `.github/workflows/publish.yml` builds and publishes on GitHub release
