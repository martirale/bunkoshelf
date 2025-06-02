# BUILD INSTRUCTIONS

## Update Source

1. `git pull origin`
2. `cd front`

## Build Standard

1. `pnpm build`
2. `docker build -t bunkoshelf:0.0.0 .`

## Build w/Prisma Model Update

1. `pnpm dlx prisma generate`
2. `pnpm build`
3. `docker build --build-arg MIG=true -t bunkoshelf:0.0.0 .`
