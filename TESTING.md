# Testing Guide

This document provides a comprehensive guide for testing the E-commerce API.

## Test Structure

The project includes both unit tests and integration tests:

### Unit Tests
- **Location**: `src/**/*.spec.ts`
- **Purpose**: Test individual components in isolation
- **Coverage**: Services, controllers, guards, strategies, decorators

### Integration Tests
- **Location**: `test/**/*.e2e-spec.ts`
- **Purpose**: Test complete API endpoints and workflows
- **Coverage**: Authentication flows, protected endpoints, role-based access

## Test Files

### Unit Tests

#### Authentication Module
- `src/auth/auth.service.spec.ts` - AuthService unit tests
- `src/auth/auth.controller.spec.ts` - AuthController unit tests
- `src/auth/strategies/jwt.strategy.spec.ts` - JWT Strategy unit tests

#### Common Module
- `src/common/guards/roles.guard.spec.ts` - RolesGuard unit tests

#### Products Module
- `src/products/products.service.spec.ts` - ProductsService unit tests
- `src/products/products.controller.spec.ts` - ProductsController unit tests

### Integration Tests

#### Authentication Flow
- `test/auth.e2e-spec.ts` - Complete authentication flow testing
  - User registration
  - User login
  - Input validation
  - Error handling

#### Protected Endpoints
- `test/protected-endpoints.e2e-spec.ts` - Authorization and protected endpoint testing
  - JWT authentication
  - Role-based access control
  - Product CRUD operations
  - User profile access

## Running Tests

### All Tests
```bash
npm run test:all
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:cov
```

### Debug Mode
```bash
npm run test:debug
```

## Test Configuration

### Jest Configuration
- **Unit Tests**: Uses default Jest configuration in `package.json`
- **Integration Tests**: Uses `test/jest-e2e.json` configuration

### Test Environment
- **Database**: Separate test database (configured via `.env.test`)
- **Timeout**: 30 seconds for integration tests
- **Setup**: Automatic cleanup before each test

## Test Utilities

### TestDataFactory
Located in `test/test-utils.ts`, provides helper methods for creating test data:

```typescript
// Create test user
const user = await TestDataFactory.createUser({
  email: 'custom@example.com',
  role: Role.CUSTOMER
});

// Create admin user
const admin = await TestDataFactory.createAdmin();

// Create test category
const category = await TestDataFactory.createCategory({
  name: 'Electronics'
});

// Create test product
const product = await TestDataFactory.createProduct(category.id, {
  name: 'Laptop',
  price: 999.99
});

// Cleanup test data
await TestDataFactory.cleanup();
```

### Test Constants
Pre-defined test data constants for consistent testing:

```typescript
import { testConstants } from './test-utils';

// Use in tests
const response = await request(app.getHttpServer())
  .post('/auth/register')
  .send(testConstants.validRegisterData);
```

## Test Coverage

### Authentication & Authorization
- ✅ User registration with validation
- ✅ User login with credential verification
- ✅ JWT token generation and validation
- ✅ Password hashing and verification
- ✅ Role-based access control
- ✅ Protected endpoint access
- ✅ Error handling for invalid credentials

### Product Management
- ✅ Product creation (Admin only)
- ✅ Product listing (Public)
- ✅ Product retrieval by ID (Public)
- ✅ Product updates (Admin only)
- ✅ Product deletion (Admin only)
- ✅ Category validation
- ✅ Input validation and error handling

### User Management
- ✅ User profile retrieval
- ✅ Authentication requirement
- ✅ Data sanitization (password exclusion)

## Test Scenarios

### Authentication Tests

#### Registration
- Valid user registration
- Duplicate email handling
- Input validation (email format, password length)
- Required field validation
- Password hashing verification

#### Login
- Valid credentials login
- Invalid email handling
- Invalid password handling
- Input validation
- JWT token generation

### Authorization Tests

#### Role-Based Access
- Customer role permissions
- Admin role permissions
- Unauthorized access attempts
- Invalid token handling
- Missing token handling

#### Protected Endpoints
- User profile access
- Product management (Admin only)
- Public product listing
- Error responses for unauthorized access

## Database Testing

### Test Database Setup
1. Create separate test database
2. Configure `.env.test` with test database URL
3. Run migrations on test database
4. Clean up data between tests

### Data Isolation
- Each test runs with clean database state
- Automatic cleanup before each test
- No data persistence between tests

## Mocking Strategy

### Unit Tests
- Mock external dependencies (Prisma, JWT, bcrypt)
- Mock HTTP requests and responses
- Mock configuration services
- Focus on business logic testing

### Integration Tests
- Use real database (test instance)
- Use real services and dependencies
- Test complete request/response cycles
- Verify actual data persistence

## Best Practices

### Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests independent and isolated

### Test Data
- Use factory methods for test data creation
- Avoid hardcoded values
- Clean up test data after tests
- Use realistic test data

### Assertions
- Test both success and failure scenarios
- Verify response structure and content
- Check database state changes
- Validate error messages and status codes

### Performance
- Use appropriate timeouts for integration tests
- Avoid unnecessary database operations
- Mock external services in unit tests
- Run tests in parallel when possible

## Continuous Integration

### Pre-commit Hooks
- Run unit tests before commits
- Check test coverage thresholds
- Validate code formatting

### CI/CD Pipeline
- Run all tests on pull requests
- Generate coverage reports
- Deploy only if tests pass
- Run integration tests against staging environment

## Troubleshooting

### Common Issues

#### Database Connection
- Ensure test database is running
- Check `.env.test` configuration
- Verify database permissions

#### Test Timeouts
- Increase timeout for slow operations
- Check for hanging database connections
- Verify cleanup operations

#### Flaky Tests
- Ensure proper test isolation
- Check for race conditions
- Verify mock configurations

### Debug Tips
- Use `console.log` for debugging
- Run individual test files
- Use Jest's `--verbose` flag
- Check test database state

## Future Enhancements

### Planned Test Improvements
- [ ] Add performance tests
- [ ] Implement contract testing
- [ ] Add visual regression tests
- [ ] Create load testing suite
- [ ] Add security testing
- [ ] Implement mutation testing

### Test Coverage Goals
- [ ] Achieve 90%+ code coverage
- [ ] Add edge case testing
- [ ] Implement property-based testing
- [ ] Add accessibility testing
