# Backend MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable NestJS backend with Prisma and PostgreSQL that supports CRUD flows for projects, batches, tasks, and task assignments.

**Architecture:** This implementation uses a modular NestJS monolith with one domain module per core resource and a shared Prisma module for persistence. Prisma owns the relational schema and migrations, while Nest controllers expose scoped CRUD endpoints validated through DTOs and surfaced through Swagger.

**Tech Stack:** Node.js, NestJS, Prisma, PostgreSQL, Swagger, class-validator, class-transformer, Jest, Supertest

## Global Constraints

- Runtime: Node.js
- Framework: NestJS
- ORM: Prisma
- Database: PostgreSQL
- API documentation: Swagger
- Validation: class-validator + class-transformer
- Keep controllers thin
- Keep database access inside service boundaries
- Keep resource ownership checks explicit
- Keep state values enumerated and centralized
- Prefer DTO-based validation at the boundary
- Avoid embedding future QC or agent behavior into the first schema beyond reserved fields
- Out of scope: Authentication and authorization
- Out of scope: Full user, role, and organization model
- Out of scope: QC workflow
- Out of scope: Algorithm acceptance workflow
- Out of scope: Agent orchestration runtime
- Out of scope: Queue-based async jobs
- Out of scope: Complex workflow engine
- Out of scope: Frontend application

---

## File Structure

### Files to create

- `package.json`
- `tsconfig.json`
- `tsconfig.build.json`
- `nest-cli.json`
- `.env.example`
- `.eslintrc.js`
- `.prettierrc`
- `src/main.ts`
- `src/app.module.ts`
- `src/common/filters/prisma-exception.filter.ts`
- `src/prisma/prisma.module.ts`
- `src/prisma/prisma.service.ts`
- `src/projects/projects.module.ts`
- `src/projects/projects.controller.ts`
- `src/projects/projects.service.ts`
- `src/projects/dto/create-project.dto.ts`
- `src/projects/dto/update-project.dto.ts`
- `src/batches/batches.module.ts`
- `src/batches/batches.controller.ts`
- `src/batches/batches.service.ts`
- `src/batches/dto/create-batch.dto.ts`
- `src/batches/dto/update-batch.dto.ts`
- `src/tasks/tasks.module.ts`
- `src/tasks/tasks.controller.ts`
- `src/tasks/tasks.service.ts`
- `src/tasks/dto/create-task.dto.ts`
- `src/tasks/dto/update-task.dto.ts`
- `src/assignments/assignments.module.ts`
- `src/assignments/assignments.controller.ts`
- `src/assignments/assignments.service.ts`
- `src/assignments/dto/create-assignment.dto.ts`
- `prisma/schema.prisma`
- `test/projects.e2e-spec.ts`
- `test/batches.e2e-spec.ts`
- `test/tasks.e2e-spec.ts`
- `test/assignments.e2e-spec.ts`
- `test/jest-e2e.json`

### Files likely to change later but not needed in this cut

- `README.md`

### Responsibilities

- `src/main.ts`: bootstrap app, validation pipe, Swagger
- `src/app.module.ts`: root composition
- `src/common/filters/prisma-exception.filter.ts`: translate Prisma errors to HTTP responses
- `src/prisma/*`: Prisma lifecycle and DI integration
- `src/projects/*`: project resource API and persistence
- `src/batches/*`: batch resource API and project-scoped creation/list
- `src/tasks/*`: task resource API and batch-scoped creation/list
- `src/assignments/*`: assignment resource API and task-scoped creation/list
- `prisma/schema.prisma`: database schema, enums, relations
- `test/*.e2e-spec.ts`: integration coverage for the core chain

### Interface map

- `PrismaService` exposes:
  - `project`
  - `batch`
  - `taskItem`
  - `taskAssignment`
  - inherited Prisma client lifecycle methods
- `ProjectsService` exposes:
  - `create(data: CreateProjectDto): Promise<Project>`
  - `findAll(): Promise<Project[]>`
  - `findOne(id: string): Promise<Project>`
  - `update(id: string, data: UpdateProjectDto): Promise<Project>`
- `BatchesService` exposes:
  - `create(projectId: string, data: CreateBatchDto): Promise<Batch>`
  - `findByProject(projectId: string): Promise<Batch[]>`
  - `findOne(id: string): Promise<Batch>`
  - `update(id: string, data: UpdateBatchDto): Promise<Batch>`
- `TasksService` exposes:
  - `create(batchId: string, data: CreateTaskDto): Promise<TaskItem>`
  - `findByBatch(batchId: string): Promise<TaskItem[]>`
  - `findOne(id: string): Promise<TaskItem>`
  - `update(id: string, data: UpdateTaskDto): Promise<TaskItem>`
- `AssignmentsService` exposes:
  - `create(taskId: string, data: CreateAssignmentDto): Promise<TaskAssignment>`
  - `findByTask(taskId: string): Promise<TaskAssignment[]>`

### Enums to define in Prisma

- `ProjectStatus = draft | active | archived`
- `BatchStatus = draft | in_progress | ready_for_delivery | closed`
- `TaskItemStatus = pending_allocation | pending_pickup | in_progress | submitted | returned`
- `TaskAssignmentStatus = assigned | accepted | completed | rejected`

## Task 1: Scaffold the NestJS backend application

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.build.json`
- Create: `nest-cli.json`
- Create: `.env.example`
- Create: `.eslintrc.js`
- Create: `.prettierrc`
- Create: `src/main.ts`
- Create: `src/app.module.ts`
- Test: `npm run start:dev`

**Interfaces:**
- Consumes: none
- Produces:
  - `AppModule`
  - bootstrap with `ValidationPipe`
  - Swagger at `/api`

- [ ] **Step 1: Write the failing startup expectation**

```ts
// Target behavior for bootstrap
// GET /api should serve Swagger UI once the app starts.
```

- [ ] **Step 2: Verify the repo has no runnable backend yet**

Run: `find src package.json prisma -maxdepth 2 -type f`
Expected: output shows files missing or directories absent

- [ ] **Step 3: Create the Node/Nest scaffold files**

```json
// package.json
{
  "name": "super_project_manager_backend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,test}/**/*.ts\"",
    "format": "prettier --write \"{src,test,prisma}/**/*.{ts,js,json,md}\"",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/config": "^4.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@nestjs/swagger": "^11.0.0",
    "@prisma/client": "^6.10.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "swagger-ui-express": "^5.0.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@types/express": "^5.0.0",
    "@types/jest": "^29.5.14",
    "@types/node": "^22.10.2",
    "@types/supertest": "^6.0.2",
    "eslint": "^9.17.0",
    "jest": "^29.7.0",
    "prettier": "^3.4.2",
    "prisma": "^6.10.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-loader": "^9.5.1",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.7.2",
    "typescript-eslint": "^8.18.0"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

```ts
// src/app.module.ts
import { Module } from '@nestjs/common';

@Module({})
export class AppModule {}
```

```ts
// src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Super Project Manager Backend')
    .setDescription('Backend MVP for the agent-powered data production platform')
    .setVersion('0.1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
```

- [ ] **Step 4: Add the configuration files**

```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

```json
// tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

```json
// nest-cli.json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src"
}
```

```js
// .eslintrc.js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: ['plugin:@typescript-eslint/recommended'],
  env: {
    node: true,
    jest: true,
  },
};
```

```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true
}
```

```env
# .env.example
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/super_project_manager?schema=public"
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`
Expected: installs NestJS, Prisma, Swagger, validation, and test dependencies

- [ ] **Step 6: Run the app to verify bootstrap works**

Run: `npm run start:dev`
Expected: Nest app starts without module resolution errors and exposes Swagger on `http://localhost:3000/api`

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json tsconfig.build.json nest-cli.json .env.example .eslintrc.js .prettierrc src/main.ts src/app.module.ts
git commit -m "chore: scaffold nest backend application"
```

## Task 2: Add Prisma and PostgreSQL persistence

**Files:**
- Modify: `package.json`
- Create: `prisma/schema.prisma`
- Create: `src/prisma/prisma.module.ts`
- Create: `src/prisma/prisma.service.ts`
- Modify: `src/app.module.ts`
- Test: `npx prisma validate`

**Interfaces:**
- Consumes:
  - `AppModule`
- Produces:
  - `PrismaModule`
  - `PrismaService`
  - Prisma schema with four models and enums

- [ ] **Step 1: Write the schema expectation**

```prisma
// Required models and relations:
// Project 1-N Batch
// Batch 1-N TaskItem
// TaskItem 1-N TaskAssignment
```

- [ ] **Step 2: Verify Prisma is not configured yet**

Run: `test -f prisma/schema.prisma && echo exists || echo missing`
Expected: `missing`

- [ ] **Step 3: Create the Prisma schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum ProjectStatus {
  draft
  active
  archived
}

enum BatchStatus {
  draft
  in_progress
  ready_for_delivery
  closed
}

enum TaskItemStatus {
  pending_allocation
  pending_pickup
  in_progress
  submitted
  returned
}

enum TaskAssignmentStatus {
  assigned
  accepted
  completed
  rejected
}

model Project {
  id                 String        @id @default(cuid())
  name               String
  description        String?
  status             ProjectStatus @default(draft)
  taskType           String
  sopDocument        String?
  acceptanceCriteria String?
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt
  batches            Batch[]
}

model Batch {
  id               String      @id @default(cuid())
  projectId        String
  name             String
  status           BatchStatus @default(draft)
  plannedTaskCount Int?
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  project          Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks            TaskItem[]

  @@index([projectId])
}

model TaskItem {
  id            String         @id @default(cuid())
  batchId       String
  externalRef   String?
  title         String
  inputPayload  Json
  status        TaskItemStatus @default(pending_allocation)
  priority      Int            @default(0)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  batch         Batch          @relation(fields: [batchId], references: [id], onDelete: Cascade)
  assignments   TaskAssignment[]

  @@index([batchId])
}

model TaskAssignment {
  id          String               @id @default(cuid())
  taskItemId  String
  operatorId  String?
  assigneeId  String
  status      TaskAssignmentStatus @default(assigned)
  assignedAt  DateTime             @default(now())
  completedAt DateTime?
  notes       String?
  taskItem    TaskItem             @relation(fields: [taskItemId], references: [id], onDelete: Cascade)

  @@index([taskItemId])
}
```

- [ ] **Step 4: Create the Prisma module and service**

```ts
// src/prisma/prisma.service.ts
import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
```

```ts
// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

```ts
// src/app.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
})
export class AppModule {}
```

- [ ] **Step 5: Generate the Prisma client**

Run: `npx prisma generate`
Expected: Prisma client generated successfully

- [ ] **Step 6: Validate the Prisma schema**

Run: `npx prisma validate`
Expected: `The schema at prisma/schema.prisma is valid`

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma src/prisma src/app.module.ts package.json package-lock.json
git commit -m "feat: add prisma persistence foundation"
```

## Task 3: Implement the projects module

**Files:**
- Modify: `src/app.module.ts`
- Create: `src/projects/projects.module.ts`
- Create: `src/projects/projects.controller.ts`
- Create: `src/projects/projects.service.ts`
- Create: `src/projects/dto/create-project.dto.ts`
- Create: `src/projects/dto/update-project.dto.ts`
- Test: `test/projects.e2e-spec.ts`

**Interfaces:**
- Consumes:
  - `PrismaService`
- Produces:
  - `ProjectsService.create(data: CreateProjectDto): Promise<Project>`
  - `ProjectsService.findAll(): Promise<Project[]>`
  - `ProjectsService.findOne(id: string): Promise<Project>`
  - `ProjectsService.update(id: string, data: UpdateProjectDto): Promise<Project>`

- [ ] **Step 1: Write the failing project e2e test**

```ts
// test/projects.e2e-spec.ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Projects API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
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
        taskType: 'video',
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
```

- [ ] **Step 2: Run the project test to verify it fails**

Run: `npm run test:e2e -- test/projects.e2e-spec.ts`
Expected: FAIL because `/projects` routes are not registered

- [ ] **Step 3: Add project DTOs**

```ts
// src/projects/dto/create-project.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ProjectStatusDto {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ProjectStatusDto, required: false })
  @IsOptional()
  @IsEnum(ProjectStatusDto)
  status?: ProjectStatusDto;

  @ApiProperty()
  @IsString()
  taskType!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sopDocument?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  acceptanceCriteria?: string;
}
```

```ts
// src/projects/dto/update-project.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
```

- [ ] **Step 4: Add the project service and controller**

```ts
// src/projects/projects.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateProjectDto) {
    return this.prisma.project.create({ data });
  }

  findAll() {
    return this.prisma.project.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    return project;
  }

  async update(id: string, data: UpdateProjectDto) {
    await this.findOne(id);
    return this.prisma.project.update({
      where: { id },
      data,
    });
  }
}
```

```ts
// src/projects/projects.controller.ts
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }
}
```

```ts
// src/projects/projects.module.ts
import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
```

```ts
// src/app.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [PrismaModule, ProjectsModule],
})
export class AppModule {}
```

- [ ] **Step 5: Run the project test to verify it passes**

Run: `npm run test:e2e -- test/projects.e2e-spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/projects src/app.module.ts test/projects.e2e-spec.ts
git commit -m "feat: implement project crud endpoints"
```

## Task 4: Implement the batches module

**Files:**
- Modify: `src/app.module.ts`
- Create: `src/batches/batches.module.ts`
- Create: `src/batches/batches.controller.ts`
- Create: `src/batches/batches.service.ts`
- Create: `src/batches/dto/create-batch.dto.ts`
- Create: `src/batches/dto/update-batch.dto.ts`
- Test: `test/batches.e2e-spec.ts`

**Interfaces:**
- Consumes:
  - `PrismaService`
  - `ProjectsService.findOne(id: string): Promise<Project>`
- Produces:
  - `BatchesService.create(projectId: string, data: CreateBatchDto): Promise<Batch>`
  - `BatchesService.findByProject(projectId: string): Promise<Batch[]>`
  - `BatchesService.findOne(id: string): Promise<Batch>`
  - `BatchesService.update(id: string, data: UpdateBatchDto): Promise<Batch>`

- [ ] **Step 1: Write the failing batch e2e test**

```ts
// test/batches.e2e-spec.ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Batches API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates and lists batches under a project', async () => {
    const project = await request(app.getHttpServer()).post('/projects').send({
      name: 'Batch Parent',
      taskType: 'text',
    });

    await request(app.getHttpServer())
      .post(`/projects/${project.body.id}/batches`)
      .send({
        name: 'Batch A',
        plannedTaskCount: 20,
      })
      .expect(201);

    const listResponse = await request(app.getHttpServer())
      .get(`/projects/${project.body.id}/batches`)
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].name).toBe('Batch A');
  });
});
```

- [ ] **Step 2: Run the batch test to verify it fails**

Run: `npm run test:e2e -- test/batches.e2e-spec.ts`
Expected: FAIL because batch routes are not implemented

- [ ] **Step 3: Add batch DTOs**

```ts
// src/batches/dto/create-batch.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum BatchStatusDto {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  READY_FOR_DELIVERY = 'ready_for_delivery',
  CLOSED = 'closed',
}

export class CreateBatchDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ enum: BatchStatusDto, required: false })
  @IsOptional()
  @IsEnum(BatchStatusDto)
  status?: BatchStatusDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  plannedTaskCount?: number;
}
```

```ts
// src/batches/dto/update-batch.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateBatchDto } from './create-batch.dto';

export class UpdateBatchDto extends PartialType(CreateBatchDto) {}
```

- [ ] **Step 4: Add the batch service and controller**

```ts
// src/batches/batches.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@Injectable()
export class BatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(projectId: string, data: CreateBatchDto) {
    await this.projectsService.findOne(projectId);
    return this.prisma.batch.create({
      data: {
        ...data,
        projectId,
      },
    });
  }

  async findByProject(projectId: string) {
    await this.projectsService.findOne(projectId);
    return this.prisma.batch.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const batch = await this.prisma.batch.findUnique({ where: { id } });
    if (!batch) {
      throw new NotFoundException(`Batch ${id} not found`);
    }
    return batch;
  }

  async update(id: string, data: UpdateBatchDto) {
    await this.findOne(id);
    return this.prisma.batch.update({
      where: { id },
      data,
    });
  }
}
```

```ts
// src/batches/batches.controller.ts
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { BatchesService } from './batches.service';

@ApiTags('batches')
@Controller()
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post('projects/:projectId/batches')
  create(@Param('projectId') projectId: string, @Body() dto: CreateBatchDto) {
    return this.batchesService.create(projectId, dto);
  }

  @Get('projects/:projectId/batches')
  findByProject(@Param('projectId') projectId: string) {
    return this.batchesService.findByProject(projectId);
  }

  @Get('batches/:id')
  findOne(@Param('id') id: string) {
    return this.batchesService.findOne(id);
  }

  @Patch('batches/:id')
  update(@Param('id') id: string, @Body() dto: UpdateBatchDto) {
    return this.batchesService.update(id, dto);
  }
}
```

```ts
// src/batches/batches.module.ts
import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { BatchesController } from './batches.controller';
import { BatchesService } from './batches.service';

@Module({
  imports: [ProjectsModule],
  controllers: [BatchesController],
  providers: [BatchesService],
  exports: [BatchesService],
})
export class BatchesModule {}
```

```ts
// src/app.module.ts
import { Module } from '@nestjs/common';
import { BatchesModule } from './batches/batches.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [PrismaModule, ProjectsModule, BatchesModule],
})
export class AppModule {}
```

- [ ] **Step 5: Run the batch test to verify it passes**

Run: `npm run test:e2e -- test/batches.e2e-spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/batches src/app.module.ts test/batches.e2e-spec.ts
git commit -m "feat: implement batch crud endpoints"
```

## Task 5: Implement the tasks module

**Files:**
- Modify: `src/app.module.ts`
- Create: `src/tasks/tasks.module.ts`
- Create: `src/tasks/tasks.controller.ts`
- Create: `src/tasks/tasks.service.ts`
- Create: `src/tasks/dto/create-task.dto.ts`
- Create: `src/tasks/dto/update-task.dto.ts`
- Test: `test/tasks.e2e-spec.ts`

**Interfaces:**
- Consumes:
  - `PrismaService`
  - `BatchesService.findOne(id: string): Promise<Batch>`
- Produces:
  - `TasksService.create(batchId: string, data: CreateTaskDto): Promise<TaskItem>`
  - `TasksService.findByBatch(batchId: string): Promise<TaskItem[]>`
  - `TasksService.findOne(id: string): Promise<TaskItem>`
  - `TasksService.update(id: string, data: UpdateTaskDto): Promise<TaskItem>`

- [ ] **Step 1: Write the failing task e2e test**

```ts
// test/tasks.e2e-spec.ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Tasks API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates and lists tasks under a batch', async () => {
    const project = await request(app.getHttpServer()).post('/projects').send({
      name: 'Task Parent',
      taskType: 'image',
    });

    const batch = await request(app.getHttpServer())
      .post(`/projects/${project.body.id}/batches`)
      .send({ name: 'Batch T' });

    await request(app.getHttpServer())
      .post(`/batches/${batch.body.id}/tasks`)
      .send({
        title: 'Check image quality',
        inputPayload: { imageUrl: 'https://example.com/a.png' },
        priority: 5,
      })
      .expect(201);

    const listResponse = await request(app.getHttpServer())
      .get(`/batches/${batch.body.id}/tasks`)
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].title).toBe('Check image quality');
  });
});
```

- [ ] **Step 2: Run the task test to verify it fails**

Run: `npm run test:e2e -- test/tasks.e2e-spec.ts`
Expected: FAIL because task routes are not implemented

- [ ] **Step 3: Add task DTOs**

```ts
// src/tasks/dto/create-task.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export enum TaskItemStatusDto {
  PENDING_ALLOCATION = 'pending_allocation',
  PENDING_PICKUP = 'pending_pickup',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  RETURNED = 'returned',
}

export class CreateTaskDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  externalRef?: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty({ type: Object })
  @IsObject()
  inputPayload!: Record<string, unknown>;

  @ApiProperty({ enum: TaskItemStatusDto, required: false })
  @IsOptional()
  @IsEnum(TaskItemStatusDto)
  status?: TaskItemStatusDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  priority?: number;
}
```

```ts
// src/tasks/dto/update-task.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
```

- [ ] **Step 4: Add the task service and controller**

```ts
// src/tasks/tasks.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BatchesService } from '../batches/batches.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly batchesService: BatchesService,
  ) {}

  async create(batchId: string, data: CreateTaskDto) {
    await this.batchesService.findOne(batchId);
    return this.prisma.taskItem.create({
      data: {
        ...data,
        batchId,
      },
    });
  }

  async findByBatch(batchId: string) {
    await this.batchesService.findOne(batchId);
    return this.prisma.taskItem.findMany({
      where: { batchId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.taskItem.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }

  async update(id: string, data: UpdateTaskDto) {
    await this.findOne(id);
    return this.prisma.taskItem.update({
      where: { id },
      data,
    });
  }
}
```

```ts
// src/tasks/tasks.controller.ts
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('batches/:batchId/tasks')
  create(@Param('batchId') batchId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(batchId, dto);
  }

  @Get('batches/:batchId/tasks')
  findByBatch(@Param('batchId') batchId: string) {
    return this.tasksService.findByBatch(batchId);
  }

  @Get('tasks/:id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch('tasks/:id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }
}
```

```ts
// src/tasks/tasks.module.ts
import { Module } from '@nestjs/common';
import { BatchesModule } from '../batches/batches.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [BatchesModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
```

```ts
// src/app.module.ts
import { Module } from '@nestjs/common';
import { BatchesModule } from './batches/batches.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [PrismaModule, ProjectsModule, BatchesModule, TasksModule],
})
export class AppModule {}
```

- [ ] **Step 5: Run the task test to verify it passes**

Run: `npm run test:e2e -- test/tasks.e2e-spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/tasks src/app.module.ts test/tasks.e2e-spec.ts
git commit -m "feat: implement task crud endpoints"
```

## Task 6: Implement the assignments module

**Files:**
- Modify: `src/app.module.ts`
- Create: `src/assignments/assignments.module.ts`
- Create: `src/assignments/assignments.controller.ts`
- Create: `src/assignments/assignments.service.ts`
- Create: `src/assignments/dto/create-assignment.dto.ts`
- Test: `test/assignments.e2e-spec.ts`

**Interfaces:**
- Consumes:
  - `PrismaService`
  - `TasksService.findOne(id: string): Promise<TaskItem>`
- Produces:
  - `AssignmentsService.create(taskId: string, data: CreateAssignmentDto): Promise<TaskAssignment>`
  - `AssignmentsService.findByTask(taskId: string): Promise<TaskAssignment[]>`

- [ ] **Step 1: Write the failing assignment e2e test**

```ts
// test/assignments.e2e-spec.ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Assignments API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates and lists assignments for a task', async () => {
    const project = await request(app.getHttpServer()).post('/projects').send({
      name: 'Assignment Parent',
      taskType: 'judge',
    });

    const batch = await request(app.getHttpServer())
      .post(`/projects/${project.body.id}/batches`)
      .send({ name: 'Batch Assign' });

    const task = await request(app.getHttpServer())
      .post(`/batches/${batch.body.id}/tasks`)
      .send({
        title: 'Judge answer quality',
        inputPayload: { question: 'Why?' },
      });

    await request(app.getHttpServer())
      .post(`/tasks/${task.body.id}/assignments`)
      .send({
        operatorId: 'operator-1',
        assigneeId: 'annotator-1',
        notes: 'First assignment',
      })
      .expect(201);

    const listResponse = await request(app.getHttpServer())
      .get(`/tasks/${task.body.id}/assignments`)
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].assigneeId).toBe('annotator-1');
  });
});
```

- [ ] **Step 2: Run the assignment test to verify it fails**

Run: `npm run test:e2e -- test/assignments.e2e-spec.ts`
Expected: FAIL because assignment routes are not implemented

- [ ] **Step 3: Add the assignment DTO**

```ts
// src/assignments/dto/create-assignment.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum TaskAssignmentStatusDto {
  ASSIGNED = 'assigned',
  ACCEPTED = 'accepted',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

export class CreateAssignmentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  operatorId?: string;

  @ApiProperty()
  @IsString()
  assigneeId!: string;

  @ApiProperty({ enum: TaskAssignmentStatusDto, required: false })
  @IsOptional()
  @IsEnum(TaskAssignmentStatusDto)
  status?: TaskAssignmentStatusDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
```

- [ ] **Step 4: Add the assignment service and controller**

```ts
// src/assignments/assignments.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
  ) {}

  async create(taskId: string, data: CreateAssignmentDto) {
    await this.tasksService.findOne(taskId);
    return this.prisma.taskAssignment.create({
      data: {
        ...data,
        taskItemId: taskId,
      },
    });
  }

  async findByTask(taskId: string) {
    await this.tasksService.findOne(taskId);
    return this.prisma.taskAssignment.findMany({
      where: { taskItemId: taskId },
      orderBy: { assignedAt: 'desc' },
    });
  }
}
```

```ts
// src/assignments/assignments.controller.ts
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { AssignmentsService } from './assignments.service';

@ApiTags('assignments')
@Controller()
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post('tasks/:taskId/assignments')
  create(@Param('taskId') taskId: string, @Body() dto: CreateAssignmentDto) {
    return this.assignmentsService.create(taskId, dto);
  }

  @Get('tasks/:taskId/assignments')
  findByTask(@Param('taskId') taskId: string) {
    return this.assignmentsService.findByTask(taskId);
  }
}
```

```ts
// src/assignments/assignments.module.ts
import { Module } from '@nestjs/common';
import { TasksModule } from '../tasks/tasks.module';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';

@Module({
  imports: [TasksModule],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
})
export class AssignmentsModule {}
```

```ts
// src/app.module.ts
import { Module } from '@nestjs/common';
import { AssignmentsModule } from './assignments/assignments.module';
import { BatchesModule } from './batches/batches.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [PrismaModule, ProjectsModule, BatchesModule, TasksModule, AssignmentsModule],
})
export class AppModule {}
```

- [ ] **Step 5: Run the assignment test to verify it passes**

Run: `npm run test:e2e -- test/assignments.e2e-spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/assignments src/app.module.ts test/assignments.e2e-spec.ts
git commit -m "feat: implement task assignment endpoints"
```

## Task 7: Add Prisma-aware error handling and e2e test config

**Files:**
- Create: `src/common/filters/prisma-exception.filter.ts`
- Modify: `src/main.ts`
- Create: `test/jest-e2e.json`
- Test: `npm run test:e2e`

**Interfaces:**
- Consumes:
  - `PrismaClientKnownRequestError`
- Produces:
  - global filter for Prisma errors
  - working e2e Jest config

- [ ] **Step 1: Write the failing expectation for consistent HTTP errors**

```ts
// Expected behavior:
// invalid unique or foreign-key style persistence errors should produce structured HTTP responses
```

- [ ] **Step 2: Create the Prisma exception filter**

```ts
// src/common/filters/prisma-exception.filter.ts
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
      message: exception.message,
    });
  }
}
```

- [ ] **Step 3: Register the filter and add Jest e2e config**

```ts
// src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Super Project Manager Backend')
    .setDescription('Backend MVP for the agent-powered data production platform')
    .setVersion('0.1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
```

```json
// test/jest-e2e.json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

- [ ] **Step 4: Run the complete e2e suite**

Run: `npm run test:e2e`
Expected: PASS for projects, batches, tasks, and assignments e2e coverage

- [ ] **Step 5: Commit**

```bash
git add src/common/filters/prisma-exception.filter.ts src/main.ts test/jest-e2e.json
git commit -m "feat: add persistence error handling and e2e config"
```

## Task 8: Create the first database migration and verify the local developer flow

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/*`
- Modify: `README.md`
- Test: `npx prisma migrate dev --name init`

**Interfaces:**
- Consumes:
  - existing Prisma schema
- Produces:
  - initial migration
  - documented local setup flow

- [ ] **Step 1: Ensure the local PostgreSQL connection string is configured**

Run: `cp .env.example .env`
Expected: local `.env` exists with `DATABASE_URL`

- [ ] **Step 2: Create the initial migration**

Run: `npx prisma migrate dev --name init`
Expected: migration directory created under `prisma/migrations` and database schema applied

- [ ] **Step 3: Smoke-test the app with the migrated database**

Run: `npm run start:dev`
Expected: app starts cleanly against PostgreSQL with generated Prisma client

- [ ] **Step 4: Add minimal backend setup instructions to the README**

```md
## Backend MVP setup

1. Copy `.env.example` to `.env`
2. Start PostgreSQL locally
3. Run `npm install`
4. Run `npx prisma migrate dev --name init`
5. Run `npm run start:dev`
6. Open `http://localhost:3000/api`
```

- [ ] **Step 5: Re-run the full test suite**

Run: `npm run test:e2e`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add prisma/migrations README.md .env.example prisma/schema.prisma
git commit -m "docs: add backend local setup flow"
```

## Self-Review

### Spec coverage

- NestJS backend application setup: covered by Task 1
- Prisma integration with PostgreSQL: covered by Tasks 2 and 8
- Database schema and migrations: covered by Tasks 2 and 8
- CRUD APIs for projects, batches, task items, and task assignments: covered by Tasks 3 through 6
- Request validation: covered by Tasks 1 and 3 through 6 DTOs
- Basic error handling: covered by Task 7
- Swagger API documentation: covered by Task 1 and reinforced through DTO decorators in Tasks 3 through 6
- Modular code structure: covered by all tasks through explicit module boundaries

### Placeholder scan

- No `TODO`, `TBD`, or deferred implementation markers remain
- Each task contains explicit files, commands, and implementation code

### Type consistency

- `ProjectsService.findOne`, `BatchesService.findOne`, and `TasksService.findOne` are consistently consumed by downstream modules
- DTO names and route signatures are consistent with the spec
- Prisma model names match service usage: `project`, `batch`, `taskItem`, `taskAssignment`
