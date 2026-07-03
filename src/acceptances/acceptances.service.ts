import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewsService } from '../reviews/reviews.service';
import { CreateBatchAcceptanceDto } from './dto/create-batch-acceptance.dto';

@Injectable()
export class AcceptancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewsService: ReviewsService
  ) {}

  async create(deliveryId: string, dto: CreateBatchAcceptanceDto) {
    const delivery = await this.prisma.batchDelivery.findUnique({
      where: { id: deliveryId }
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ${deliveryId} not found`);
    }

    if (dto.sampleSize !== dto.sampledTaskIds.length) {
      throw new BadRequestException('sampleSize must match sampledTaskIds length');
    }

    const rejectedTaskIds = new Set(
      dto.decision === 'rejected'
        ? dto.rejectedTaskIds?.length
          ? dto.rejectedTaskIds
          : dto.sampledTaskIds
        : (dto.rejectedTaskIds ?? [])
    );

    const invalidRejectedTaskId = [...rejectedTaskIds].find(
      (taskId) => !dto.sampledTaskIds.includes(taskId)
    );

    if (invalidRejectedTaskId) {
      throw new BadRequestException('rejectedTaskIds must be included in sampledTaskIds');
    }

    const acceptance = await this.prisma.batchAcceptance.create({
      data: {
        deliveryId,
        reviewedBy: dto.reviewedBy,
        decision: dto.decision,
        sampleSize: dto.sampleSize,
        notes: dto.notes
      }
    });

    for (const taskId of dto.sampledTaskIds) {
      await this.reviewsService.create(taskId, {
        stage: 'algorithm_sampling',
        decision: rejectedTaskIds.has(taskId) ? 'rejected' : 'passed',
        reviewerId: dto.reviewedBy,
        notes: dto.notes,
        batchAcceptanceId: acceptance.id
      });
    }

    await this.prisma.batch.update({
      where: { id: delivery.batchId },
      data: {
        status: dto.decision
      }
    });

    return this.prisma.batchAcceptance.findUniqueOrThrow({
      where: { id: acceptance.id },
      include: {
        reviews: true
      }
    });
  }
}
