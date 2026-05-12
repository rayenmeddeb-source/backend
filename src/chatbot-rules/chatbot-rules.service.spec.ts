import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotRulesService } from './chatbot-rules.service';

describe('ChatbotRulesService', () => {
  let service: ChatbotRulesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatbotRulesService],
    }).compile();

    service = module.get<ChatbotRulesService>(ChatbotRulesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
