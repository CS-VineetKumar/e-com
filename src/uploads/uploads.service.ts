import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { PrismaService } from '../prisma/prisma.service';
import { UploadImageDto } from './dto/upload-image.dto';
import { ALLOWED_IMAGE_MIME_TYPES, UPLOAD_MAX_FILE_SIZE } from './uploads.constants';
import { MediaContextType } from '@prisma/client';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly s3Client: S3Client | null;
  private readonly bucketName: string | null;
  private readonly region: string;
  private readonly publicUrl: string | null;
  private readonly isEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.region =
      this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || null;
    this.publicUrl =
      this.configService.get<string>('AWS_S3_PUBLIC_URL') || null;

    const accessKeyId =
      this.configService.get<string>('AWS_ACCESS_KEY_ID') || null;
    const secretAccessKey =
      this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || null;

    if (!this.bucketName || !accessKeyId || !secretAccessKey) {
      this.logger.warn(
        'Image uploads disabled: AWS credentials or bucket are not configured',
      );
      this.s3Client = null;
      this.isEnabled = false;
      return;
    }

    this.isEnabled = true;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadImage(
    file: Express.Multer.File | undefined,
    dto: UploadImageDto,
  ) {
    const { s3Client, bucketName } = this.ensureUploadsEnabled();

    if (!file) {
      throw new BadRequestException('File is required');
    }

    this.validateFile(file);

    const contextType = dto.contextType ?? MediaContextType.GENERAL;
    const contextId = dto.contextId;

    await this.ensureContextExists(contextType, contextId);

    const key = this.buildObjectKey(
      contextType,
      contextId,
      file.originalname,
    );

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } catch (error) {
      this.logger.error('Failed to upload file to S3', error as Error);
      throw new InternalServerErrorException('Failed to upload file');
    }

    const url = this.buildFileUrl(bucketName, key);

    return this.prisma.media.create({
      data: {
        key,
        url,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        contextType,
        contextId,
        metadata: dto.metadata,
        productId:
          contextType === MediaContextType.PRODUCT ? contextId ?? null : null,
        categoryId:
          contextType === MediaContextType.CATEGORY ? contextId ?? null : null,
      },
    });
  }

  private validateFile(file: Express.Multer.File) {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > UPLOAD_MAX_FILE_SIZE) {
      throw new BadRequestException('File exceeds size limit of 5MB');
    }
  }

  private async ensureContextExists(
    contextType: MediaContextType,
    contextId?: number,
  ) {
    if (
      (contextType === MediaContextType.PRODUCT ||
        contextType === MediaContextType.CATEGORY) &&
      !contextId
    ) {
      throw new BadRequestException(
        'contextId is required when contextType is PRODUCT or CATEGORY',
      );
    }

    if (contextType === MediaContextType.PRODUCT && contextId) {
      const product = await this.prisma.product.findUnique({
        where: { id: contextId },
        select: { id: true },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }
    }

    if (contextType === MediaContextType.CATEGORY && contextId) {
      const category = await this.prisma.category.findUnique({
        where: { id: contextId },
        select: { id: true },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }
  }

  private buildObjectKey(
    contextType: MediaContextType,
    contextId: number | undefined,
    originalName: string,
  ): string {
    const safeFileName = originalName
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9.\-_]/g, '')
      .toLowerCase();

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    const prefix = this.resolvePrefix(contextType, contextId);

    return `${prefix}/${timestamp}-${random}-${safeFileName}`;
  }

  private resolvePrefix(
    contextType: MediaContextType,
    contextId?: number,
  ): string {
    switch (contextType) {
      case MediaContextType.PRODUCT:
        return `products/${contextId}`;
      case MediaContextType.CATEGORY:
        return `categories/${contextId}`;
      default:
        return 'general';
    }
  }

  private buildFileUrl(bucketName: string, key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }

    return `https://${bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  private ensureUploadsEnabled(): { s3Client: S3Client; bucketName: string } {
    if (!this.isEnabled || !this.s3Client || !this.bucketName) {
      throw new ServiceUnavailableException(
        'Image uploads are not configured. Please set AWS credentials and bucket.',
      );
    }

    return {
      s3Client: this.s3Client,
      bucketName: this.bucketName,
    };
  }
}

