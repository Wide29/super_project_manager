import { Module } from '@nestjs/common';
import { TasksModule } from '../tasks/tasks.module';
import { SettlementsController } from './settlements.controller';
import { SettlementsService } from './settlements.service';

@Module({
  imports: [TasksModule],
  controllers: [SettlementsController],
  providers: [SettlementsService]
})
export class SettlementsModule {}
