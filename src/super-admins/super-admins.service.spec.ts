import { Test, TestingModule } from '@nestjs/testing';
import { SuperAdminsService } from './super-admins.service';

describe('SuperAdminsService', () => {
  let service: SuperAdminsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SuperAdminsService],
    }).compile();

    service = module.get<SuperAdminsService>(SuperAdminsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
