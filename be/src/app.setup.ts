import { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const DEFAULT_HTTP_PORT = 3000;

/** Applies the global app configuration and returns the port to listen on. */
export function configureApp(app: INestApplication): number {
  app.enableShutdownHooks();
  app.enableCors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  const configuredPort = app.get(ConfigService).get<string>("PORT");
  if (configuredPort === undefined) {
    return DEFAULT_HTTP_PORT;
  }
  const port = Number(configuredPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT "${configuredPort}"`);
  }
  return port;
}
