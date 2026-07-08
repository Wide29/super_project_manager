import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AlgorithmGatewayService } from './algorithm-gateway.service';
import { AlgorithmsController } from './algorithms.controller';
import { AlgorithmsService } from './algorithms.service';

@Module({
  imports: [PrismaModule],
  controllers: [AlgorithmsController],
  providers: [AlgorithmsService, AlgorithmGatewayService],
  exports: [AlgorithmsService, AlgorithmGatewayService]
})
export class AlgorithmsModule {}
