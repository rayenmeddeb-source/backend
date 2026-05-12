import { Test, TestingModule } from '@nestjs/testing';
import { PannesController } from './pannes.controller';

describe('PannesController', () => {
  let controller: PannesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PannesController],
    }).compile();

    controller = module.get<PannesController>(PannesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
