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
        screenshot_url TEXT,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

export async function insertTemperatureRecord(
  record: Omit<TemperatureRecord, 'id' | 'createdAt'>,
  userId?: string
) {
  try {
    console.log('Attempting to insert into Vercel Postgres...');
    const result = await sql`
      INSERT INTO temperature_records (temperature, date, time, screenshot_url, user_id)
      VALUES (${record.temperature}, ${record.date}, ${record.time}, ${
      record.screenshotUrl
    }, ${userId ? parseInt(userId) : null})
      RETURNING id, temperature, date, time, screenshot_url, created_at
    `;

    const newRecord = result.rows[0] as TemperatureRecord;
    console.log('Record inserted into Vercel Postgres:', newRecord);
    return newRecord;
  } catch (error) {
    console.error(
      'Error inserting temperature record into Vercel Postgres:',
      error
    );

    // Fallback: save to localStorage for development
    try {
      console.log('Falling back to localStorage...');
      const existing = localStorage?.getItem('temperature_records');
      const records = existing ? JSON.parse(existing) : [];

      const newRecord: TemperatureRecord = {
        id: Date.now().toString(),
        temperature: record.temperature,
        date: record.date,
        time: record.time,
        screenshotUrl: record.screenshotUrl,
        createdAt: new Date(),
      };

      records.unshift(newRecord);
      localStorage?.setItem('temperature_records', JSON.stringify(records));
      console.log('Record saved to localStorage:', newRecord);
      return newRecord;
    } catch (localStorageError) {
      console.error('localStorage fallback failed:', localStorageError);
      throw error;
    }
  }
}

export async function getAllTemperatureRecords(): Promise<TemperatureRecord[]> {
  try {
    console.log('Attempting to fetch from Vercel Postgres...');
    const result = await sql`
      SELECT id, temperature, date, time, screenshot_url, created_at
      FROM temperature_records
      ORDER BY created_at DESC
    `;
    console.log('Vercel Postgres query result:', result);

    const records = result.rows.map((row) => ({
      id: row.id.toString(),
      temperature: parseFloat(row.temperature),
      date: row.date,
      time: row.time,
      screenshotUrl: row.screenshot_url,
      createdAt: new Date(row.created_at),
    }));

    console.log('Mapped records:', records);
    return records;
  } catch (error) {
    console.error(
      'Error fetching temperature records from Vercel Postgres:',
      error
    );

    // Fallback: try to get from localStorage for development
    try {
      console.log('Trying fallback to localStorage...');
      const stored = localStorage?.getItem('temperature_records');
      if (stored) {
        const records = JSON.parse(stored);
        console.log('Fallback records from localStorage:', records);
        return records;
      }
    } catch (localStorageError) {
      console.error('localStorage fallback failed:', localStorageError);
    }

    // If no fallback data, return empty array instead of throwing
    console.log('No data available, returning empty array');
    return [];
  }
}

export async function getTemperatureRecordsByUserId(
  userId: string
): Promise<TemperatureRecord[]> {
  try {
    console.log('Attempting to fetch user records from Vercel Postgres...');
    const result = await sql`
      SELECT id, temperature, date, time, screenshot_url, created_at
      FROM temperature_records
      WHERE user_id = ${parseInt(userId)}
      ORDER BY created_at DESC
    `;
    console.log('Vercel Postgres query result for user:', result);

    const records = result.rows.map((row) => ({
      id: row.id.toString(),
      temperature: parseFloat(row.temperature),
      date: row.date,
      time: row.time,
      screenshotUrl: row.screenshot_url,
      createdAt: new Date(row.created_at),
    }));

    console.log('Mapped user records:', records);
    return records;
  } catch (error) {
    console.error(
      'Error fetching temperature records for user from Vercel Postgres:',
      error
    );

    // For development, return empty array if database fails
    console.log('Database error, returning empty array');
    return [];
  }
}

// User management functions
export async function createOrGetUser(
  name: string,
  email: string
): Promise<User> {
  try {
    // First try to find existing user
    const existingUser = await sql`
      SELECT id, name, email, created_at
      FROM users
      WHERE email = ${email}
    `;

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
      INSERT INTO users (name, email)
      VALUES (${name}, ${email})
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
  id: string
): Promise<TemperatureRecord | null> {
  try {
    const result = await sql`
      SELECT id, temperature, date, time, screenshot_url, created_at
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
