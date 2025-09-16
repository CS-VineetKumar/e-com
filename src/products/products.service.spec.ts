import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
  };

  const mockProduct = {
    id: 'product-id',
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    stock: 10,
    categoryId: 'category-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: 'category-id',
      name: 'Test Category',
      description: 'Test Category Description',
    },
  };

  const mockCategory = {
    id: 'category-id',
    name: 'Test Category',
    description: 'Test Category Description',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createProductDto: CreateProductDto = {
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      stock: 10,
      categoryId: 'category-id',
    };

    it('should create a product successfully', async () => {
      // Arrange
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.product.create.mockResolvedValue(mockProduct);

      // Act
      const result = await service.create(createProductDto);

      // Assert
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: createProductDto.categoryId },
      });
      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: createProductDto,
        include: {
          category: true,
        },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when category does not exist', async () => {
      // Arrange
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createProductDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: createProductDto.categoryId },
      });
      expect(mockPrismaService.product.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      // Arrange
      const products = [mockProduct];
      mockPrismaService.product.findMany.mockResolvedValue(products);

      // Act
      const result = await service.findAll();

      // Assert
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        include: {
          category: true,
        },
      });
      expect(result).toEqual(products);
    });
  });

  describe('findOne', () => {
    const productId = 'product-id';

    it('should return a product by id', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      // Act
      const result = await service.findOne(productId);

      // Assert
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
        include: {
          category: true,
        },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(productId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
        include: {
          category: true,
        },
      });
    });
  });

  describe('update', () => {
    const productId = 'product-id';
    const updateProductDto: UpdateProductDto = {
      name: 'Updated Product',
      price: 149.99,
    };

    it('should update a product successfully', async () => {
      // Arrange
      const updatedProduct = { ...mockProduct, ...updateProductDto };
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue(updatedProduct);

      // Act
      const result = await service.update(productId, updateProductDto);

      // Assert
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: updateProductDto,
        include: {
          category: true,
        },
      });
      expect(result).toEqual(updatedProduct);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(productId, updateProductDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(mockPrismaService.product.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating with non-existent category', async () => {
      // Arrange
      const updateWithCategory: UpdateProductDto = {
        categoryId: 'non-existent-category',
      };
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update(productId, updateWithCategory),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: updateWithCategory.categoryId },
      });
      expect(mockPrismaService.product.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const productId = 'product-id';

    it('should delete a product successfully', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.delete.mockResolvedValue(mockProduct);

      // Act
      await service.remove(productId);

      // Assert
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(mockPrismaService.product.delete).toHaveBeenCalledWith({
        where: { id: productId },
      });
    });

    it('should throw NotFoundException when product does not exist', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(productId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(mockPrismaService.product.delete).not.toHaveBeenCalled();
    });
  });
});
