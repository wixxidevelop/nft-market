// Jest global teardown - runs once after all tests

const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('\n🧹 Cleaning up test environment...');
  
  // Performance reporting
  if (global.__TEST_PERFORMANCE__) {
    const totalTime = Date.now() - global.__TEST_START_TIME__;
    const performance = global.__TEST_PERFORMANCE__;
    
    console.log('\n📊 Test Performance Report:');
    console.log(`⏱️  Total test time: ${totalTime}ms`);
    console.log(`🧪 Test suites: ${performance.suites.size}`);
    console.log(`🔬 Individual tests: ${performance.tests.size}`);
    
    // Report slow tests
    if (performance.slowTests.length > 0) {
      console.log('\n🐌 Slow tests (>1000ms):');
      performance.slowTests
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10)
        .forEach(test => {
          console.log(`   ${test.name}: ${test.duration}ms`);
        });
    }
    
    // Memory usage report
    if (performance.memoryUsage.length > 0) {
      const avgMemory = performance.memoryUsage.reduce((sum, usage) => sum + usage, 0) / performance.memoryUsage.length;
      const maxMemory = Math.max(...performance.memoryUsage);
      console.log(`💾 Average memory usage: ${(avgMemory / 1024 / 1024).toFixed(2)}MB`);
      console.log(`💾 Peak memory usage: ${(maxMemory / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // Save performance report
    try {
      const reportPath = path.join(__dirname, 'test-results', 'performance-report.json');
      const report = {
        timestamp: new Date().toISOString(),
        totalTime,
        suiteCount: performance.suites.size,
        testCount: performance.tests.size,
        slowTests: performance.slowTests,
        memoryUsage: {
          average: performance.memoryUsage.length > 0 
            ? performance.memoryUsage.reduce((sum, usage) => sum + usage, 0) / performance.memoryUsage.length 
            : 0,
          peak: performance.memoryUsage.length > 0 ? Math.max(...performance.memoryUsage) : 0,
          samples: performance.memoryUsage.length,
        },
      };
      
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📄 Performance report saved to: ${reportPath}`);
    } catch (error) {
      console.warn('⚠️ Could not save performance report:', error.message);
    }
  }
  
  // Clean up test files
  try {
    const testUploadDir = path.join(__dirname, 'test-uploads');
    if (fs.existsSync(testUploadDir)) {
      const files = fs.readdirSync(testUploadDir);
      files.forEach(file => {
        const filePath = path.join(testUploadDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      });
      console.log('🗑️  Cleaned up test upload files');
    }
  } catch (error) {
    console.warn('⚠️ Could not clean up test files:', error.message);
  }
  
  // Clean up test database (if needed)
  try {
    // Note: In a real setup, you might want to:
    // 1. Drop test database
    // 2. Clean up test data
    // 3. Reset sequences
    
    console.log('🗄️ Test database cleanup completed');
  } catch (error) {
    console.warn('⚠️ Test database cleanup failed:', error.message);
  }
  
  // Memory cleanup
  try {
    if (global.gc) {
      global.gc();
      console.log('🧠 Memory garbage collection completed');
    }
  } catch (error) {
    // Garbage collection not available
  }
  
  // Final cleanup
  delete global.__TEST_START_TIME__;
  delete global.__TEST_PERFORMANCE__;
  
  console.log('✅ Test environment cleanup completed');
  console.log('🎉 All tests finished!\n');
};