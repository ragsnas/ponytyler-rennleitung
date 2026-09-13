# Database Import

`POST /api/import/database` restores the entire application database from a
JSON file previously produced by the export endpoint
(`GET /api/export/database`, see [`../export/README.md`](../export/README.md)).

## ⚠️ This replaces the entire database

Importing **deletes every row in every table this import touches** (`Show`,
`Shift`, `ShiftRole`, `Song`, `Race`, `User`) and replaces them with the
contents of the uploaded file. There is no merge mode. Anything in the
database that isn't in the import file is gone afterwards.

The whole operation runs in a single database transaction: if anything
fails partway through (bad data, a database error), nothing is deleted or
written and the database is left exactly as it was before the request.

There is currently no confirmation step or authentication in front of this
endpoint — it relies on the backend not being exposed to untrusted callers,
the same way `POST /api/backup/upload` already does for the older file-based
backup. Anyone who can reach this route can wipe the database.

## Usage

```bash
curl -X POST http://localhost:3000/api/import/database \
  -F "file=@ponytyler-db-export.json;type=application/json"
```

The file is sent as `multipart/form-data` under the field name `file` — the
same shape as the existing `POST /api/backup/upload` endpoint.

### Response

```jsonc
{
  "formatVersion": 1,
  "importedAt": "2026-09-13T19:07:09.830Z",
  "imported": {
    "shows": 1,
    "shifts": 1,
    "shiftRoles": 1,
    "songs": 1,
    "races": 1,
    "users": 1
  }
}
```

`imported` is a count of the rows written per table, taken directly from the
arrays in the uploaded file.

### Errors

The upload is validated before anything is deleted. A `400 Bad Request` with
an explanatory message is returned (and the database is left untouched) if:

- no file was sent (field name must be `file`),
- the file isn't valid JSON,
- `formatVersion` in the file doesn't match the version this backend
  supports (see [`../export/export.types.ts`](../export/export.types.ts)),
- one of the required arrays (`shows`, `shifts`, `shiftRoles`, `songs`,
  `races`, `users`) is missing.

A `formatVersion` mismatch means the file was produced by an export format
this backend doesn't understand (older or newer) — re-export from a matching
backend version rather than trying to force it through.

## What happens to `User.password`

The export never includes `password` (see the export docs), so imported
users are created with no password set. After importing, anyone who needs to
log in as an imported user has to have their password set again.

## How it works

1. **Validate** the uploaded JSON: correct `formatVersion`, all six arrays
   present. Nothing touches the database until this passes.
2. **Delete** existing rows, children before parents, to satisfy foreign key
   constraints: `ShiftRole` → `Race` → `Shift` → `Show`, `Song`, `User`.
3. **Recreate** rows from the file, parents before children, preserving
   their original `id`s so every foreign key in the file (`showId`,
   `song1Id`, `userId`, …) still points at the right row: `Show`, `Song`,
   `User` → `Shift` → `Race` → `ShiftRole`.
4. **Reset the id sequence** for every table. Recreating rows with explicit
   `id`s bypasses Postgres's autoincrement counters, so without this step
   the next row created through the app (not via import) could collide with
   an id that already exists.

All of the above runs inside one `prisma.$transaction(...)`.

## Where the code lives

- [`import.service.ts`](./import.service.ts) — `ImportService.importDatabase()`:
  validation, the delete/recreate transaction, and the sequence reset.
- [`import.controller.ts`](./import.controller.ts) — exposes it as
  `POST /api/import/database`, reading the uploaded file as JSON.
- [`import.module.ts`](./import.module.ts) — wires it into `AppModule`, reusing
  `PrismaApiModule`'s `PrismaService`.
- [`import.types.ts`](./import.types.ts) — the `DatabaseImportSummary` response
  shape.

It reuses `DatabaseExport` / `DATABASE_EXPORT_FORMAT_VERSION` from
`../export/export.types.ts` rather than duplicating the format — the two
modules are meant to be updated together whenever the export format changes.
