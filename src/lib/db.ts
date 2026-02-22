import { TemperatureRecord } from '@/types/temperature';
import { User } from '@/types/user';
import { sql } from '@vercel/postgres';

export async function createTableIfNotExists() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        provider VARCHAR(50) DEFAULT 'credentials',
        provider_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create temperature records table
    await sql`
      CREATE TABLE IF NOT EXISTS temperature_records (
        id SERIAL PRIMARY KEY,
        temperature DECIMAL(5,2) NOT NULL,
        date VARCHAR(20) NOT NULL,
        time VARCHAR(20) NOT NULL,
        location VARCHAR(50) NOT NULL,
        screenshot_url TEXT,
        user_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Migration: Add user_id column to existing tables if it doesn't exist
    await migrateTemperatureRecordsTable();
    await migrateTemperatureRecordsLocation();
    await migrateUsersTable();
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

export async function migrateTemperatureRecordsTable() {
  try {
    // Check if user_id column exists
    const result = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'temperature_records'
      AND column_name = 'user_id'
    `;

    if (result.rows.length === 0) {
      // Add user_id column as VARCHAR for Clerk user IDs
      await sql`
        ALTER TABLE temperature_records
        ADD COLUMN user_id VARCHAR(255)
      `;
    } else {
      // Check if column is INTEGER and needs migration to VARCHAR
      const columnType = result.rows[0].data_type;
      if (columnType === 'integer') {
        console.log(
          'Migrating user_id column from INTEGER to VARCHAR(255) for Clerk compatibility...',
        );
        // Drop the foreign key constraint if it exists, then alter the column type
        try {
          await sql`
            ALTER TABLE temperature_records 
            DROP CONSTRAINT IF EXISTS temperature_records_user_id_fkey
          `;
        } catch {
          // Constraint might not exist, continue
        }
        await sql`
          ALTER TABLE temperature_records
          ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR
        `;
        console.log('Migration complete: user_id column is now VARCHAR(255)');
      }
    }
  } catch (error) {
    console.error('Error migrating temperature_records table:', error);
    throw error;
  }
}

export async function migrateTemperatureRecordsLocation() {
  try {
    // Check if location column exists
    const result = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'temperature_records'
      AND column_name = 'location'
    `;

    if (result.rows.length === 0) {
      // Add location column
      await sql`
        ALTER TABLE temperature_records
        ADD COLUMN location VARCHAR(50) NOT NULL DEFAULT 'Küche'
      `;
    } else {
    }
  } catch (error) {
    console.error('Error migrating temperature_records location:', error);
    throw error;
  }
}

export async function migrateUsersTable() {
  try {
    // Check if provider column exists
    const result = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'provider'
    `;

    if (result.rows.length === 0) {
      await sql`
        ALTER TABLE users
        ADD COLUMN provider VARCHAR(50) DEFAULT 'credentials',
        ADD COLUMN provider_id VARCHAR(255)
      `;
      console.log('Migration complete: Added provider, provider_id to users');
    }
  } catch (error) {
    console.error('Error migrating users table:', error);
    throw error;
  }
}

export async function insertTemperatureRecord(
  record: Omit<TemperatureRecord, 'id' | 'createdAt'>,
  userId: string,
) {
  try {
    const result = await sql`
      INSERT INTO temperature_records (temperature, date, time, location, screenshot_url, user_id)
      VALUES (${record.temperature}, ${record.date}, ${record.time}, ${record.location}, ${record.screenshotUrl}, ${userId})
      RETURNING id, temperature, date, time, location, screenshot_url, created_at
    `;

    const newRecord = result.rows[0] as TemperatureRecord;
    return newRecord;
  } catch (error) {
    console.error(
      'Error inserting temperature record into Vercel Postgres:',
      error,
    );

    // Fallback: save to localStorage for development
    try {
      const existing = localStorage?.getItem('temperature_records');
      const records = existing ? JSON.parse(existing) : [];

      const newRecord: TemperatureRecord = {
        id: Date.now().toString(),
        temperature: record.temperature,
        date: record.date,
        time: record.time,
        location: record.location,
        screenshotUrl: record.screenshotUrl,
        createdAt: new Date(),
      };

      records.unshift(newRecord);
      localStorage?.setItem('temperature_records', JSON.stringify(records));
      return newRecord;
    } catch (localStorageError) {
      console.error('localStorage fallback failed:', localStorageError);
      throw error;
    }
  }
}

export async function getAllTemperatureRecords(): Promise<TemperatureRecord[]> {
  try {
    const result = await sql`
      SELECT id, temperature, date, time, location, screenshot_url, created_at
      FROM temperature_records
      ORDER BY created_at DESC
    `;

    const records = result.rows.map((row) => ({
      id: row.id.toString(),
      temperature: parseFloat(row.temperature),
      date: row.date,
      time: row.time,
      location: row.location,
      screenshotUrl: row.screenshot_url,
      createdAt: new Date(row.created_at),
    }));

    return records;
  } catch (error) {
    console.error(
      'Error fetching temperature records from Vercel Postgres:',
      error,
    );

    // Fallback: try to get from localStorage for development
    try {
      const stored = localStorage?.getItem('temperature_records');
      if (stored) {
        const records = JSON.parse(stored);
        return records;
      }
    } catch (localStorageError) {
      console.error('localStorage fallback failed:', localStorageError);
    }

    // If no fallback data, return empty array instead of throwing
    return [];
  }
}

export async function getTemperatureRecordsByUserId(
  userId: string,
): Promise<TemperatureRecord[]> {
  try {
    const result = await sql`
      SELECT id, temperature, date, time, location, screenshot_url, created_at
      FROM temperature_records
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    const records = result.rows.map((row) => ({
      id: row.id.toString(),
      temperature: parseFloat(row.temperature),
      date: row.date,
      time: row.time,
      location: row.location,
      screenshotUrl: row.screenshot_url,
      createdAt: new Date(row.created_at),
    }));

    return records;
  } catch (error) {
    console.error(
      'Error fetching temperature records for user from Vercel Postgres:',
      error,
    );

    // For development, return empty array if database fails
    return [];
  }
}

// User management functions
export async function createOrGetUser(
  name: string,
  email: string,
  provider: string = 'credentials',
  providerId?: string,
): Promise<User> {
  try {
    // First try to find existing user by email or provider ID
    let existingUser;

    if (providerId) {
      // For OAuth providers, try to find by provider ID first
      existingUser = await sql`
        SELECT id, name, email, created_at
        FROM users
        WHERE (email = ${email} OR (provider = ${provider} AND provider_id = ${providerId}))
      `;
    } else {
      // For credentials, find by email only
      existingUser = await sql`
        SELECT id, name, email, created_at
        FROM users
        WHERE email = ${email}
      `;
    }

    if (existingUser.rows.length > 0) {
      const row = existingUser.rows[0];
      return {
        id: row.id.toString(),
        name: row.name,
        email: row.email,
        createdAt: new Date(row.created_at),
      };
    }

    // Create new user if not found
    const result = await sql`
      INSERT INTO users (name, email, provider, provider_id)
      VALUES (${name}, ${email}, ${provider}, ${providerId || null})
      RETURNING id, name, email, created_at
    `;

    const row = result.rows[0];
    return {
      id: row.id.toString(),
      name: row.name,
      email: row.email,
      createdAt: new Date(row.created_at),
    };
  } catch (error) {
    console.error('Error creating/getting user:', error);
    throw error;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT id, name, email, created_at
      FROM users
      WHERE id = ${parseInt(id)}
    `;

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id.toString(),
      name: row.name,
      email: row.email,
      createdAt: new Date(row.created_at),
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

export async function getTemperatureRecordById(
  id: string,
): Promise<TemperatureRecord | null> {
  try {
    const result = await sql`
      SELECT id, temperature, date, time, location, screenshot_url, created_at
      FROM temperature_records
      WHERE id = ${parseInt(id)}
    `;

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id.toString(),
      temperature: parseFloat(row.temperature),
      date: row.date,
      time: row.time,
      location: row.location,
      screenshotUrl: row.screenshot_url,
      createdAt: new Date(row.created_at),
    };
  } catch (error) {
    console.error('Error fetching temperature record:', error);
    throw error;
  }
}

export async function deleteTemperatureRecord(id: string): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM temperature_records
      WHERE id = ${parseInt(id)}
    `;

    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error deleting temperature record:', error);
    throw error;
  }
}

export async function getTemperatureStats() {
  try {
    const result = await sql`
      SELECT
        COUNT(*) as total_records,
        AVG(temperature) as avg_temperature,
        MIN(temperature) as min_temperature,
        MAX(temperature) as max_temperature,
        COUNT(CASE WHEN screenshot_url IS NOT NULL THEN 1 END) as records_with_screenshots
      FROM temperature_records
    `;

    const row = result.rows[0];
    return {
      totalRecords: parseInt(row.total_records),
      avgTemperature: parseFloat(row.avg_temperature) || 0,
      minTemperature: parseFloat(row.min_temperature) || 0,
      maxTemperature: parseFloat(row.max_temperature) || 0,
      recordsWithScreenshots: parseInt(row.records_with_screenshots),
    };
  } catch (error) {
    console.error('Error fetching temperature stats:', error);
    throw error;
  }
}
