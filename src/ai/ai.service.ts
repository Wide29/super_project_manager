import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException
} from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  private getClient() {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      throw new ServiceUnavailableException('DeepSeek API key is not configured');
    }

    return new OpenAI({
      apiKey,
      baseURL: process.env.DEEPSEEK_BASE_URL
    });
  }

  async chat(message: string, context?: string) {
    const response = await this.getClient().chat.completions.create({
      model: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是数据生产平台中的中文智能助手，请直接、专业、简洁地回答。'
        },
        {
          role: 'user',
          content: context ? `上下文：${context}\n\n问题：${message}` : message
        }
      ]
    });

    return { answer: response.choices[0]?.message?.content ?? '' };
  }

  async taskSuggestion(taskId: string, prompt?: string) {
    const task = await this.prisma.taskItem.findUnique({ where: { id: taskId } });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    const response = await this.getClient().chat.completions.create({
      model: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是标注任务建议助手，请输出中文建议。'
        },
        {
          role: 'user',
          content: `${prompt ?? '请基于题目内容生成作答建议。'}\n\n题目：${JSON.stringify(task)}`
        }
      ]
    });

    return { suggestion: response.choices[0]?.message?.content ?? '' };
  }
}
