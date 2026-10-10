import { BadRequestException } from "@nestjs/common";
import { validateRows } from "./import.validation";

function rows(overrides: Record<string, unknown[]> = {}) {
  return {
    shows: [{ id: 1, name: "Show", showState: "LISTED", active: false }],
    shifts: [{ id: 1, showId: 1, order: 0 }],
    users: [{ id: 1, name: "Alice" }],
    shiftRoles: [{ id: 1, shiftId: 1, userId: 1, roleTitle: "DJ" }],
    songs: [{ id: 1, name: "Song", artist: "Artist" }],
    races: [
      {
        id: 1,
        showId: 1,
        orderNumber: 0,
        raceState: "LISTED",
        song1Id: 1,
        song2Id: null,
        createdAt: "2026-10-09T20:00:00.000Z",
      },
    ],
    encoreSongs: [{ id: 1, showId: 1, songId: 1, order: 0 }],
    ...overrides,
  };
}

function message(raw: ReturnType<typeof rows>): string {
  try {
    validateRows(raw);
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    return (error as BadRequestException).message;
  }
  throw new Error("expected validateRows to throw");
}

describe("validateRows", () => {
  it("accepts a consistent export and converts date strings to Date objects", () => {
    const result = validateRows(rows());

    expect(result.races[0].createdAt).toEqual(
      new Date("2026-10-09T20:00:00.000Z"),
    );
    expect(result.races[0].song2Id).toBeNull();
    expect(result.encoreSongs).toHaveLength(1);
  });

  it("drops keys that are not columns of the table", () => {
    const result = validateRows(
      rows({ users: [{ id: 1, name: "Alice", password: "secret", x: 1 }] }),
    );

    expect(result.users).toEqual([{ id: 1, name: "Alice" }]);
  });

  it("rejects a row that is not an object", () => {
    expect(message(rows({ songs: ["nope"] }))).toContain("songs[0]");
  });

  it.each([
    ["a missing required field", { id: 1, artist: "A" }, "songs[0].name"],
    [
      "a wrongly typed field",
      { id: "1", name: "S", artist: "A" },
      "songs[0].id",
    ],
    ["a non-integer id", { id: 1.5, name: "S", artist: "A" }, "songs[0].id"],
    [
      "a wrongly typed boolean",
      { id: 1, name: "S", artist: "A", selectable: "yes" },
      "songs[0].selectable",
    ],
  ])("rejects %s", (_label, song, expected) => {
    expect(
      message(rows({ songs: [song], races: [], encoreSongs: [] })),
    ).toContain(expected);
  });

  it("rejects a null in a field that is not nullable", () => {
    expect(
      message(
        rows({
          songs: [{ id: 1, name: null, artist: "A" }],
          races: [],
          encoreSongs: [],
        }),
      ),
    ).toContain("songs[0].name");
  });

  it("rejects an unknown enum value", () => {
    const race = { id: 1, showId: 1, orderNumber: 0, raceState: "FLYING" };

    expect(message(rows({ races: [race] }))).toContain("races[0].raceState");
  });

  it("rejects an unparsable date", () => {
    const race = { id: 1, showId: 1, orderNumber: 0, createdAt: "yesterday" };

    expect(message(rows({ races: [race] }))).toContain("races[0].createdAt");
  });

  it("rejects duplicate ids", () => {
    const songs = [
      { id: 1, name: "A", artist: "X" },
      { id: 1, name: "B", artist: "X" },
    ];

    expect(message(rows({ songs, races: [], encoreSongs: [] }))).toContain(
      "songs[1].id",
    );
  });

  it("rejects two races with the same (showId, orderNumber)", () => {
    const races = [
      { id: 1, showId: 1, orderNumber: 0 },
      { id: 2, showId: 1, orderNumber: 0 },
    ];

    expect(message(rows({ races }))).toContain("races[1].orderNumber");
  });

  it("rejects duplicate user names", () => {
    const users = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Alice" },
    ];

    expect(message(rows({ users, shiftRoles: [] }))).toContain("users[1].name");
  });

  it.each([
    [
      "a race of an unknown show",
      "races",
      { id: 2, showId: 99, orderNumber: 5 },
      "races[1].showId",
    ],
    [
      "a race with an unknown song",
      "races",
      { id: 2, showId: 1, orderNumber: 5, song2Id: 99 },
      "races[1].song2Id",
    ],
    [
      "a shift of an unknown show",
      "shifts",
      { id: 2, showId: 99, order: 1 },
      "shifts[1].showId",
    ],
    [
      "a shift role of an unknown shift",
      "shiftRoles",
      { id: 2, shiftId: 99, userId: 1, roleTitle: "X" },
      "shiftRoles[1].shiftId",
    ],
    [
      "a shift role of an unknown user",
      "shiftRoles",
      { id: 2, shiftId: 1, userId: 99, roleTitle: "X" },
      "shiftRoles[1].userId",
    ],
    [
      "an encore song of an unknown song",
      "encoreSongs",
      { id: 2, showId: 1, songId: 99, order: 1 },
      "encoreSongs[1].songId",
    ],
    [
      "an encore song of an unknown show",
      "encoreSongs",
      { id: 2, showId: 99, songId: 1, order: 1 },
      "encoreSongs[1].showId",
    ],
  ])("rejects %s (dangling foreign key)", (_label, table, row, expected) => {
    const base = rows();
    const raw = {
      ...base,
      [table]: [...(base as Record<string, unknown[]>)[table], row],
    };

    expect(message(raw)).toContain(expected);
  });

  it("rejects two encore songs with the same (showId, order)", () => {
    const encoreSongs = [
      { id: 1, showId: 1, songId: 1, order: 0 },
      { id: 2, showId: 1, songId: 1, order: 0 },
    ];

    expect(message(rows({ encoreSongs }))).toContain("encoreSongs[1].order");
  });

  it("reports several problems at once but caps the list", () => {
    const songs = Array.from({ length: 30 }, (_, index) => ({ id: index }));

    const text = message(rows({ songs, races: [], encoreSongs: [] }));

    expect(text).toContain("songs[0].name");
    expect(text).toContain("more");
  });
});
