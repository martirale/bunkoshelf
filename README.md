# Bunko Shelf

Self-hosted manga library distributed as a compiled npm package.

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
