"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
Object.defineProperty(BigInt.prototype, "toJSON", {
    get() {
        "use strict";
        return () => String(this);
    }
});
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: "*",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        preflightContinue: false,
        optionsSuccessStatus: 204,
    });
    await app.listen(3000);
}
bootstrap();
//# sourceMappingURL=main.js.map