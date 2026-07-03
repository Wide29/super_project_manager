import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBatchAcceptanceDto } from './dto/create-batch-acceptance.dto';

@Injectable()
export class AcceptancesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(deliveryId: string, dto: CreateBatchAcceptanceDto) {
    const delivery = await this.prisma.batchDelivery.findUnique({
      where: { id: deliveryId }
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ${deliveryId} not found`);
    }

    if (delivery.status !== 'submitted') {
      throw new BadRequestException('only submitted deliveries can be accepted');
    }

    const existingAcceptance = await this.prisma.batchAcceptance.findFirst({
      where: { deliveryId }
    });

    if (existingAcceptance) {
      throw new BadRequestException('a submitted delivery can only be accepted once');
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

    if (dto.decision === 'accepted' && rejectedTaskIds.size > 0) {
      throw new BadRequestException('accepted batches cannot include rejectedTaskIds');
    }

    if (dto.decision === 'partially_rejected') {
      if (rejectedTaskIds.size === 0) {
        throw new BadRequestException(
          'partially_rejected batches must include at least one rejected task'
        );
      }

      if (rejectedTaskIds.size === dto.sampledTaskIds.length) {
        throw new BadRequestException(
          'partially_rejected batches must keep at least one sampled task accepted'
        );
      }
    }

    if (dto.decision === 'rejected' && rejectedTaskIds.size !== dto.sampledTaskIds.length) {
      throw new BadRequestException('rejected batches must reject every sampled task');
    }

    const sampledTasks = await this.prisma.taskItem.findMany({
      where: {
        id: {
          in: dto.sampledTaskIds
        },
        batchId: delivery.batchId
      },
      select: {
        id: true
      }
    });

    if (sampledTasks.length !== dto.sampledTaskIds.length) {
      throw new BadRequestException('sampledTaskIds must all belong to the delivery batch');
    }

    const sampledTaskIds = sampledTasks.map((task) => task.id);

    const acceptance = await this.prisma.$transaction(async (tx) => {
      const createdAcceptance = await tx.batchAcceptance.create({
        data: {
          deliveryId,
          reviewedBy: dto.reviewedBy,
          decision: dto.decision,
          sampleSize: dto.sampleSize,
          notes: dto.notes
        }
      });

      for (const taskId of sampledTaskIds) {
        const decision = rejectedTaskIds.has(taskId) ? 'rejected' : 'passed';

        await tx.taskReview.create({
          data: {
            taskItemId: taskId,
            stage: 'algorithm_sampling',
            decision,
            reviewerId: dto.reviewedBy,
            notes: dto.notes,
            batchAcceptanceId: createdAcceptance.id
          }
        });

        await tx.taskItem.update({
          where: { id: taskId },
          data: {
            status: decision === 'passed' ? 'sampling_passed' : 'sampling_rejected'
          }
        });
      }

      await tx.batch.update({
        where: { id: delivery.batchId },
        data: {
          status: dto.decision
        }
      });

      return createdAcceptance;
    });

    return this.prisma.batchAcceptance.findUniqueOrThrow({
      where: { id: acceptance.id },
      include: {
        reviews: true
      }
    });
  }

  async findByBatch(batchId: string) {
    return this.prisma.batchAcceptance.findMany({
      where: {
        delivery: {
          batchId
        }
      },
      include: {
        reviews: true
      },
      orderBy: { reviewedAt: 'desc' }
    });
  }
}
