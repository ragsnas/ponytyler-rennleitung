import { Test, TestingModule } from '@nestjs/testing';
import { FilesearchController } from './filesearch.controller';

describe('FilesearchController', () => {
  let controller: FilesearchController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesearchController],
    }).compile();

    controller = module.get<FilesearchController>(FilesearchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
