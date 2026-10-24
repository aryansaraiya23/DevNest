import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, IUser, SafeUser } from '../models/User';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { env } from '../config/env';

export interface TokenPayload {
  userId: string;
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class DuplicateEmailError extends Error {
  constructor(message = 'An account with this email address already exists.') {
    super(message);
    this.name = 'DuplicateEmailError';
  }
}

export class AuthService {
  private saltRounds = 10;
  private tokenExpirySeconds = 7 * 24 * 60 * 60; // 7 days in seconds

  /**
   * Hashes plaintext password securely using bcrypt
   */
  public async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verifies plaintext password against stored hash
   */
  public async verifyPassword(candidate: string, hash: string): Promise<boolean> {
    return bcrypt.compare(candidate, hash);
  }

  /**
   * Signs a JWT with the user's ID
   */
  public signToken(userId: string): string {
    return jwt.sign({ userId } as TokenPayload, env.JWT_SECRET, {
      expiresIn: this.tokenExpirySeconds,
    });
  }

  /**
   * Verifies a JWT and extracts payload
   */
  public verifyToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
      if (!decoded || !decoded.userId) {
        throw new AuthenticationError('Invalid token payload');
      }
      return decoded;
    } catch {
      throw new AuthenticationError('Session token is missing, invalid, or expired.');
    }
  }

  /**
   * Registers a new user account
   */
  public async register(input: RegisterInput): Promise<{ user: SafeUser; token: string }> {
    const normalizedEmail = input.email.trim().toLowerCase();

    // Check existing
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw new DuplicateEmailError();
    }

    const passwordHash = await this.hashPassword(input.password);

    try {
      const newUser = new User({
        name: input.name.trim(),
        email: normalizedEmail,
        passwordHash,
      });

      await newUser.save();

      const safeUser = newUser.toSafeObject();
      const token = this.signToken(safeUser.id);

      return { user: safeUser, token };
    } catch (err: any) {
      if (err.code === 11000) {
        throw new DuplicateEmailError();
      }
      throw err;
    }
  }

  /**
   * Authenticates user with email and password
   */
  public async login(input: LoginInput): Promise<{ user: SafeUser; token: string }> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Use generic error message to prevent account enumeration
      throw new AuthenticationError('Invalid email or password.');
    }

    const isValidPassword = await user.comparePassword(input.password);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password.');
    }

    const safeUser = user.toSafeObject();
    const token = this.signToken(safeUser.id);

    return { user: safeUser, token };
  }

  /**
   * Retrieves user profile by ID
   */
  public async getUserById(userId: string): Promise<SafeUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AuthenticationError('User profile not found.');
    }
    return user.toSafeObject();
  }
}

export const authService = new AuthService();
