import { AppService } from "./app.service";

describe("AppService", () => {
  let service: AppService;

  beforeEach(() => {
    service = new AppService();
  });

  describe("getHello", () => {
    it('returns "Hello World!"', () => {
      expect(service.getHello()).toBe("Hello World!");
    });
  });
});
