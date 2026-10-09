import { readFileSync } from "fs";
import { join } from "path";

const schema = readFileSync(
  join(__dirname, "../../prisma/schema.prisma"),
  "utf8",
);

function indexesOf(model: string): string[][] {
  const body = schema.match(
    new RegExp(`model ${model} \\{([\\s\\S]*?)\\n\\}`),
  )?.[1];
  if (body === undefined) {
    throw new Error(`model ${model} not found in schema.prisma`);
  }
  return [...body.matchAll(/@@index\(\[([^\]]*)\]/g)].map((match) =>
    match[1].split(",").map((field) => field.trim()),
  );
}

describe("schema.prisma indexes", () => {
  it.each([
    ["Race", ["showId", "raceState", "orderNumber"]],
    ["Race", ["song1Id"]],
    ["Race", ["song2Id"]],
    ["Shift", ["showId"]],
    ["ShiftRole", ["shiftId"]],
    ["ShiftRole", ["userId"]],
    ["EncoreSong", ["showId"]],
    ["EncoreSong", ["songId"]],
    ["Show", ["active"]],
  ])("indexes %s(%j)", (model, fields) => {
    expect(indexesOf(model)).toContainEqual(fields);
  });
});
