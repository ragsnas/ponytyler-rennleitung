## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

### e2e tests

`test/rest-api-lifecycle.e2e-spec.ts` drives the REST API end-to-end (show →
races → song → manipulate → export → delete → import) against a real
Postgres via Prisma. Its last step calls `POST /api/import/database`, which
**wipes every Show, Shift, ShiftRole, Song, Race and User row** and recreates
them from the uploaded export — that's how the real endpoint behaves, not a
test artifact. Only ever run `test:e2e` against a disposable database, never
one holding real show data — e.g. the Postgres started by
`docker-compose.e2e.yml` at the repo root:

```bash
docker compose -f ../docker-compose.e2e.yml up -d postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ponytyler npx prisma db push
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ponytyler npm run test:e2e
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
