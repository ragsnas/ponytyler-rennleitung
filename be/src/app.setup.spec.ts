import { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { configureApp } from "./app.setup";

describe("configureApp", () => {
  let enableCors: jest.Mock;
  let enableShutdownHooks: jest.Mock;
  let app: INestApplication;

  const appWithPort = (port: string | undefined) => {
    const config = { get: jest.fn().mockReturnValue(port) };
    app = {
      enableCors,
      enableShutdownHooks,
      get: (token: unknown) => (token === ConfigService ? config : undefined),
    } as unknown as INestApplication;
    return app;
  };

  beforeEach(() => {
    enableCors = jest.fn();
    enableShutdownHooks = jest.fn();
  });

  it("enables shutdown hooks so OnModuleDestroy runs on SIGTERM", () => {
    configureApp(appWithPort(undefined));

    expect(enableShutdownHooks).toHaveBeenCalledTimes(1);
  });

  it("enables CORS for all origins", () => {
    configureApp(appWithPort(undefined));

    expect(enableCors).toHaveBeenCalledWith(
      expect.objectContaining({ origin: "*" }),
    );
  });

  it("defaults to port 3000", () => {
    expect(configureApp(appWithPort(undefined))).toBe(3000);
  });

  it("takes the port from the PORT config value", () => {
    expect(configureApp(appWithPort("4100"))).toBe(4100);
  });

  it("rejects an invalid PORT", () => {
    expect(() => configureApp(appWithPort("abc"))).toThrow(/PORT/);
  });
});
