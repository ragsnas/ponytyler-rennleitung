import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import {
  CreateEncoreSongInput,
  EncoreSongService,
} from "../prisma-api/encore-song.service";

@Controller("api/encore-song")
export class EncoreSongController {
  constructor(private readonly encoreSongService: EncoreSongService) {}

  @Post()
  create(@Body() data: CreateEncoreSongInput) {
    return this.encoreSongService.createEncoreSong(data);
  }

  @Get("for-show/:showId")
  findForShow(@Param("showId") showId: string) {
    return this.encoreSongService.encoreSongsForShow(Number(showId));
  }
}
