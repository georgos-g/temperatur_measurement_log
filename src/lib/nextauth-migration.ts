import { sql } from '@vercel/postgres';

export async function createNextAuthTables() {
  try {
    console.log('Creating NextAuth tables...');

    // Create accounts table
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        type VARCHAR(255) NOT NULL,
        provider VARCHAR(255) NOT NULL,
        "providerAccountId" VARCHAR(255) NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type VARCHAR(255),
        scope VARCHAR(255),
        id_token TEXT,
        session_state VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT accounts_provider_providerAccountId_key UNIQUE (provider, "providerAccountId")
      )
    `;

    // Create sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        "sessionToken" VARCHAR(255) UNIQUE NOT NULL,
        "userId" INTEGER NOT NULL,
        expires TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create verification_tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires TIMESTAMP WITH TIME ZONE NOT NULL,
        PRIMARY KEY (identifier, token)
      )
    `;

    // Add foreign key constraints if they don't exist
    try {
      await sql`
        ALTER TABLE accounts 
        ADD CONSTRAINT accounts_userId_fkey 
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
      `;
    } catch (error: any) {
      if (!error.message?.includes('already exists')) {
        throw error;
      }
      console.log('Foreign key constraint already exists for accounts table');
    }

    try {
      await sql`
        ALTER TABLE sessions 
        ADD CONSTRAINT sessions_userId_fkey 
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
      `;
    } catch (error: any) {
      if (!error.message?.includes('already exists')) {
        throw error;
      }
      console.log('Foreign key constraint already exists for sessions table');
    }

    console.log('NextAuth tables created successfully');
  } catch (error) {
    console.error('Error creating NextAuth tables:', error);
    throw error;
  }
}

export async function migrateExistingUsersToNextAuth() {
  try {
    console.log('Migrating existing users to NextAuth...');

    // Get all existing users
    const existingUsers = await sql`
      SELECT id, name, email, created_at
      FROM users
    `;

    console.log(`Found ${existingUsers.rows.length} existing users`);

    // For each existing user, create a credentials account entry
    for (const user of existingUsers.rows) {
      try {
        // Check if account already exists
        const existingAccount = await sql`
          SELECT id FROM accounts 
          WHERE "userId" = ${user.id} AND provider = 'credentials'
        `;

        if (existingAccount.rows.length === 0) {
          // Create credentials account for existing user
          await sql`
            INSERT INTO accounts (
              "userId", 
              type, 
              provider, 
              "providerAccountId",
              created_at,
              updated_at
            ) VALUES (
              ${user.id},
              'credentials',
              'credentials',
              ${user.email},
              ${user.created_at},
              CURRENT_TIMESTAMP
            )
          `;
          console.log(`Created NextAuth account for user: ${user.email}`);
        } else {
          console.log(`Account already exists for user: ${user.email}`);
        }
      } catch (userError) {
        console.error(`Error migrating user ${user.email}:`, userError);
        // Continue with other users
      }
    }

    console.log('User migration completed');
  } catch (error) {
    console.error('Error migrating users to NextAuth:', error);
    throw error;
  }
}

export async function runNextAuthMigration() {
  try {
    await createNextAuthTables();
    await migrateExistingUsersToNextAuth();
    console.log('NextAuth migration completed successfully');
  } catch (error) {
    console.error('NextAuth migration failed:', error);
    throw error;
  }
}
