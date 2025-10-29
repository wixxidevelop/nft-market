import bcrypt from 'bcryptjs';

// Mock database interfaces
export interface User {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CryptoHolding {
  id: number;
  user_id: number;
  symbol: string;
  name: string;
  amount: number;
  current_price: number;
  last_updated: Date;
}

export interface Transaction {
  id: number;
  user_id: number;
  type: 'deposit' | 'withdraw' | 'mint' | 'transfer' | 'trade';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: Date;
}

// Mock data storage
let users: User[] = [
  {
    id: 1,
    email: 'demo@etheryte.com',
    username: 'demo_user',
    password_hash: '$2b$10$19Bih1XldhnS4/RWjzDRReyTKLUbsdhXQ0liGLmIHT7T8v.FPIowq', // 'password123'
    first_name: 'Demo',
    last_name: 'User',
    is_verified: true,
    created_at: new Date(),
    updated_at: new Date()
  }
];

let cryptoHoldings: CryptoHolding[] = [
  {
    id: 1,
    user_id: 1,
    symbol: 'ETH',
    name: 'Ethereum',
    amount: 2.45678900,
    current_price: 3456.78,
    last_updated: new Date()
  },
  {
    id: 2,
    user_id: 1,
    symbol: 'BTC',
    name: 'Bitcoin',
    amount: 0.12345678,
    current_price: 67890.12,
    last_updated: new Date()
  },
  {
    id: 3,
    user_id: 1,
    symbol: 'USDC',
    name: 'USD Coin',
    amount: 1250.00000000,
    current_price: 1.00,
    last_updated: new Date()
  }
];

let transactions: Transaction[] = [];
let nextUserId = 2;
let nextTransactionId = 1;

// Mock Database Service
export class MockDatabase {
  // User operations
  async findUserByEmail(email: string): Promise<User | null> {
    return users.find(user => user.email === email) || null;
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return users.find(user => user.username === username) || null;
  }

  async findUserById(id: number): Promise<User | null> {
    return users.find(user => user.id === id) || null;
  }

  async createUser(userData: {
    email: string;
    username: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const newUser: User = {
      id: nextUserId++,
      email: userData.email,
      username: userData.username,
      password_hash: hashedPassword,
      first_name: userData.first_name,
      last_name: userData.last_name,
      is_verified: false,
      created_at: new Date(),
      updated_at: new Date()
    };

    users.push(newUser);
    return newUser;
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;

    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updated_at: new Date()
    };

    return users[userIndex];
  }

  // Crypto holdings operations
  async getCryptoHoldingsByUserId(userId: number): Promise<CryptoHolding[]> {
    return cryptoHoldings.filter(holding => holding.user_id === userId);
  }

  async getTotalBalance(userId: number): Promise<number> {
    const holdings = await this.getCryptoHoldingsByUserId(userId);
    return holdings.reduce((total, holding) => {
      return total + (holding.amount * holding.current_price);
    }, 0);
  }

  // Transaction operations
  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return transactions.filter(tx => tx.user_id === userId);
  }

  async createTransaction(txData: {
    user_id: number;
    type: Transaction['type'];
    amount: number;
    currency: string;
  }): Promise<Transaction> {
    const newTransaction: Transaction = {
      id: nextTransactionId++,
      user_id: txData.user_id,
      type: txData.type,
      amount: txData.amount,
      currency: txData.currency,
      status: 'pending',
      created_at: new Date()
    };

    transactions.push(newTransaction);
    return newTransaction;
  }

  // Portfolio statistics
  async getPortfolioStats(userId: number): Promise<{
    totalNFTs: number;
    totalSales: number;
    activeListings: number;
  }> {
    // Mock portfolio statistics
    return {
      totalNFTs: 12,
      totalSales: 8,
      activeListings: 3
    };
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    return true;
  }
}

// Export singleton instance
export const mockDb = new MockDatabase();