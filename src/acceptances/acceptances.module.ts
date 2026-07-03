import { Module } from '@nestjs/common';
import { ReviewsModule } from '../reviews/reviews.module';
import { AcceptancesController } from './acceptances.controller';
import { AcceptancesService } from './acceptances.service';

@Module({
  imports: [ReviewsModule],
  controllers: [AcceptancesController],
  providers: [AcceptancesService]
})
export class AcceptancesModule {}
