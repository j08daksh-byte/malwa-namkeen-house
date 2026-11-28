/**
 * Malwa Namkeen House — E2E Test Database Isolation & Safety Guard
 *
 * Enforces strict boundaries to ensure live E2E test suites NEVER execute
 * against the production database or touch production records.
 */

import mongoose from 'mongoose';
import {
  KNOWN_PRODUCTION_DB_NAMES,
  validateTestDatabaseName,
  validateTestConnectionConfig,
  getEffectiveMongoConfig,
  getEffectiveDatabaseName,
  extractDatabaseNameFromUri,
  type DatabaseGuardValidation,
  type TestConnectionValidation,
  type EffectiveMongoConfig,
} from '../server/lib/dbGuard.ts';

export {
  KNOWN_PRODUCTION_DB_NAMES,
  validateTestDatabaseName,
  validateTestConnectionConfig,
  getEffectiveMongoConfig,
  getEffectiveDatabaseName,
  extractDatabaseNameFromUri,
  type DatabaseGuardValidation,
  type TestConnectionValidation,
  type EffectiveMongoConfig,
};

/**
 * Throws immediately if the current process environment is not safely configured for testing.
 * Strictly verifies MONGODB_TEST_URI, MONGODB_TEST_DB_NAME, and embedded URI database matching.
 */
export function assertSafeTestDatabaseEnvironment(): string {
  const validation = validateTestConnectionConfig({
    testUri: process.env.MONGODB_TEST_URI,
    prodUri: process.env.MONGODB_URI,
    testDbName: process.env.MONGODB_TEST_DB_NAME,
    prodDbName: process.env.MONGODB_DB_NAME || 'malwa_namkeen',
  });

  if (!validation.safe) {
    throw new Error(validation.error);
  }

  return validation.effectiveDbName;
}

/**
 * Queries the running live server's /api/health endpoint to verify the connected database
 * before issuing any test requests or database writes.
 */
export async function verifyLiveServerDatabaseIsolation(baseUrl: string): Promise<{
  safe: boolean;
  connectedDatabase: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${baseUrl}/api/health`);
    if (!res.ok) {
      return {
        safe: false,
        connectedDatabase: 'unknown',
        error: `Server health endpoint returned status ${res.status}. Expected 200 OK before running E2E tests.`,
      };
    }

    const data = await res.json();
    const connectedDb = (data.database || data.dbName || '').trim();

    if (!connectedDb) {
      return {
        safe: false,
        connectedDatabase: 'unknown',
        error: 'Server health endpoint did not disclose connected database name. Cannot verify test isolation.',
      };
    }

    const validation = validateTestDatabaseName({ testDbName: connectedDb });
    if (!validation.safe) {
      return {
        safe: false,
        connectedDatabase: connectedDb,
        error: `LIVE SERVER SAFETY VIOLATION: The live server at ${baseUrl} is connected to database "${connectedDb}", which is NOT verified as an isolated test database! ${validation.error}`,
      };
    }

    const expectedTestDb = (process.env.MONGODB_TEST_DB_NAME || 'malwa_namkeen_test').trim();
    if (connectedDb.toLowerCase() !== expectedTestDb.toLowerCase()) {
      return {
        safe: false,
        connectedDatabase: connectedDb,
        error: `LIVE SERVER SAFETY VIOLATION: The live server at ${baseUrl} is connected to database "${connectedDb}", but expected test database "${expectedTestDb}". Refusing execution.`,
      };
    }

    return {
      safe: true,
      connectedDatabase: connectedDb,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      safe: false,
      connectedDatabase: 'error',
      error: `Failed to verify live server health before testing: ${msg}`,
    };
  }
}

/**
 * Tracks test records created during an E2E run and provides reliable scoped cleanup.
 */
export class TestRecordTracker {
  public readonly runId: string;
  public userIds: string[] = [];
  public userEmails: string[] = [];
  public orderNumbers: string[] = [];
  public orderIds: string[] = [];
  public inquiryEmails: string[] = [];
  public productIds: string[] = [];

  constructor(prefix = 'e2e') {
    this.runId = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }

  public getTestUserEmail(): string {
    const email = `__test_user_${this.runId}@malwa-isolated.test`;
    if (!this.userEmails.includes(email)) {
      this.userEmails.push(email);
    }
    return email;
  }

  public getTestAdminEmail(): string {
    const email = `__test_admin_${this.runId}@malwa-isolated.test`;
    if (!this.userEmails.includes(email)) {
      this.userEmails.push(email);
    }
    return email;
  }

  public getTestInquiryEmail(): string {
    const email = `__test_inquiry_${this.runId}@malwa-isolated.test`;
    if (!this.inquiryEmails.includes(email)) {
      this.inquiryEmails.push(email);
    }
    return email;
  }

  public getTestProductSlug(): string {
    return `__test_prod_${this.runId}`;
  }

  public getTestIdempotencyKey(): string {
    return `idemp_${this.runId}`;
  }

  /**
   * Reports affected test record identifiers without exposing secrets or customer data.
   */
  public reportUncleanedIdentifiers(): void {
    console.warn(`[Teardown Notice] Scoped test records created under run ${this.runId}:`);
    if (this.userIds.length > 0) console.warn(`  - User IDs: ${this.userIds.join(', ')}`);
    if (this.userEmails.length > 0) {
      console.warn(`  - User Emails: ${this.userEmails.map(e => e.replace(/^([^@]{3})[^@]+@/, '$1***@')).join(', ')}`);
    }
    if (this.orderNumbers.length > 0) console.warn(`  - Order Numbers: ${this.orderNumbers.join(', ')}`);
    if (this.orderIds.length > 0) console.warn(`  - Order IDs: ${this.orderIds.join(', ')}`);
    if (this.inquiryEmails.length > 0) {
      console.warn(`  - Inquiry Emails: ${this.inquiryEmails.map(e => e.replace(/^([^@]{3})[^@]+@/, '$1***@')).join(', ')}`);
    }
    if (this.productIds.length > 0) console.warn(`  - Product IDs: ${this.productIds.join(', ')}`);
  }

  /**
   * Scoped cleanup routine that removes only records created during this specific test run.
   * Connects to Mongoose using MONGODB_TEST_URI if not already connected, and strictly validates that the active
   * database is an isolated test database. Never falls back to MONGODB_URI.
   */
  public async performScopedCleanup(mongoUri?: string): Promise<{
    cleanedCount: number;
    failures: string[];
  }> {
    let cleanedCount = 0;
    const failures: string[] = [];

    let effectiveDb: string;
    try {
      effectiveDb = assertSafeTestDatabaseEnvironment();
    } catch (err: unknown) {
      failures.push(`Teardown aborted: ${err instanceof Error ? err.message : String(err)}`);
      this.reportUncleanedIdentifiers();
      return { cleanedCount, failures };
    }

    let localConnect = false;

    if (mongoose.connection.readyState !== 1) {
      const uri = mongoUri || process.env.MONGODB_TEST_URI;
      if (!uri) {
        failures.push('Cannot perform database teardown: MONGODB_TEST_URI not available in test process.');
        this.reportUncleanedIdentifiers();
        return { cleanedCount, failures };
      }
      try {
        await mongoose.connect(uri, {
          dbName: effectiveDb,
          serverSelectionTimeoutMS: 5000,
        });
        localConnect = true;
      } catch (err: unknown) {
        failures.push(`Failed to connect to test database for teardown: ${err instanceof Error ? err.message : String(err)}`);
        this.reportUncleanedIdentifiers();
        return { cleanedCount, failures };
      }
    }

    const activeDb = mongoose.connection.name;
    const validation = validateTestDatabaseName({ testDbName: activeDb });
    if (!validation.safe) {
      failures.push(`Refusing teardown: active database "${activeDb}" failed test isolation validation.`);
      this.reportUncleanedIdentifiers();
      if (localConnect) {
        await mongoose.disconnect();
      }
      return { cleanedCount, failures };
    }

    try {
      // 1. Clean Users: delete strictly by tracked ObjectIds and unique run-tagged emails
      const orClauses: Record<string, unknown>[] = [];
      const validObjectIds = this.userIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
      if (validObjectIds.length > 0) {
        orClauses.push({ _id: { $in: validObjectIds } });
      }
      const runTaggedEmails = this.userEmails.filter(e => e.includes(this.runId));
      if (runTaggedEmails.length > 0) {
        orClauses.push({ email: { $in: runTaggedEmails } });
      }
      if (orClauses.length > 0) {
        const res = await mongoose.connection.collection('users').deleteMany({ $or: orClauses });
        cleanedCount += res.deletedCount || 0;
      }

      // 2. Clean Orders
      if (this.orderNumbers.length > 0 || this.orderIds.length > 0) {
        const orClauses: Record<string, unknown>[] = [];
        if (this.orderNumbers.length > 0) {
          orClauses.push({ orderNumber: { $in: this.orderNumbers } });
        }
        const validOrderIds = this.orderIds
          .filter(id => mongoose.Types.ObjectId.isValid(id))
          .map(id => new mongoose.Types.ObjectId(id));
        if (validOrderIds.length > 0) {
          orClauses.push({ _id: { $in: validOrderIds } });
        }
        if (orClauses.length > 0) {
          const res = await mongoose.connection.collection('orders').deleteMany({ $or: orClauses });
          cleanedCount += res.deletedCount || 0;
        }
      }

      // 3. Clean Inquiries: strictly delete inquiries tagged with this run's unique identifier
      const runTaggedInquiries = this.inquiryEmails.filter(e => e.includes(this.runId));
      if (runTaggedInquiries.length > 0) {
        const res = await mongoose.connection.collection('inquiries').deleteMany({
          email: { $in: runTaggedInquiries },
        });
        cleanedCount += res.deletedCount || 0;
      }

      // 4. Clean Products
      if (this.productIds.length > 0) {
        const validProdIds = this.productIds
          .filter(id => mongoose.Types.ObjectId.isValid(id))
          .map(id => new mongoose.Types.ObjectId(id));
        if (validProdIds.length > 0) {
          const res = await mongoose.connection.collection('products').deleteMany({
            _id: { $in: validProdIds },
          });
          cleanedCount += res.deletedCount || 0;
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      failures.push(`Database teardown error: ${msg}`);
      this.reportUncleanedIdentifiers();
    } finally {
      if (localConnect) {
        await mongoose.disconnect();
      }
    }

    return { cleanedCount, failures };
  }
}
