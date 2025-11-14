import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
    });

    return this.generateTokensForUser(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokensForUser(user);
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.getRefreshSecret(),
      }) as JwtPayload;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!payload.tokenId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenId: payload.tokenId },
    });

    if (
      !storedToken ||
      storedToken.revoked ||
      storedToken.userId !== payload.sub ||
      storedToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isTokenValid = await bcrypt.compare(
      refreshToken,
      storedToken.tokenHash,
    );

    if (!isTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { tokenId: storedToken.tokenId },
      data: {
        revoked: true,
        revokedAt: new Date(),
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return this.generateTokensForUser(user);
  }

  private async generateTokensForUser(user: User): Promise<AuthResponseDto> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId: user.id,
        revoked: false,
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        revoked: true,
        revokedAt: new Date(),
      },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const tokenId = randomUUID();
    const refreshPayload: JwtPayload = {
      ...payload,
      tokenId,
    };

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.getRefreshSecret(),
      expiresIn: this.getRefreshExpiry(),
    });

    const decoded = this.jwtService.decode(refreshToken) as { exp?: number };
    const expiresAt =
      decoded?.exp != null
        ? new Date(decoded.exp * 1000)
        : this.getFallbackRefreshExpiryDate();

    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenId,
        tokenHash: refreshTokenHash,
        expiresAt,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: this.buildUserResponse(user),
    };
  }

  private buildUserResponse(user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }

  private getRefreshSecret(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'default-refresh-secret'
    );
  }

  private getRefreshExpiry(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d'
    );
  }

  private getFallbackRefreshExpiryDate(): Date {
    const now = new Date();
    now.setDate(now.getDate() + 7);
    return now;
  }
}
