import { z } from 'zod';

// Legacy validation interfaces (keeping for backward compatibility)
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
  message: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule[];
}

export interface ValidationErrors {
  [key: string]: string;
}

export const validateField = (value: string, rules: ValidationRule[]): string | null => {
  for (const rule of rules) {
    if (rule.required && (!value || value.trim() === '')) {
      return rule.message;
    }
    
    if (value && rule.minLength && value.length < rule.minLength) {
      return rule.message;
    }
    
    if (value && rule.maxLength && value.length > rule.maxLength) {
      return rule.message;
    }
    
    if (value && rule.pattern && !rule.pattern.test(value)) {
      return rule.message;
    }
    
    if (value && rule.custom && !rule.custom(value)) {
      return rule.message;
    }
  }
  
  return null;
};

export const validateForm = (data: Record<string, string>, rules: ValidationRules): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  Object.keys(rules).forEach(field => {
    const fieldValue = data[field] || '';
    const fieldRules = rules[field];
    const error = validateField(fieldValue, fieldRules);
    
    if (error) {
      errors[field] = error;
    }
  });
  
  return errors;
};

// Common validation rules
export const commonRules = {
  email: [
    { required: true, message: 'Email is required' },
    { 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
      message: 'Please enter a valid email address' 
    }
  ],
  password: [
    { required: true, message: 'Password is required' },
    { minLength: 8, message: 'Password must be at least 8 characters long' },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }
  ],
  username: [
    { required: true, message: 'Username is required' },
    { minLength: 3, message: 'Username must be at least 3 characters long' },
    { maxLength: 20, message: 'Username must be less than 20 characters' },
    {
      pattern: /^[a-zA-Z0-9_]+$/,
      message: 'Username can only contain letters, numbers, and underscores'
    }
  ]
};

// Modern Zod validation schemas for API endpoints
export const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

export const userLoginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export const userUpdateSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address').optional(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isSuspended: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
});

// Password reset schemas
export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
});

// Email verification schema
export const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// Admin user schemas
export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const adminUserUpdateSchema = z.object({
  isActive: z.boolean().optional(),
  isSuspended: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  isAdmin: z.boolean().optional(),
});

export const nftCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  image: z.string().url('Invalid image URL'),
  price: z.number().positive('Price must be positive'),
  category: z.enum(['Art', 'Music', 'Photography', 'Gaming', 'Sports', 'Collectibles', 'Utility', 'Other']),
  collectionId: z.string().uuid('Invalid collection ID').optional(),
});

export const nftUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  price: z.number().positive('Price must be positive').optional(),
  isListed: z.boolean().optional(),
});

export const collectionCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  image: z.string().url('Invalid image URL').optional(),
  banner: z.string().url('Invalid banner URL').optional(),
});

export const collectionUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  image: z.string().url('Invalid image URL').optional(),
  banner: z.string().url('Invalid banner URL').optional(),
  isVerified: z.boolean().optional(),
});

export const transactionCreateSchema = z.object({
  nftId: z.string().uuid('Invalid NFT ID'),
  userId: z.string().uuid('Invalid user ID'),
  amount: z.number().positive('Amount must be positive'),
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash'),
  type: z.enum(['SALE', 'MINT', 'TRANSFER', 'AUCTION']),
});

export const auctionCreateSchema = z.object({
  nftId: z.string().uuid('Invalid NFT ID'),
  startingPrice: z.number().positive('Starting price must be positive'),
  reservePrice: z.number().positive('Reserve price must be positive').optional(),
  duration: z.number().min(1, 'Duration must be at least 1 hour').max(168, 'Duration cannot exceed 168 hours'),
});

export const bidCreateSchema = z.object({
  auctionId: z.string().uuid('Invalid auction ID'),
  amount: z.number().positive('Bid amount must be positive'),
});

export const paginationSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1').default(1),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Query must be less than 100 characters'),
  category: z.enum(['Art', 'Music', 'Photography', 'Gaming', 'Sports', 'Collectibles', 'Utility', 'Other']).optional(),
  minPrice: z.number().min(0, 'Minimum price cannot be negative').optional(),
  maxPrice: z.number().min(0, 'Maximum price cannot be negative').optional(),
  isVerified: z.boolean().optional(),
});

// Validation helper function
export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
};

// Type exports
export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type NFTCreate = z.infer<typeof nftCreateSchema>;
export type NFTUpdate = z.infer<typeof nftUpdateSchema>;
export type CollectionCreate = z.infer<typeof collectionCreateSchema>;
export type TransactionCreate = z.infer<typeof transactionCreateSchema>;
export type AuctionCreate = z.infer<typeof auctionCreateSchema>;
export type BidCreate = z.infer<typeof bidCreateSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type SearchQuery = z.infer<typeof searchSchema>;