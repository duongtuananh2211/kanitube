import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;

async function migrate() {
  const sql = postgres(connectionString, { max: 1 });
  
  console.log('🚀 Starting migration...');
  
  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'drizzle', '0000_vengeful_vengeance.sql');
    const migrationSql = readFileSync(migrationPath, 'utf8');
    
    // Split by statement-breakpoint and execute each
    const statements = migrationSql.split('--> statement-breakpoint');
    
    for (const statement of statements) {
      if (statement.trim()) {
        await sql.unsafe(statement);
      }
    }
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
