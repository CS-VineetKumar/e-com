import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        status: 200,
        message: this.getMessage(context),
        data,
      })),
    );
  }

  private getMessage(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    // Define messages based on endpoint patterns
    if (url.includes('/auth/register')) {
      return 'User registered successfully';
    }
    if (url.includes('/auth/login')) {
      return 'Login successful';
    }
    if (url.includes('/users/me')) {
      return 'User profile retrieved successfully';
    }
    if (url.includes('/products')) {
      if (method === 'GET') {
        return url.includes('/:id') ? 'Product retrieved successfully' : 'Products retrieved successfully';
      }
      if (method === 'POST') {
        return 'Product created successfully';
      }
      if (method === 'PATCH') {
        return 'Product updated successfully';
      }
      if (method === 'DELETE') {
        return 'Product deleted successfully';
      }
    }
    if (url.includes('/categories')) {
      if (method === 'GET') {
        return url.includes('/:id') ? 'Category retrieved successfully' : 'Categories retrieved successfully';
      }
      if (method === 'POST') {
        return 'Category created successfully';
      }
      if (method === 'PATCH') {
        return 'Category updated successfully';
      }
      if (method === 'DELETE') {
        return 'Category deleted successfully';
      }
    }

    // Default messages
    switch (method) {
      case 'GET':
        return 'Data retrieved successfully';
      case 'POST':
        return 'Data created successfully';
      case 'PATCH':
      case 'PUT':
        return 'Data updated successfully';
      case 'DELETE':
        return 'Data deleted successfully';
      default:
        return 'Operation completed successfully';
    }
  }
}
