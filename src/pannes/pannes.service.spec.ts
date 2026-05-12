import { Test, TestingModule } from '@nestjs/testing';
import { PannesService } from './pannes.service';

describe('PannesService', () => {
  let service: PannesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PannesService],
    }).compile();

    service = module.get<PannesService>(PannesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
