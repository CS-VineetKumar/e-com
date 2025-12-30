import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/common/cache';
import type { Cache } from 'cache-manager';

@Injectable()
export class GraphQLCacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo();
    const args = gqlContext.getArgs();

    // Only cache queries, not mutations
    if (info.operation.operation !== 'query') {
      return next.handle();
    }

    // Generate cache key based on field name and arguments
    const cacheKey = this.generateCacheKey(info.fieldName, args);

    // Try to get from cache
    const cachedValue = await this.cacheManager.get(cacheKey);
    if (cachedValue) {
      return of(cachedValue);
    }

    // If not in cache, execute and cache the result
    return next.handle().pipe(
      tap(async (data) => {
        // Cache for different durations based on query type
        const ttl = this.getTTL(info.fieldName);
        await this.cacheManager.set(cacheKey, data, ttl);
      }),
    );
  }

  private generateCacheKey(fieldName: string, args: any): string {
    const argsString = JSON.stringify(args);
    return `gql:${fieldName}:${argsString}`;
  }

  private getTTL(fieldName: string): number {
    // Different cache durations for different queries
    const ttlMap: Record<string, number> = {
      products: 60 * 1000, // 1 minute
      product: 60 * 1000,  // 1 minute
      categories: 300 * 1000, // 5 minutes (categories change less frequently)
      category: 300 * 1000,
      orders: 30 * 1000, // 30 seconds (orders are more dynamic)
      order: 30 * 1000,
    };

    return ttlMap[fieldName] || 60 * 1000; // Default 1 minute
  }
}

