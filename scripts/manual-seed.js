const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new sqlite3.Database(dbPath);

async function seedDatabase() {
  try {
    // Hash passwords
    const demoPassword = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    // Insert demo user
    db.run(`
      INSERT OR REPLACE INTO User (id, email, username, password, isAdmin, createdAt, updatedAt) 
      VALUES (1, 'demo@etheryte.com', 'demo_user', ?, 0, datetime('now'), datetime('now'))
    `, [demoPassword], function(err) {
      if (err) {
        console.error('Error inserting demo user:', err);
      } else {
        console.log('Demo user created with ID:', this.lastID);
      }
    });

    // Insert admin user
    db.run(`
      INSERT OR REPLACE INTO User (id, email, username, password, isAdmin, createdAt, updatedAt) 
      VALUES (2, 'admin@etheryte.com', 'admin', ?, 1, datetime('now'), datetime('now'))
    `, [adminPassword], function(err) {
      if (err) {
        console.error('Error inserting admin user:', err);
      } else {
        console.log('Admin user created with ID:', this.lastID);
      }
    });

    // Close database connection after a delay
    setTimeout(() => {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database seeding completed successfully');
        }
      });
    }, 1000);

  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();