import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { TaskSuggestionDto } from './dto/task-suggestion.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  chat(@Body() dto: ChatRequestDto) {
    return this.aiService.chat(dto.message, dto.context);
  }

  @Post('task-suggestion')
  taskSuggestion(@Body() dto: TaskSuggestionDto) {
    return this.aiService.taskSuggestion(dto.taskId, dto.prompt);
  }
}
