import { BadRequestException } from "@nestjs/common";
import { Prisma, RaceState, ShowState } from "@prisma/client";

type FieldType = "int" | "string" | "boolean" | "date" | readonly string[];

interface Field {
  type: FieldType;
  /** May be left out (the column has a default). */
  optional?: boolean;
  /** May be `null`. */
  nullable?: boolean;
}

const INT32_MAX = 2147483647;
const MAX_REPORTED_ERRORS = 10;

const int = (extra: Partial<Field> = {}): Field => ({ type: "int", ...extra });
const string = (extra: Partial<Field> = {}): Field => ({
  type: "string",
  ...extra,
});
const boolean: Field = { type: "boolean", optional: true };
const date = (extra: Partial<Field> = {}): Field => ({
  type: "date",
  ...extra,
});

/** Mirrors prisma/schema.prisma; only these keys are ever imported. */
const SCHEMAS = {
  shows: {
    id: int(),
    name: string(),
    date: date({ optional: true, nullable: true }),
    actualStartTime: date({ optional: true, nullable: true }),
    duration: int({ optional: true, nullable: true }),
    finished: boolean,
    showState: { type: Object.values(ShowState), optional: true },
    active: boolean,
  },
  shifts: {
    id: int(),
    showId: int(),
    order: int(),
    duration: int({ optional: true, nullable: true }),
    shiftStarted: date({ optional: true, nullable: true }),
    shiftFinished: date({ optional: true, nullable: true }),
  },
  shiftRoles: {
    id: int(),
    shiftId: int(),
    roleTitle: string(),
    userId: int(),
  },
  songs: {
    id: int(),
    name: string(),
    artist: string(),
    selectable: boolean,
    deleted: boolean,
    origin: string({ optional: true }),
  },
  races: {
    id: int(),
    showId: int(),
    orderNumber: int(),
    createdAt: date({ optional: true }),
    raceStartedAt: date({ optional: true, nullable: true }),
    raceFinishedAt: date({ optional: true, nullable: true }),
    raced: boolean,
    raceState: { type: Object.values(RaceState), optional: true },
    person1: string({ optional: true, nullable: true }),
    song1Id: int({ optional: true, nullable: true }),
    person2: string({ optional: true, nullable: true }),
    song2Id: int({ optional: true, nullable: true }),
    bikeWon: int({ optional: true }),
  },
  users: {
    id: int(),
    name: string(),
  },
  encoreSongs: {
    id: int(),
    showId: int(),
    songId: int(),
    order: int(),
  },
} satisfies Record<string, Record<string, Field>>;

export interface ValidatedRows {
  shows: Prisma.ShowCreateManyInput[];
  shifts: Prisma.ShiftCreateManyInput[];
  shiftRoles: Prisma.ShiftRoleCreateManyInput[];
  songs: Prisma.SongCreateManyInput[];
  races: Prisma.RaceCreateManyInput[];
  users: Prisma.UserCreateManyInput[];
  encoreSongs: Prisma.EncoreSongCreateManyInput[];
}

type Row = Record<string, unknown>;
type TableName = keyof typeof SCHEMAS;

/**
 * Checks every row of an import file against the schema (types, enums,
 * ISO dates, unique keys and foreign keys between the tables) and returns
 * clean rows containing only known columns. Throws a 400 listing the first
 * problems, so a bad file is rejected before anything is deleted instead of
 * failing halfway as a database error.
 */
export function validateRows(raw: Record<string, unknown>): ValidatedRows {
  const errors: string[] = [];
  const result = {} as Record<TableName, Row[]>;

  for (const table of Object.keys(SCHEMAS) as TableName[]) {
    const input = raw[table] as unknown[];
    result[table] = input.map((row, index) =>
      validateRow(table, row, index, errors),
    );
  }

  if (errors.length === 0) {
    checkRelations(result, errors);
  }

  if (errors.length > 0) {
    const shown = errors.slice(0, MAX_REPORTED_ERRORS).join("; ");
    const more =
      errors.length > MAX_REPORTED_ERRORS
        ? ` (and ${errors.length - MAX_REPORTED_ERRORS} more)`
        : "";
    throw new BadRequestException(`Invalid import data: ${shown}${more}`);
  }

  return result as unknown as ValidatedRows;
}

function validateRow(
  table: TableName,
  row: unknown,
  index: number,
  errors: string[],
): Row {
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    errors.push(`${table}[${index}]: expected an object`);
    return {};
  }

  const clean: Row = {};
  const fields: Record<string, Field> = SCHEMAS[table];
  for (const [key, field] of Object.entries(fields)) {
    const value = (row as Row)[key];
    const where = `${table}[${index}].${key}`;

    if (value === undefined) {
      if (!field.optional) errors.push(`${where}: is required`);
      continue;
    }
    if (value === null) {
      if (field.nullable) clean[key] = null;
      else errors.push(`${where}: must not be null`);
      continue;
    }

    const problem = typeProblem(field.type, value);
    if (problem) {
      errors.push(`${where}: ${problem}`);
    } else {
      clean[key] = field.type === "date" ? new Date(value as string) : value;
    }
  }
  return clean;
}

function typeProblem(type: FieldType, value: unknown): string | undefined {
  if (Array.isArray(type)) {
    return type.includes(value as string)
      ? undefined
      : `expected one of ${type.join(", ")}`;
  }
  switch (type) {
    case "int":
      return Number.isInteger(value) && Math.abs(value as number) <= INT32_MAX
        ? undefined
        : "expected an integer";
    case "string":
      return typeof value === "string" ? undefined : "expected a string";
    case "boolean":
      return typeof value === "boolean" ? undefined : "expected a boolean";
    case "date":
      return typeof value === "string" && !Number.isNaN(Date.parse(value))
        ? undefined
        : "expected an ISO date string";
  }
}

function checkRelations(rows: Record<TableName, Row[]>, errors: string[]) {
  const ids = (table: TableName) =>
    new Set(rows[table].map((row) => row.id as number));
  const showIds = ids("shows");
  const shiftIds = ids("shifts");
  const songIds = ids("songs");
  const userIds = ids("users");

  for (const table of Object.keys(SCHEMAS) as TableName[]) {
    rejectDuplicates(table, rows[table], ["id"], errors);
  }
  rejectDuplicates("users", rows.users, ["name"], errors);
  rejectDuplicates("races", rows.races, ["showId", "orderNumber"], errors);
  rejectDuplicates(
    "encoreSongs",
    rows.encoreSongs,
    ["showId", "order"],
    errors,
  );

  const references = (
    table: TableName,
    key: string,
    known: Set<number>,
    target: string,
  ) =>
    rows[table].forEach((row, index) => {
      const value = row[key] as number | null | undefined;
      if (value != null && !known.has(value)) {
        errors.push(
          `${table}[${index}].${key}: references unknown ${target} ${value}`,
        );
      }
    });

  references("shifts", "showId", showIds, "show");
  references("shiftRoles", "shiftId", shiftIds, "shift");
  references("shiftRoles", "userId", userIds, "user");
  references("races", "showId", showIds, "show");
  references("races", "song1Id", songIds, "song");
  references("races", "song2Id", songIds, "song");
  references("encoreSongs", "showId", showIds, "show");
  references("encoreSongs", "songId", songIds, "song");
}

function rejectDuplicates(
  table: TableName,
  tableRows: Row[],
  keys: string[],
  errors: string[],
) {
  const seen = new Set<string>();
  tableRows.forEach((row, index) => {
    const key = JSON.stringify(keys.map((name) => row[name]));
    if (seen.has(key)) {
      errors.push(
        `${table}[${index}].${keys[keys.length - 1]}: duplicate ${keys.join("+")}`,
      );
    }
    seen.add(key);
  });
}
