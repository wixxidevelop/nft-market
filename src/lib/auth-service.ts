import { mockDb, User } from './mock-db';
import { LoginCredentials, SignupCredentials, AuthResponse, AuthError } from '../types/auth';

export class AuthService {
  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Find user by email or username
      let user = await mockDb.findUserByEmail(credentials.email);
      if (!user) {
        user = await mockDb.findUserByUsername(credentials.email);
      }

      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Verify password
      const isValidPassword = await mockDb.verifyPassword(credentials.password, user.password_hash);
      if (!isValidPassword) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Create session token (mock)
      const sessionToken = this.generateSessionToken();
      
      // Store session in localStorage (client-side)
      const userSession = {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        token: sessionToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      return {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id.toString(),
          email: user.email,
          username: user.username,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        token: sessionToken
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'An error occurred during login'
      };
    }
  }

  // Register new user
  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUserByEmail = await mockDb.findUserByEmail(credentials.email);
      if (existingUserByEmail) {
        return {
          success: false,
          message: 'An account with this email already exists'
        };
      }

      const existingUserByUsername = await mockDb.findUserByUsername(credentials.username);
      if (existingUserByUsername) {
        return {
          success: false,
          message: 'This username is already taken'
        };
      }

      // Create new user
      const newUser = await mockDb.createUser({
        email: credentials.email,
        username: credentials.username,
        password: credentials.password,
        first_name: credentials.firstName || '',
        last_name: credentials.lastName || ''
      });

      // Generate session token
      const sessionToken = this.generateSessionToken();

      return {
        success: true,
        message: 'Account created successfully',
        user: {
          id: newUser.id.toString(),
          email: newUser.email,
          username: newUser.username,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        token: sessionToken
      };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: 'An error occurred during registration'
      };
    }
  }

  // Reset password
  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const user = await mockDb.findUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists for security
        return { 
          success: true,
          message: 'If an account with this email exists, a reset link has been sent'
        };
      }

      // In a real app, you would send an email with reset link
      console.log(`Password reset link sent to ${email}`);
      
      return { 
        success: true,
        message: 'If an account with this email exists, a reset link has been sent'
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: 'An error occurred while processing your request'
      };
    }
  }

  // Verify session token
  async verifyToken(token: string): Promise<User | null> {
    try {
      // In a real app, you would verify the JWT token
      // For now, we'll just check if it's a valid format
      if (!token || token.length < 10) {
        return null;
      }

      // Mock verification - in real app, decode JWT and get user ID
      const userId = 1; // Mock user ID
      return await mockDb.findUserById(userId);
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  // Get user profile
  async getUserProfile(userId: number): Promise<User | null> {
    try {
      return await mockDb.findUserById(userId);
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  // Generate session token (mock implementation)
  private generateSessionToken(): string {
    return 'mock_token_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Logout (client-side operation)
  logout(): void {
    // Clear session data from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  }
}

// Export singleton instance
export const authService = new AuthService();