# Database Export

`GET /api/export/database` returns the entire application database as a
single JSON document, in a fixed, versioned format defined in
[`export.types.ts`](./export.types.ts).

## Usage

```bash
curl http://localhost:3000/api/export/database -o ponytyler-db-export.json
```

The response is sent with `Content-Disposition: attachment`, so opening the
URL directly in a browser downloads it as a file instead of just displaying
it.

## Format

```jsonc
{
  "formatVersion": 1,
  "exportedAt": "2026-09-13T18:46:27.073Z",
  "shows": [ /* Show rows, as in prisma/schema.prisma */ ],
  "shifts": [ /* Shift rows */ ],
  "shiftRoles": [ /* ShiftRole rows */ ],
  "songs": [ /* Song rows */ ],
  "races": [ /* Race rows */ ],
  "users": [ /* { "id": number, "name": string } — see note below */ ]
}
```

- `formatVersion` identifies the shape of this document. It is bumped
  whenever a field is added, renamed, or removed, so anything consuming the
  export (a script, the import endpoint, a support request) can tell which
  shape it's looking at.
- `exportedAt` is an ISO-8601 timestamp of when the export was generated.
- Every other top-level key is a flat array of rows for one table, in the
  same shape Prisma returns them (so foreign keys like `showId`, `song1Id`,
  `userId` are plain IDs, not nested objects — this is a row-level dump, not
  a nested/joined document).
- Rows within each array are ordered by `id` ascending.

### Why `users` is different

`User` rows carry a `password` field. Since this endpoint hands back a JSON
file that's meant to be downloaded and passed around (support requests,
backups, etc.), the export deliberately **excludes `password`** and only
includes `id` and `name` for users. This is enforced in
`ExportService.exportDatabase()` via an explicit Prisma `select`, not by
stripping the field after the fact.

## Where the code lives

- [`export.types.ts`](./export.types.ts) — the `DatabaseExport` shape and
  `DATABASE_EXPORT_FORMAT_VERSION`.
- [`export.service.ts`](./export.service.ts) — `ExportService.exportDatabase()`
  queries every table via Prisma and assembles the export object.
- [`export.controller.ts`](./export.controller.ts) — exposes it as
  `GET /api/export/database`.
- [`export.module.ts`](./export.module.ts) — wires it into `AppModule`, reusing
  `PrismaApiModule`'s `PrismaService`.

## Extending it

Adding a new table to the export:

1. Add it to the `Promise.all(...)` in `ExportService.exportDatabase()`.
2. Add the corresponding field (and Prisma model type) to `DatabaseExport` in
   `export.types.ts`.
3. Bump `DATABASE_EXPORT_FORMAT_VERSION`.
4. Update the format description above.

This endpoint only reads the database. To restore an export produced here,
see [`../import/README.md`](../import/README.md) (`POST /api/import/database`)
— note that importing **replaces the entire database**, not a merge.
`be/src/backup` is a separate, older file-based backup/restore flow
(predating the move to Postgres) and is not related to this JSON export.
