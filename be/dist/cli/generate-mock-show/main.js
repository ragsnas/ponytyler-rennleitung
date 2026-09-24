"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const generate_mock_show_module_1 = require("./generate-mock-show.module");
const generate_mock_show_command_1 = require("./generate-mock-show.command");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(generate_mock_show_module_1.GenerateMockShowModule);
    try {
        await app.get(generate_mock_show_command_1.GenerateMockShowCommand).run();
    }
    finally {
        await app.close();
    }
}
bootstrap().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
//# sourceMappingURL=main.js.map