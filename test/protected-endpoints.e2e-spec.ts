import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '../src/common/enums/role.enum';

describe('Protected Endpoints (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let customerToken: string;
  let adminToken: string;
  let customerId: string;
  let adminId: string;
  let categoryId: string;

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
    await prismaService.orderItem.deleteMany();
    await prismaService.product.deleteMany();
    await prismaService.category.deleteMany();
    await prismaService.user.deleteMany();

    // Create test users and get tokens
    const customerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'customer@example.com',
        password: 'password123',
        firstName: 'Customer',
        lastName: 'User',
      });

    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'User',
      });

    customerToken = customerResponse.body.access_token;
    adminToken = adminResponse.body.access_token;
    customerId = customerResponse.body.user.id;
    adminId = adminResponse.body.user.id;

    // Update admin user role
    await prismaService.user.update({
      where: { id: adminId },
      data: { role: Role.ADMIN },
    });

    // Create a test category
    const category = await prismaService.category.create({
      data: {
        name: 'Test Category',
        description: 'Test Category Description',
      },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  describe('/users/me (GET)', () => {
    it('should return user profile for authenticated customer', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: customerId,
        email: 'customer@example.com',
        firstName: 'Customer',
        lastName: 'User',
        role: Role.CUSTOMER,
      });
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return user profile for authenticated admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: adminId,
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: Role.ADMIN,
      });
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 without authorization header', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/products (POST)', () => {
    const validProductData = {
      name: 'Test Product',
      description: 'Test Product Description',
      price: 99.99,
      stock: 10,
      categoryId: categoryId,
    };

    it('should create product for admin user', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validProductData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: validProductData.name,
        description: validProductData.description,
        price: validProductData.price,
        stock: validProductData.stock,
        categoryId: validProductData.categoryId,
      });
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('category');
    });

    it('should return 403 for customer user', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validProductData)
        .expect(403);
    });

    it('should return 401 without authorization header', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .send(validProductData)
        .expect(401);
    });

    it('should return 400 for invalid product data', async () => {
      const invalidData = {
        name: '', // Empty name
        price: -10, // Negative price
        stock: -5, // Negative stock
      };

      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('/products (GET)', () => {
    beforeEach(async () => {
      // Create test products
      await prismaService.product.createMany({
        data: [
          {
            name: 'Product 1',
            description: 'Description 1',
            price: 99.99,
            stock: 10,
            categoryId: categoryId,
          },
          {
            name: 'Product 2',
            description: 'Description 2',
            price: 149.99,
            stock: 5,
            categoryId: categoryId,
          },
        ],
      });
    });

    it('should return all products for any user (public endpoint)', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('category');
    });

    it('should return products for authenticated customer', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });

    it('should return products for authenticated admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('/products/:id (PATCH)', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await prismaService.product.create({
        data: {
          name: 'Original Product',
          description: 'Original Description',
          price: 99.99,
          stock: 10,
          categoryId: categoryId,
        },
      });
      productId = product.id;
    });

    const updateData = {
      name: 'Updated Product',
      price: 149.99,
    };

    it('should update product for admin user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: productId,
        name: updateData.name,
        price: updateData.price,
      });
    });

    it('should return 403 for customer user', async () => {
      await request(app.getHttpServer())
        .patch(`/products/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should return 401 without authorization header', async () => {
      await request(app.getHttpServer())
        .patch(`/products/${productId}`)
        .send(updateData)
        .expect(401);
    });
  });

  describe('/products/:id (DELETE)', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await prismaService.product.create({
        data: {
          name: 'Product to Delete',
          description: 'Description',
          price: 99.99,
          stock: 10,
          categoryId: categoryId,
        },
      });
      productId = product.id;
    });

    it('should delete product for admin user', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Product deleted successfully',
      });

      // Verify product was deleted
      const product = await prismaService.product.findUnique({
        where: { id: productId },
      });
      expect(product).toBeNull();
    });

    it('should return 403 for customer user', async () => {
      await request(app.getHttpServer())
        .delete(`/products/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return 401 without authorization header', async () => {
      await request(app.getHttpServer())
        .delete(`/products/${productId}`)
        .expect(401);
    });
  });
});
