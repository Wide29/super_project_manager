import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Dashboard API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns overview totals', async () => {
    const response = await request(app.getHttpServer()).get('/dashboard/overview').expect(200);

    expect(response.body).toHaveProperty('projectCount');
    expect(response.body).toHaveProperty('batchCount');
    expect(response.body).toHaveProperty('taskCount');
    expect(response.body).toHaveProperty('assignmentCount');
  });
});
