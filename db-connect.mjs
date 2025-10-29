import { Client } from 'pg';

const connectionString = 'postgresql://neondb_owner:npg_5VwTUZNIlKt2@ep-snowy-mode-a4jhz0oo-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function connectToDatabase() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    console.log('Connecting to Neon database...');
    await client.connect();
    console.log('✅ Successfully connected to the database!');
    
    // Test the connection with a simple query
    const result = await client.query('SELECT version()');
    console.log('Database version:', result.rows[0].version);
    
    // Show current database and user
    const dbInfo = await client.query('SELECT current_database(), current_user');
    console.log('Current database:', dbInfo.rows[0].current_database);
    console.log('Current user:', dbInfo.rows[0].current_user);
    
    // List all tables in the current database
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Tables in the database:');
    if (tables.rows.length === 0) {
      console.log('No tables found in the public schema.');
    } else {
      tables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

connectToDatabase();