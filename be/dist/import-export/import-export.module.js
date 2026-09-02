"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportExportModule = void 0;
const common_1 = require("@nestjs/common");
const export_controller_1 = require("./export/export.controller");
const import_controller_1 = require("./import/import.controller");
const import_service_1 = require("./import/import.service");
const export_service_1 = require("./export/export.service");
const prisma_api_module_1 = require("../prisma-api/prisma-api.module");
let ImportExportModule = class ImportExportModule {
};
exports.ImportExportModule = ImportExportModule;
exports.ImportExportModule = ImportExportModule = __decorate([
    (0, common_1.Module)({
        controllers: [export_controller_1.ExportController, import_controller_1.ImportController],
        providers: [import_service_1.ImportService, export_service_1.ExportService],
        imports: [prisma_api_module_1.PrismaApiModule]
    })
], ImportExportModule);
//# sourceMappingURL=import-export.module.js.map