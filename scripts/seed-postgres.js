const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database seeding...');

    // Hash passwords
    const demoPassword = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    // Create demo user
    const demoUserQuery = `
      INSERT INTO "users" (id, email, username, password, "firstName", "lastName", "isVerified", "isAdmin", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        username = EXCLUDED.username,
        password = EXCLUDED.password,
        "updatedAt" = NOW()
      RETURNING *;
    `;

    const demoUser = await client.query(demoUserQuery, [
      'demo-user-1',
      'demo@etheryte.com',
      'demo_user',
      demoPassword,
      'Demo',
      'User',
      true,
      false
    ]);

    console.log('Demo user created:', demoUser.rows[0]);

    // Create admin user
    const adminUserQuery = `
      INSERT INTO "users" (id, email, username, password, "firstName", "lastName", "isVerified", "isAdmin", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        username = EXCLUDED.username,
        password = EXCLUDED.password,
        "updatedAt" = NOW()
      RETURNING *;
    `;

    const adminUser = await client.query(adminUserQuery, [
      'admin-user-1',
      'admin@etheryte.com',
      'admin',
      adminPassword,
      'Admin',
      'User',
      true,
      true
    ]);

    console.log('Admin user created:', adminUser.rows[0]);
    console.log('Database seeding completed successfully!');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seeding
seedDatabase().catch(console.error);