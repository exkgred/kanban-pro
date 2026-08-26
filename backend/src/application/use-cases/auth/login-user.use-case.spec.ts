import { LoginUserUseCase } from './login-user.use-case';
import { UnauthorizedError } from '../../../domain/errors/domain-error';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository';
import { PasswordHasher, TokenService } from '../../interfaces/auth.interfaces';
import { User, PublicUser } from '../../../domain/entities/user.entity';

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase;
  let userRepo: jest.Mocked<UserRepository>;
  let refreshTokenRepo: jest.Mocked<RefreshTokenRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    userRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      toPublic: jest.fn(),
    };

    refreshTokenRepo = {
      create: jest.fn(),
      findValidByHash: jest.fn(),
      revoke: jest.fn(),
      revokeAllForUser: jest.fn(),
    };

    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    tokenService = {
      signAccess: jest.fn(),
      signRefresh: jest.fn(),
      verifyAccess: jest.fn(),
      verifyRefresh: jest.fn(),
      hashToken: jest.fn(),
    };

    useCase = new LoginUserUseCase(
      userRepo,
      refreshTokenRepo,
      passwordHasher,
      tokenService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should login with valid credentials and return tokens and user', async () => {
    const mockUser: User = {
      id: '1',
      name: 'Test',
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockPublicUser: PublicUser = {
      id: '1',
      name: 'Test',
      email: 'test@example.com',
      createdAt: mockUser.createdAt,
      updatedAt: mockUser.updatedAt,
    };

    userRepo.findByEmail.mockResolvedValue(mockUser);
    passwordHasher.compare.mockResolvedValue(true);
    userRepo.toPublic.mockReturnValue(mockPublicUser);

    tokenService.signAccess.mockResolvedValue('access_token');
    tokenService.signRefresh.mockResolvedValue('refresh_token');
    tokenService.hashToken.mockReturnValue('hashed_refresh_token');
    refreshTokenRepo.create.mockResolvedValue(undefined);

    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(userRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(passwordHasher.compare).toHaveBeenCalledWith(
      'password123',
      'hashed_password',
    );

    expect(tokenService.signAccess).toHaveBeenCalledWith({
      sub: '1',
      email: 'test@example.com',
      name: 'Test',
    });
    expect(tokenService.signRefresh).toHaveBeenCalledWith({ sub: '1' });
    expect(refreshTokenRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '1',
        tokenHash: 'hashed_refresh_token',
      }),
    );

    expect(result.user).toEqual(mockPublicUser);
    expect(result.tokens).toEqual({
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
    });
  });

  it('should throw UnauthorizedError if email not found', async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        email: 'test@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(UnauthorizedError);

    expect(passwordHasher.compare).not.toHaveBeenCalled();
    expect(tokenService.signAccess).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedError if password is invalid', async () => {
    const mockUser: User = {
      id: '1',
      name: 'Test',
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    userRepo.findByEmail.mockResolvedValue(mockUser);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({
        email: 'test@example.com',
        password: 'wrong_password',
      }),
    ).rejects.toThrow(UnauthorizedError);

    expect(tokenService.signAccess).not.toHaveBeenCalled();
  });
});
