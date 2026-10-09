import { AppController } from "./app.controller";

describe("AppController", () => {
  let controller: AppController;

  beforeEach(() => {
    controller = new AppController();
  });

  describe("health", () => {
    it("reports ok", () => {
      expect(controller.health()).toEqual({ status: "ok" });
    });
  });
});
