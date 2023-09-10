import { Controller, Param, Get, Post, Body, Patch } from '@nestjs/common';
import { ShowService } from '../prisma-api/show.service';
import { Show, Prisma } from '@prisma/client';

@Controller('api/show')
export class ShowController {
  constructor(private readonly showService: ShowService) {}

  @Get('')
  async getShows(): Promise<Show[]> {
    return this.showService.shows({
      orderBy: { date: { sort: 'desc' } },
    });
  }

  @Get('current-shows')
  async getCurrentShows(): Promise<Show[]> {
    const nowMinus5Hours = new Date();
    nowMinus5Hours.setHours(nowMinus5Hours.getHours() - 5);
    const nowPlus5Hours = new Date();
    nowPlus5Hours.setHours(nowPlus5Hours.getHours() + 5);
    return this.showService.shows({
      orderBy: { date: { sort: 'desc' } },
      where: { date: { gte: nowMinus5Hours, lte: nowPlus5Hours } },
    });
  }

  @Get('old-shows')
  async getOldShows(): Promise<Show[]> {
    const nowMinus5Hours = new Date();
    nowMinus5Hours.setHours(nowMinus5Hours.getHours() - 5);
    return this.showService.shows({
      orderBy: { date: { sort: 'desc' } },
      where: { date: { lte: nowMinus5Hours } },
    });
  }

  @Get(':id')
  async getPostById(@Param('id') id: string): Promise<Show> {
    return this.showService.show({ id: Number(id) });
  }

  @Post('')
  async createShow(@Body() showData: Prisma.ShowCreateInput): Promise<Show> {
    return this.showService.createShow({
      ...showData,
      date: showData.date || new Date(),
    });
  }

  @Patch(':id')
  async updateShow(
    @Param('id') id: string,
    @Body() showData: Prisma.ShowUpdateInput,
  ): Promise<Show> {
    return this.showService.updateShow({
      data: showData,
      where: { id: Number(id) },
    });
  }
}
