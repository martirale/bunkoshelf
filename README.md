# Bunko Shelf

Bunko Shelf is a free and self-hosted web app for organizing and reading manga and digital books. It is developed with Next.js and PostgreSQL. Bunko Shelf is designed to be fast, lightweight, and easy to use, with an intuitive interface and other useful features to enhance your reading experience.

## Install

Create a Bunko Shelf project with the installation wizard (The command will perform the installation in the directory where it is executed):

```bash
pnpm dlx @itsmrtr/bunkoshelf .
# or
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
pnpm bunko shelf
# or
npm run bunko -- shelf
```

By default, Bunko Shelf uses port `3060`.

To update Bunko Shelf later:

```bash
pnpm bunko update
# or
npm run bunko -- update
```

## Runtime

Minimum requirements:

- Node.js 22
- PostgreSQL 18

On startup Bunko Shelf:

- loads `.env` from the wrapper project
- runs SQL migrations against PostgreSQL
- boots the compiled Next.js standalone server

## License

Bunko Shelf is source-available under the PolyForm Noncommercial 1.0.0 license. Commercial use is not permitted. See [LICENSE](./LICENSE) for details.
