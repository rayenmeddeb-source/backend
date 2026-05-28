import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ChatbotHistory } from './chatbot-history.entity';

@Injectable()
export class ChatbotHistoryService {
  constructor(
    @InjectRepository(ChatbotHistory)
    private readonly repo: Repository<ChatbotHistory>,
  ) {}

  create(data: Partial<ChatbotHistory>) {
    const history = this.repo.create(data);
    return this.repo.save(history);
  }

  findAll() {
    return this.repo.find({
      order: {
        created_at: 'DESC',
      },
    });
  }

  findByClient(client_id: number) {
    return this.repo.find({
      where: { client_id },
      order: {
        created_at: 'DESC',
      },
    });
  }
}