import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Projects API', () => {
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

  it('creates and retrieves a project', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/projects')
      .send({
        name: 'Video Review Dataset',
        description: 'MVP project',
        taskType: 'video'
      })
      .expect(201);

    expect(createResponse.body.name).toBe('Video Review Dataset');

    const projectId = createResponse.body.id;

    const getResponse = await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .expect(200);

    expect(getResponse.body.id).toBe(projectId);
    expect(getResponse.body.taskType).toBe('video');
  });
});
