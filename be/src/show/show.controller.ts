import {Controller, Param, Get, Post, Body, Patch, NotFoundException, Delete} from '@nestjs/common';
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

  @Get('shows')
  async getAllShows(): Promise<Show[]> {
    return this.showService.showsOrderedByActiveAndDate();
  }

  @Get('current-show')
  async getCurrentShow(): Promise<Show> {
    const shows: Show[] = await this.showService.shows({
      orderBy: { date: { sort: 'desc' } },
      where: { active: true },
    });
    if (shows.length > 0) {
      return shows.pop();
    } else {
      throw new NotFoundException('No current shows');
    }
  }

  @Get('current-shows')
  async getCurrentShows(): Promise<Show[]> {
    return this.showService.shows({
      orderBy: { date: { sort: 'desc' } },
      where: { active: true },
    });
  }
  @Get('old-shows')
  async getOldShows(): Promise<Show[]> {
    return this.showService.shows({
      orderBy: { date: { sort: 'desc' } },
      where: { active: false },
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

  @Delete(':id')
  async deleteShowById(@Param('id') id: string): Promise<any> {
    return this.showService.deleteShowWithRaces(id);
  }
}
