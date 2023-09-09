import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ShowController } from './show/show.controller';
import { ShowService } from './show/show.service';
import { PrismaService } from './prisma.service';
import { RaceModule } from './race/race.module';

@Module({
  imports: [RaceModule],
  controllers: [AppController, ShowController],
  providers: [AppService, ShowService, PrismaService],
})
export class AppModule {}
