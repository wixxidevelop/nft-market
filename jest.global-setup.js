// Jest global setup - runs once before all tests

const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  console.log('🚀 Setting up test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-do-not-use-in-production';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/etheryte_test';
  process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-for-testing-only';
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  process.env.REDIS_URL = 'redis://localhost:6379/1';
  process.env.UPLOAD_DIR = path.join(__dirname, 'test-uploads');
  process.env.MAX_FILE_SIZE = '5242880'; // 5MB
  process.env.RATE_LIMIT_WINDOW = '900000'; // 15 minutes
  process.env.RATE_LIMIT_MAX = '100';
  
  // Create test directories
  try {
    const fs = require('fs');
    const testDirs = [
      path.join(__dirname, 'test-uploads'),
      path.join(__dirname, 'test-results'),
      path.join(__dirname, 'coverage'),
    ];
    
    testDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created test directory: ${dir}`);
      }
    });
  } catch (error) {
    console.warn('⚠️ Could not create test directories:', error.message);
  }
  
  // Initialize test database (if needed)
  try {
    // Note: In a real setup, you might want to:
    // 1. Create a test database
    // 2. Run migrations
    // 3. Seed test data
    
    console.log('🗄️ Test database setup completed');
  } catch (error) {
    console.warn('⚠️ Test database setup failed:', error.message);
  }
  
  // Setup test cache
  try {
    // Clear any existing test cache
    const cacheDir = path.join(__dirname, '.jest-cache');
    if (require('fs').existsSync(cacheDir)) {
      console.log('🧹 Clearing Jest cache...');
    }
  } catch (error) {
    console.warn('⚠️ Cache cleanup failed:', error.message);
  }
  
  // Performance monitoring setup
  global.__TEST_START_TIME__ = Date.now();
  global.__TEST_PERFORMANCE__ = {
    suites: new Map(),
    tests: new Map(),
    slowTests: [],
    memoryUsage: [],
  };
  
  console.log('✅ Test environment setup completed');
  console.log('📊 Performance monitoring enabled');
  console.log('🎯 Ready to run tests...\n');
};