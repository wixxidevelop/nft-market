import { db } from './db';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Test connection by attempting a simple query
    try {
      await db.query('SELECT 1');
      console.log('✓ Database connection successful');
    } catch (error) {
      throw new Error('Failed to connect to database: ' + error);
    }

    // Read and execute schema
    const schemaPath = join(process.cwd(), 'src', 'lib', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      try {
        await db.query(statement);
        console.log('✓ Executed:', statement.substring(0, 50) + '...');
      } catch (error) {
        console.error('Error executing statement:', statement.substring(0, 50) + '...');
        console.error(error);
      }
    }

    console.log('✅ Database setup completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return false;
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}