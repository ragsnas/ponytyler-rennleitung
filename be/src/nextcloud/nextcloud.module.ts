import {Module} from '@nestjs/common';
import {FilesearchController} from "./filesearch/filesearch.controller";
import { ConfigModule } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";

@Module({
    imports: [ConfigModule, HttpModule],
    controllers: [FilesearchController]
})
export class NextcloudModule {
}
