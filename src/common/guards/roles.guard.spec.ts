import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockExecutionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn(),
    }),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      // Arrange
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should return true when user has required role', () => {
      // Arrange
      const requiredRoles = [Role.ADMIN];
      const mockRequest = {
        user: {
          id: 'user-id',
          email: 'admin@example.com',
          role: Role.ADMIN,
        },
      };

      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(mockRequest);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should return true when user has one of multiple required roles', () => {
      // Arrange
      const requiredRoles = [Role.ADMIN, Role.CUSTOMER];
      const mockRequest = {
        user: {
          id: 'user-id',
          email: 'customer@example.com',
          role: Role.CUSTOMER,
        },
      };

      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(mockRequest);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user does not have required role', () => {
      // Arrange
      const requiredRoles = [Role.ADMIN];
      const mockRequest = {
        user: {
          id: 'user-id',
          email: 'customer@example.com',
          role: Role.CUSTOMER,
        },
      };

      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(mockRequest);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when user is not authenticated', () => {
      // Arrange
      const requiredRoles = [Role.ADMIN];
      const mockRequest = {};

      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(mockRequest);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(false);
    });
  });
});
