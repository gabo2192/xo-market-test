import { Inject } from '@nestjs/common';
import { createDrizzlePool } from '@workspace/database';
import { config } from 'dotenv';

config();

export const DATABASE_PROVIDER = 'DatabaseProvider';

export const InjectDatabase = () => Inject(DATABASE_PROVIDER);

export const databaseProvider = {
  provide: DATABASE_PROVIDER,
  useFactory: () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    console.log(
      'Creating database connection with URL:',
      databaseUrl.replace(/:[^@]*@/, ':***@'),
    );

    return createDrizzlePool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  },
};
