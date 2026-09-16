import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("AppController", () => {
  let controller: AppController;

  beforeEach(() => {
    controller = new AppController(new AppService());
  });

  describe("health", () => {
    it("reports ok", () => {
      expect(controller.health()).toEqual({ status: "ok" });
    });
  });
});
