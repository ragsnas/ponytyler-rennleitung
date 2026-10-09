import { generatePersonName, generateShowTitle } from "./random-name.util";

describe("random-name.util", () => {
  let randomSpy: jest.SpyInstance;

  afterEach(() => {
    randomSpy?.mockRestore();
  });

  describe("generateShowTitle", () => {
    it("returns a '<Venue>, <City>' formatted string", () => {
      expect(generateShowTitle()).toMatch(/^.+, .+$/);
    });

    it("picks words at the given random index deterministically", () => {
      randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);

      const first = generateShowTitle();
      randomSpy.mockReturnValue(0);
      const second = generateShowTitle();

      expect(first).toBe(second);
    });

    it("varies across calls", () => {
      const titles = new Set(Array.from({ length: 30 }, generateShowTitle));

      expect(titles.size).toBeGreaterThan(1);
    });
  });

  describe("generatePersonName", () => {
    it("returns a non-empty first name", () => {
      expect(generatePersonName().length).toBeGreaterThan(0);
    });

    it("varies across calls", () => {
      const names = new Set(Array.from({ length: 30 }, generatePersonName));

      expect(names.size).toBeGreaterThan(1);
    });
  });
});
