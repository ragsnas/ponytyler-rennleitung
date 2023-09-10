import { Module } from '@nestjs/common';
import { RaceController } from './race.controller';
import { PrismaApiModule } from 'src/prisma-api/prisma-api.module';

@Module({
  imports: [PrismaApiModule],
  controllers: [RaceController],
})
export class RaceModule {}
