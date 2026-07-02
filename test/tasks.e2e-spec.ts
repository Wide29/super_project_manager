import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Tasks API', () => {
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

  it('creates and lists tasks under a batch', async () => {
    const project = await request(app.getHttpServer())
      .post('/projects')
      .send({
        name: 'Task Parent',
        taskType: 'image'
      })
      .expect(201);

    const batch = await request(app.getHttpServer())
      .post(`/projects/${project.body.id}/batches`)
      .send({ name: 'Batch T' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/batches/${batch.body.id}/tasks`)
      .send({
        title: 'Check image quality',
        inputPayload: { imageUrl: 'https://example.com/a.png' },
        priority: 5
      })
      .expect(201);

    const listResponse = await request(app.getHttpServer())
      .get(`/batches/${batch.body.id}/tasks`)
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].title).toBe('Check image quality');
  });
});
