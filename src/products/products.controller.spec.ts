import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: ProductsService;

  const mockProductsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    productsService = module.get<ProductsService>(ProductsService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createProductDto: CreateProductDto = {
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      stock: 10,
      categoryId: 'category-id',
    };

    it('should create a product', async () => {
      // Arrange
      mockProductsService.create.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.create(createProductDto);

      // Assert
      expect(productsService.create).toHaveBeenCalledWith(createProductDto);
      expect(result).toEqual(mockProduct);
    });

    it('should handle creation errors', async () => {
      // Arrange
      const error = new Error('Creation failed');
      mockProductsService.create.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.create(createProductDto)).rejects.toThrow(error);
      expect(productsService.create).toHaveBeenCalledWith(createProductDto);
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      // Arrange
      const products = [mockProduct];
      mockProductsService.findAll.mockResolvedValue(products);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(productsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(products);
    });
  });

  describe('findOne', () => {
    const productId = 'product-id';

    it('should return a product by id', async () => {
      // Arrange
      mockProductsService.findOne.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.findOne(productId);

      // Assert
      expect(productsService.findOne).toHaveBeenCalledWith(productId);
      expect(result).toEqual(mockProduct);
    });

    it('should handle find errors', async () => {
      // Arrange
      const error = new Error('Product not found');
      mockProductsService.findOne.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.findOne(productId)).rejects.toThrow(error);
      expect(productsService.findOne).toHaveBeenCalledWith(productId);
    });
  });

  describe('update', () => {
    const productId = 'product-id';
    const updateProductDto: UpdateProductDto = {
      name: 'Updated Product',
      price: 149.99,
    };

    it('should update a product', async () => {
      // Arrange
      const updatedProduct = { ...mockProduct, ...updateProductDto };
      mockProductsService.update.mockResolvedValue(updatedProduct);

      // Act
      const result = await controller.update(productId, updateProductDto);

      // Assert
      expect(productsService.update).toHaveBeenCalledWith(
        productId,
        updateProductDto,
      );
      expect(result).toEqual(updatedProduct);
    });

    it('should handle update errors', async () => {
      // Arrange
      const error = new Error('Update failed');
      mockProductsService.update.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.update(productId, updateProductDto),
      ).rejects.toThrow(error);
      expect(productsService.update).toHaveBeenCalledWith(
        productId,
        updateProductDto,
      );
    });
  });

  describe('remove', () => {
    const productId = 'product-id';

    it('should delete a product', async () => {
      // Arrange
      mockProductsService.remove.mockResolvedValue(undefined);

      // Act
      const result = await controller.remove(productId);

      // Assert
      expect(productsService.remove).toHaveBeenCalledWith(productId);
      expect(result).toEqual({ message: 'Product deleted successfully' });
    });

    it('should handle deletion errors', async () => {
      // Arrange
      const error = new Error('Deletion failed');
      mockProductsService.remove.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.remove(productId)).rejects.toThrow(error);
      expect(productsService.remove).toHaveBeenCalledWith(productId);
    });
  });
});
