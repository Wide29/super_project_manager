import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    const status =
      exception.code === 'P2025' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;

    response.status(status).json({
      statusCode: status,
      error: 'Database Error',
      code: exception.code,
      message: exception.message
    });
  }
}
