import { NestFactory } from "@nestjs/core";
import { GenerateMockShowModule } from "./generate-mock-show.module";
import { GenerateMockShowCommand } from "./generate-mock-show.command";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(
    GenerateMockShowModule,
  );
  try {
    await app.get(GenerateMockShowCommand).run();
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
