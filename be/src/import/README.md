# Database Import

`POST /api/import/database` restores the entire application database from a
JSON file previously produced by the export endpoint
(`GET /api/export/database`, see [`../export/README.md`](../export/README.md)).

## ⚠️ This replaces the entire database

Importing **deletes every row in every table this import touches** (`Show`,
`Shift`, `ShiftRole`, `Song`, `Race`, `EncoreSong`, `User`) and replaces them with the
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
  "formatVersion": 2,
  "importedAt": "2026-09-13T19:07:09.830Z",
  "imported": {
    "shows": 1,
    "shifts": 1,
    "shiftRoles": 1,
    "songs": 1,
    "races": 1,
    "users": 1,
    "encoreSongs": 1
  },
  "snapshot": "pre-import-2026-09-13T19-07-09-800Z.json"
}
```

`imported` is a count of the rows written per table, taken directly from the
arrays in the uploaded file. `snapshot` is the file name of the backup of the
previous database (see below).

### Snapshot of the previous database

Before anything is deleted, the current database is written as an export file
(`pre-import-<timestamp>.json`, no passwords) to the directory in the
`IMPORT_SNAPSHOT_DIR` environment variable, by default
`<os tmpdir>/ponytyler-import-snapshots`. The transaction protects against a
*failed* import; the snapshot protects against importing the *wrong* file –
re-import it to go back. If the snapshot cannot be written the import is
aborted. Set `IMPORT_SNAPSHOT_DIR` to a persistent volume in Docker, otherwise
the snapshots vanish with the container.

### Errors

The upload is validated before anything is deleted. A `400 Bad Request` with
an explanatory message is returned (and the database is left untouched) if:

- no file was sent (field name must be `file`),
- the file isn't valid JSON,
- `formatVersion` is not one this backend supports (`1` or `2`, see
  [`../export/export.types.ts`](../export/export.types.ts)); a version 1 file
  has no `encoreSongs` and is imported without them,
- one of the required arrays (`shows`, `shifts`, `shiftRoles`, `songs`,
  `races`, `users`, and `encoreSongs` from version 2) is missing,
- a row is invalid (`import.validation.ts`): wrong type, unknown enum value,
  unparsable date, duplicate id / unique key, or a foreign key pointing at a
  row that is not in the file. The message names the first problems, e.g.
  `races[3].showId: references unknown show 99`. Unknown columns are ignored.

A `formatVersion` mismatch means the file was produced by an export format
this backend doesn't understand (older or newer) — re-export from a matching
backend version rather than trying to force it through.

## What happens to `User.password`

The export never includes `password` (see the export docs). Passwords already
in the database are kept: an imported user whose `name` matches an existing
user gets that user's password back. Users that did not exist before are
created without a password.

## How it works

1. **Validate** the uploaded JSON: supported `formatVersion`, all arrays
   present, every row valid. Nothing touches the database until this passes.
2. **Snapshot** the current database to a file (see above).
3. **Delete** existing rows, children before parents, to satisfy foreign key
   constraints: `EncoreSong` → `ShiftRole` → `Race` → `Shift` → `Show`,
   `Song`, `User`.
4. **Recreate** rows from the file, parents before children, preserving
   their original `id`s so every foreign key in the file (`showId`,
   `song1Id`, `userId`, …) still points at the right row: `Show`, `Song`,
   `User` → `Shift` → `Race` → `ShiftRole` → `EncoreSong`.
5. **Reset the id sequence** for every table. Recreating rows with explicit
   `id`s bypasses Postgres's autoincrement counters, so without this step
   the next row created through the app (not via import) could collide with
   an id that already exists.

Steps 3–5 run inside one `prisma.$transaction(...)` with a 120 s timeout
(Prisma's default of 5 s is too short for a large import).

## Where the code lives

- [`import.service.ts`](./import.service.ts) — `ImportService.importDatabase()`:
  validation, the delete/recreate transaction, and the sequence reset.
- [`import.controller.ts`](./import.controller.ts) — exposes it as
  `POST /api/import/database`, reading the uploaded file as JSON.
- [`import.module.ts`](./import.module.ts) — wires it into `AppModule`, reusing
  `PrismaApiModule`'s `PrismaService`.
- [`import.validation.ts`](./import.validation.ts) — row-level validation.
- [`import-snapshot.service.ts`](./import-snapshot.service.ts) — the pre-import snapshot.
- [`import.types.ts`](./import.types.ts) — the `DatabaseImportSummary` response
  shape.

It reuses `DatabaseExport` / `DATABASE_EXPORT_FORMAT_VERSION` from
`../export/export.types.ts` rather than duplicating the format — the two
modules are meant to be updated together whenever the export format changes.
