import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '../src/common/enums/role.enum';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prismaService.user.deleteMany();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    const validRegisterData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterData)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toMatchObject({
        email: validRegisterData.email,
        firstName: validRegisterData.firstName,
        lastName: validRegisterData.lastName,
        role: Role.CUSTOMER,
      });
      expect(response.body.user).not.toHaveProperty('password');

      // Verify user was created in database
      const user = await prismaService.user.findUnique({
        where: { email: validRegisterData.email },
      });
      expect(user).toBeTruthy();
      expect(user?.email).toBe(validRegisterData.email);
      expect(user?.role).toBe(Role.CUSTOMER);
    });

    it('should return 409 when trying to register with existing email', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterData)
        .expect(201);

      // Second registration with same email
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterData)
        .expect(409);
    });

    it('should return 400 for invalid email format', async () => {
      const invalidData = {
        ...validRegisterData,
        email: 'invalid-email',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidData)
        .expect(400);
    });

    it('should return 400 for short password', async () => {
      const invalidData = {
        ...validRegisterData,
        password: '123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidData)
        .expect(400);
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        email: 'test@example.com',
        // Missing password, firstName, lastName
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    beforeEach(async () => {
      // Create a user for login tests
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validLoginData,
          firstName: 'John',
          lastName: 'Doe',
        });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(validLoginData)
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toMatchObject({
        email: validLoginData.email,
        firstName: 'John',
        lastName: 'Doe',
        role: Role.CUSTOMER,
      });
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 401 for invalid email', async () => {
      const invalidData = {
        ...validLoginData,
        email: 'nonexistent@example.com',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidData)
        .expect(401);
    });

    it('should return 401 for invalid password', async () => {
      const invalidData = {
        ...validLoginData,
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidData)
        .expect(401);
    });

    it('should return 400 for invalid email format', async () => {
      const invalidData = {
        ...validLoginData,
        email: 'invalid-email',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidData)
        .expect(400);
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        email: 'test@example.com',
        // Missing password
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidData)
        .expect(400);
    });
  });
});
