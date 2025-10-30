const { Client } = require('pg');

async function testConnection() {
  // Try connection without SSL first (for development)
  const connectionString = process.env.DATABASE_URL || 'postgres://username:password@localhost:5432/database';
  
  console.log('🔄 Testing connection without SSL...');
  
  const client = new Client({
    connectionString: connectionString,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully without SSL!');
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('📊 Database info:');
    console.log(`   Current time: ${result.rows[0].current_time}`);
    console.log(`   Database version: ${result.rows[0].db_version}`);
    
    await client.end();
    console.log('🔌 Connection closed');
    
  } catch (error) {
    console.log('❌ Connection without SSL failed:', error.message);
    
    // Try with SSL
    console.log('🔄 Trying connection with SSL...');
    
    const sslClient = new Client({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    try {
      await sslClient.connect();
      console.log('✅ Connected successfully with SSL!');
      
      // Test query
      const result = await sslClient.query('SELECT NOW() as current_time, version() as db_version');
      console.log('📊 Database info:');
      console.log(`   Current time: ${result.rows[0].current_time}`);
      console.log(`   Database version: ${result.rows[0].db_version}`);
      
      await sslClient.end();
      console.log('🔌 Connection closed');
      
    } catch (sslError) {
      console.log('❌ Connection with SSL also failed:', sslError.message);
      console.log('💡 Please check your DATABASE_URL environment variable');
    }
  }
}

testConnection();