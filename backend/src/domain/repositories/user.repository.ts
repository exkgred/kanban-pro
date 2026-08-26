import type { PublicUser, User } from '../entities/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<User>;
  toPublic(user: User): PublicUser;
}
