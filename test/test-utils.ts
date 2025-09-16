import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export interface TestUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface TestProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
}

export interface TestCategory {
  id: string;
  name: string;
  description: string;
}

export class TestDataFactory {
  static async createUser(
    overrides: Partial<TestUser> = {},
  ): Promise<TestUser> {
    const defaultUser = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: Role.CUSTOMER,
      ...overrides,
    };

    const hashedPassword = await bcrypt.hash(defaultUser.password, 12);

    const user = await prisma.user.create({
      data: {
        ...defaultUser,
        password: hashedPassword,
      },
    });

    return {
      ...user,
      password: defaultUser.password, // Return original password for testing
    };
  }

  static async createAdmin(
    overrides: Partial<TestUser> = {},
  ): Promise<TestUser> {
    return this.createUser({
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
      ...overrides,
    });
  }

  static async createCategory(
    overrides: Partial<TestCategory> = {},
  ): Promise<TestCategory> {
    const defaultCategory = {
      name: 'Test Category',
      description: 'Test Category Description',
      ...overrides,
    };

    return prisma.category.create({
      data: defaultCategory,
    });
  }

  static async createProduct(
    categoryId: string,
    overrides: Partial<TestProduct> = {},
  ): Promise<TestProduct> {
    const defaultProduct = {
      name: 'Test Product',
      description: 'Test Product Description',
      price: 99.99,
      stock: 10,
      categoryId,
      ...overrides,
    };

    return prisma.product.create({
      data: defaultProduct,
    });
  }

  static async cleanup(): Promise<void> {
    await prisma.orderItem.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
  }
}

export const testConstants = {
  validRegisterData: {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
  },
  validLoginData: {
    email: 'test@example.com',
    password: 'password123',
  },
  invalidEmail: 'invalid-email',
  shortPassword: '123',
  validProductData: {
    name: 'Test Product',
    description: 'Test Product Description',
    price: 99.99,
    stock: 10,
  },
  invalidProductData: {
    name: '',
    price: -10,
    stock: -5,
  },
};
