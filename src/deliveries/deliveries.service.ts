import { Injectable } from '@nestjs/common';
import { AlgorithmGatewayService } from '../algorithms/algorithm-gateway.service';
import { BatchesService } from '../batches/batches.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBatchDeliveryDto } from './dto/create-batch-delivery.dto';

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly batchesService: BatchesService,
    private readonly algorithmGatewayService: AlgorithmGatewayService
  ) {}

  async create(batchId: string, dto: CreateBatchDeliveryDto) {
    await this.batchesService.findOne(batchId);

    const delivery = await this.prisma.$transaction(async (tx) => {
      await tx.batchDelivery.updateMany({
        where: {
          batchId,
          status: 'submitted'
        },
        data: {
          status: 'superseded'
        }
      });

      const delivery = await tx.batchDelivery.create({
        data: {
          batchId,
          submittedBy: dto.submittedBy,
          notes: dto.notes
        }
      });

      await tx.batch.update({
        where: { id: batchId },
        data: { status: 'delivered' }
      });

      await tx.taskItem.updateMany({
        where: {
          batchId,
          status: {
            in: ['qa_passed', 'sampling_passed']
          }
        },
        data: {
          status: 'delivered'
        }
      });

      return delivery;
    });

    await this.algorithmGatewayService.createBatchSamplingPlan({
      batchId
    });

    return delivery;
  }

  async findByBatch(batchId: string) {
    await this.batchesService.findOne(batchId);

    return this.prisma.batchDelivery.findMany({
      where: { batchId },
      orderBy: { submittedAt: 'desc' }
    });
  }
}
