# GraphQL Integration Guide

This guide explains how to add GraphQL support to any module in this project. The project uses a **code-first** approach with decorators, making it easy to integrate GraphQL alongside existing REST endpoints.

## Architecture

- **GraphQL Module**: Core configuration at `src/graphql/graphql.module.ts`
- **Auto Schema Generation**: Schema is auto-generated at `src/graphql/schema.gql`
- **Playground**: Available at `/graphql` endpoint (disabled in production)
- **Coexistence**: GraphQL and REST APIs work side-by-side

## Quick Start: Adding GraphQL to a Module

### Step 1: Create GraphQL Object Types

Create an `object.ts` file in a `graphql` folder within your module:

```typescript
// src/your-module/graphql/your-entity.object.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class YourEntityObject {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;
}
```

### Step 2: Create Input Types for Mutations

```typescript
// src/your-module/graphql/dto/create-entity.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class CreateEntityInput {
  @Field()
  @IsString()
  @MinLength(1)
  name: string;

  @Field({ nullable: true })
  description?: string;
}
```

### Step 3: Create Resolver

```typescript
// src/your-module/graphql/your-entity.resolver.ts
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { YourService } from '../your.service';
import { YourEntityObject } from './your-entity.object';
import { CreateEntityInput } from './dto/create-entity.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Resolver(() => YourEntityObject)
export class YourEntityResolver {
  constructor(private readonly yourService: YourService) {}

  @Query(() => [YourEntityObject], { name: 'entities' })
  async findAll(): Promise<YourEntityObject[]> {
    return this.yourService.findAll();
  }

  @Query(() => YourEntityObject, { name: 'entity' })
  async findOne(@Args('id', { type: () => Int }) id: number): Promise<YourEntityObject> {
    return this.yourService.findOne(id);
  }

  @Mutation(() => YourEntityObject)
  @UseGuards(JwtAuthGuard) // Optional: Add authentication
  async createEntity(@Args('input') input: CreateEntityInput): Promise<YourEntityObject> {
    return this.yourService.create(input);
  }
}
```

### Step 4: Register Resolver in Module

```typescript
// src/your-module/your-module.module.ts
import { Module } from '@nestjs/common';
import { YourService } from './your.service';
import { YourController } from './your.controller';
import { YourEntityResolver } from './graphql/your-entity.resolver'; // Add this

@Module({
  controllers: [YourController], // REST endpoints still work
  providers: [YourService, YourEntityResolver], // Add resolver
  exports: [YourService],
})
export class YourModule {}
```

## Complete Example: Products Module

See `src/products/graphql/` for a complete implementation:

- ✅ `product.object.ts` - GraphQL Object Type
- ✅ `dto/create-product.input.ts` - Input for mutations
- ✅ `dto/update-product.input.ts` - Input for updates
- ✅ `products.resolver.ts` - Queries and Mutations

## Authentication & Authorization

GraphQL resolvers use the same guards as REST controllers:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Mutation(() => ProductObject)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
async createProduct(@Args('input') input: CreateProductInput) {
  // Only admins can access this
}
```

## Accessing Current User

Use the `@Context()` decorator to access the authenticated user:

```typescript
@Query(() => UserObject)
@UseGuards(JwtAuthGuard)
async me(@Context() context: { req: { user: User } }): Promise<UserObject> {
  return context.req.user;
}
```

## GraphQL Decorators Reference

### Object Types
- `@ObjectType()` - Marks a class as a GraphQL object type
- `@Field()` - Marks a property as a GraphQL field
- `@Field(() => Int)` - Specify scalar type
- `@Field({ nullable: true })` - Optional field

### Input Types
- `@InputType()` - Marks a class as an input type
- `@Field()` - Same as ObjectType

### Resolvers
- `@Resolver(() => EntityObject)` - Marks a class as a resolver
- `@Query(() => ReturnType)` - GraphQL query
- `@Mutation(() => ReturnType)` - GraphQL mutation
- `@Args('name')` - Extract argument
- `@Context()` - Access request context

## Testing GraphQL

### Using GraphQL Playground

1. Start your server: `npm run start:dev`
2. Navigate to: `http://localhost:6060/graphql`
3. Write queries:

```graphql
query {
  products {
    id
    name
    price
    category {
      id
      name
    }
  }
}
```

```graphql
mutation {
  createProduct(input: {
    name: "New Product"
    price: 99.99
    stock: 10
    categoryId: 1
  }) {
    id
    name
    price
  }
}
```

### Authenticated Queries

In GraphQL Playground, add headers:

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

## File Structure Pattern

```
src/
└── your-module/
    ├── your-module.module.ts
    ├── your.service.ts
    ├── your.controller.ts
    └── graphql/                    # GraphQL-specific files
        ├── your-entity.object.ts   # Object types
        ├── your-entity.resolver.ts # Resolvers
        └── dto/                    # Input types
            ├── create-entity.input.ts
            └── update-entity.input.ts
```

## Best Practices

1. **Reuse Services**: GraphQL resolvers should call the same service methods as REST controllers
2. **Separate Concerns**: Keep GraphQL files in a `graphql/` subfolder
3. **Input Validation**: Use class-validator decorators on inputs
4. **Type Safety**: Use TypeScript types and GraphQL types consistently
5. **Documentation**: Add descriptions using `@Field({ description: '...' })`

## Common Patterns

### Pagination (Optional Enhancement)

```typescript
@InputType()
class PaginationInput {
  @Field(() => Int, { defaultValue: 10 })
  limit: number;

  @Field(() => Int, { defaultValue: 0 })
  offset: number;
}

@Query(() => [ProductObject])
async products(@Args('pagination') pagination: PaginationInput) {
  // Implement pagination logic
}
```

### Relations

GraphQL automatically handles relations when you include them in your service:

```typescript
// In your service
async findAll() {
  return this.prisma.entity.findMany({
    include: { relatedEntity: true }
  });
}

// GraphQL automatically exposes relatedEntity field
```

## Troubleshooting

- **Schema not updating**: Delete `src/graphql/schema.gql` and restart server
- **Type errors**: Ensure Prisma client is regenerated: `npx prisma generate`
- **Auth not working**: Verify JWT strategy is set up correctly for GraphQL context

## Next Steps

1. Add GraphQL to `Categories` module (see `src/categories/graphql/category.object.ts` as starting point)
2. Add GraphQL to `Orders` module
3. Add GraphQL to `Cart` module
4. Consider adding subscriptions for real-time updates

---

**Note**: Both REST and GraphQL APIs are available simultaneously. You can gradually migrate or use both based on your needs.
