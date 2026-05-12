import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotRulesController } from './chatbot-rules.controller';

describe('ChatbotRulesController', () => {
  let controller: ChatbotRulesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatbotRulesController],
    }).compile();

    controller = module.get<ChatbotRulesController>(ChatbotRulesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
