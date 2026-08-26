import { RegisterUserUseCase } from './register-user.use-case';
import { ConflictError } from '../../../domain/errors/domain-error';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository';
import { PasswordHasher, TokenService } from '../../interfaces/auth.interfaces';
import { User, PublicUser } from '../../../domain/entities/user.entity';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
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

    useCase = new RegisterUserUseCase(
      userRepo,
      refreshTokenRepo,
      passwordHasher,
      tokenService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should register a user with valid data and return user without passwordHash', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('hashed_password');

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

    userRepo.create.mockResolvedValue(mockUser);
    userRepo.toPublic.mockReturnValue(mockPublicUser);

    tokenService.signAccess.mockResolvedValue('access_token');
    tokenService.signRefresh.mockResolvedValue('refresh_token');
    tokenService.hashToken.mockReturnValue('hashed_refresh_token');
    refreshTokenRepo.create.mockResolvedValue(undefined);

    const result = await useCase.execute({
      name: 'Test',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(userRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(passwordHasher.hash).toHaveBeenCalledWith('password123');
    expect(userRepo.create).toHaveBeenCalledWith({
      name: 'Test',
      email: 'test@example.com',
      passwordHash: 'hashed_password',
    });

    expect(tokenService.signAccess).toHaveBeenCalledWith({
      sub: '1',
      email: 'test@example.com',
      name: 'Test',
    });
    expect(tokenService.signRefresh).toHaveBeenCalledWith({ sub: '1' });
    expect(tokenService.hashToken).toHaveBeenCalledWith('refresh_token');
    expect(refreshTokenRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '1',
        tokenHash: 'hashed_refresh_token',
        expiresAt: expect.any(Date),
      }),
    );

    expect(result.user).toEqual(mockPublicUser);
    expect(result.tokens).toEqual({
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
    });
  });

  it('should throw ConflictError if email already exists', async () => {
    userRepo.findByEmail.mockResolvedValue({} as User); // existing user

    await expect(
      useCase.execute({
        name: 'Test',
        email: 'test@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictError);

    expect(userRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(userRepo.create).not.toHaveBeenCalled();
  });
});
