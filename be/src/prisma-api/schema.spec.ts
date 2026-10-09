import { readFileSync } from "fs";
import { join } from "path";

const schema = readFileSync(
  join(__dirname, "../../prisma/schema.prisma"),
  "utf8",
);

function bodyOf(model: string): string {
  const body = schema.match(
    new RegExp(`model ${model} \\{([\\s\\S]*?)\\n\\}`),
  )?.[1];
  if (body === undefined) {
    throw new Error(`model ${model} not found in schema.prisma`);
  }
  return body;
}

function fieldLine(model: string, field: string): string {
  const line = bodyOf(model)
    .split("\n")
    .find((candidate) => candidate.trim().startsWith(`${field} `));
  if (line === undefined) {
    throw new Error(`field ${model}.${field} not found in schema.prisma`);
  }
  return line;
}

function attributesOf(model: string, attribute: "index" | "unique") {
  return [
    ...bodyOf(model).matchAll(
      new RegExp(`@@${attribute}\\(\\[([^\\]]*)\\]`, "g"),
    ),
  ].map((match) => match[1].split(",").map((field) => field.trim()));
}

describe("schema.prisma", () => {
  describe("indexes", () => {
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
      expect(attributesOf(model, "index")).toContainEqual(fields);
    });
  });

  describe("unique constraints", () => {
    it.each([
      ["Race", ["showId", "orderNumber"]],
      ["EncoreSong", ["showId", "order"]],
    ])("%s is unique on %j", (model, fields) => {
      expect(attributesOf(model, "unique")).toContainEqual(fields);
    });
  });

  describe("race state", () => {
    it("is typed with the RaceState enum instead of a free String", () => {
      expect(fieldLine("Race", "raceState")).toMatch(
        /raceState\s+RaceState\s+@default\(LISTED\)/,
      );
    });
  });

  describe("referential actions", () => {
    it.each([
      ["Race", "show", "Cascade"],
      ["Race", "song1", "SetNull"],
      ["Race", "song2", "SetNull"],
      ["Shift", "show", "Cascade"],
      ["ShiftRole", "shift", "Cascade"],
      ["ShiftRole", "user", "Restrict"],
      ["EncoreSong", "show", "Cascade"],
      ["EncoreSong", "song", "Restrict"],
    ])("%s.%s uses onDelete: %s", (model, field, action) => {
      expect(fieldLine(model, field)).toContain(`onDelete: ${action}`);
    });
  });

  it("no longer carries the never-written ShiftRole.pastUserName", () => {
    expect(bodyOf("ShiftRole")).not.toContain("pastUserName");
  });
});
