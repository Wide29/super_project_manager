import { Module } from '@nestjs/common';
import { AcceptancesController } from './acceptances.controller';
import { AcceptancesService } from './acceptances.service';

@Module({
  controllers: [AcceptancesController],
  providers: [AcceptancesService]
})
export class AcceptancesModule {}
