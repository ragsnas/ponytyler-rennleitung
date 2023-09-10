import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RaceModule } from './race/race.module';
import { ShowModule } from './show/show.module';
import { SongModule } from './song/song.module';

@Module({
  imports: [RaceModule, SongModule, ShowModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
