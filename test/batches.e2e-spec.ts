import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Batches API', () => {
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

  it('creates and lists batches under a project', async () => {
    const project = await request(app.getHttpServer())
      .post('/projects')
      .send({
        name: 'Batch Parent',
        taskType: 'text'
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/projects/${project.body.id}/batches`)
      .send({
        name: 'Batch A',
        plannedTaskCount: 20
      })
      .expect(201);

    const listResponse = await request(app.getHttpServer())
      .get(`/projects/${project.body.id}/batches`)
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].name).toBe('Batch A');
  });
});
