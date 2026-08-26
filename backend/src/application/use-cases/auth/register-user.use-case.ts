import { Inject, Injectable } from '@nestjs/common';
import {
  PASSWORD_HASHER,
  TOKEN_SERVICE,
  type PasswordHasher,
  type TokenPair,
  type TokenService,
} from '../../interfaces/auth.interfaces';
import type { PublicUser } from '../../../domain/entities/user.entity';
import { ConflictError } from '../../../domain/errors/domain-error';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '../../../domain/repositories/refresh-token.repository';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../domain/repositories/user.repository';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface RegisterUserOutput {
  user: PublicUser;
  tokens: TokenPair;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: RefreshTokenRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.userRepo.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    const tokens = await this.issueTokens(user.id, user.email, user.name);
    return { user: this.userRepo.toPublic(user), tokens };
  }

  private async issueTokens(
    userId: string,
    email: string,
    name: string,
  ): Promise<TokenPair> {
    const accessToken = await this.tokenService.signAccess({
      sub: userId,
      email,
      name,
    });
    const refreshToken = await this.tokenService.signRefresh({ sub: userId });
    await this.refreshTokenRepo.create({
      userId,
      tokenHash: this.tokenService.hashToken(refreshToken),
      expiresAt: refreshExpiresAt(),
    });
    return { accessToken, refreshToken };
  }
}

function refreshExpiresAt(): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  return expires;
}
