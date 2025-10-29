import bcrypt from 'bcryptjs';

// Simple in-memory database for development
interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  walletAddress?: string;
  isVerified: boolean;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class SimpleDatabase {
  private users: User[] = [];

  async init() {
    // Create demo user with hashed password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const demoUser: User = {
      id: 'demo-user-1',
      email: 'demo@etheryte.com',
      username: 'demo',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      isVerified: true,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.push(demoUser);
    console.log('Database initialized with demo user');
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email) || null;
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.users.push(user);
    return user;
  }
}

export const simpleDb = new SimpleDatabase();