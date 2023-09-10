import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { SongService } from '../prisma-api/song.service';
import { Prisma } from '@prisma/client';

@Controller('api/song')
export class SongController {
  constructor(private readonly songService: SongService) {}

  @Post()
  create(@Body() data: Prisma.SongCreateInput) {
    return this.songService.createSong(data);
  }

  @Get()
  findAll() {
    return this.songService.songs({ orderBy: { name: 'asc' } });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.songService.song({ id: Number(id) });
  }

  @Get('search/:text')
  search(@Param('text') text: string) {
    return this.songService.songs({
      where: {
        OR: [
          {
            name: { contains: text },
          },
          {
            artist: { contains: text },
          },
        ],
      },
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.SongUpdateInput) {
    return this.songService.updateSong({ where: { id: Number(id) }, data });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.songService.deleteSong({ id: Number(id) });
  }
}
