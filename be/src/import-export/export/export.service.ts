import { Injectable } from '@nestjs/common';
import { ShowService } from 'src/prisma-api/show.service';

@Injectable()
export class ExportService {

      constructor(
    private readonly showService: ShowService
  ) {}

  allShowsWithRaces() {
    return this.showService.allShowsWithRaces();
  }
}
