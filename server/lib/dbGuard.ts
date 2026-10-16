/**
 * Malwa Namkeen House — Database Safety & Isolation Guard
 *
 * Enforces strict boundaries to ensure test suites and environments NEVER execute
 * against the production database or touch production collections.
 *
 * In test mode (NODE_ENV=test or IS_E2E_TEST=true):
 * - Strictly requires MONGODB_TEST_URI (never falls back to MONGODB_URI)
 * - MONGODB_TEST_URI must not equal MONGODB_URI
 * - Strictly requires MONGODB_TEST_DB_NAME (e.g. malwa_namkeen_test)
 * - Validates the database name embedded in MONGODB_TEST_URI against MONGODB_TEST_DB_NAME
 * - Strictly rejects production or system database names
 * - NEVER logs or exposes connection strings, passwords, or credentials
 */

export const KNOWN_PRODUCTION_DB_NAMES = [
  'malwa_namkeen',
  'malwa-namkeen',
  'malwanamkeen',
  'production',
  'prod',
  'admin',
  'local',
  'config',
];

export interface DatabaseGuardValidation {
  safe: boolean;
  effectiveDbName: string;
  error?: string;
}

export interface TestConnectionValidation {
  safe: boolean;
  effectiveUri: string;
  effectiveDbName: string;
  error?: string;
}

export interface EffectiveMongoConfig {
  uri: string;
  dbName: string;
  isTestMode: boolean;
}

/**
 * Extracts the database name embedded in a MongoDB connection string.
 * Supports standard mongodb:// and mongodb+srv:// URIs without logging or leaking the URI.
 */
export function extractDatabaseNameFromUri(uri: string): string | null {
  if (!uri || typeof uri !== 'string') return null;

  try {
    // Strip query parameters and fragment if any
    const withoutQuery = uri.split('?')[0].split('#')[0].trim();

    // Match the path segment following the host/authority list
    // e.g. mongodb+srv://user:pass@cluster.mongodb.net/database_name
    // e.g. mongodb://host1:27017,host2:27017/database_name
    const match = withoutQuery.match(/^mongodb(?:\+srv)?:\/\/[^\/]+\/([^/\s]+)$/i);
    if (match && match[1]) {
      const decoded = decodeURIComponent(match[1]).trim();
      return decoded || null;
    }
  } catch {
    // Silent catch — never leak URI in error traces
  }

  return null;
}

/**
 * Validates whether a given database name is strictly isolated and safe for testing.
 */
export function validateTestDatabaseName({
  testDbName,
  prodDbName = process.env.MONGODB_DB_NAME || 'malwa_namkeen',
}: {
  testDbName?: string;
  prodDbName?: string;
}): DatabaseGuardValidation {
  const cleanTest = (testDbName || '').trim();
  const cleanProd = (prodDbName || 'malwa_namkeen').trim();

  // 1. Must be explicitly specified and non-empty
  if (!cleanTest) {
    return {
      safe: false,
      effectiveDbName: '',
      error: 'CRITICAL SAFETY ABORT: MONGODB_TEST_DB_NAME is not configured. Live E2E tests cannot run against unspecified databases.',
    };
  }

  // 2. Must not equal the production database name (case-insensitive)
  if (cleanTest.toLowerCase() === cleanProd.toLowerCase()) {
    return {
      safe: false,
      effectiveDbName: cleanTest,
      error: `CRITICAL SAFETY ABORT: MONGODB_TEST_DB_NAME ("${cleanTest}") matches production database MONGODB_DB_NAME ("${cleanProd}"). Tests would mutate production collections.`,
    };
  }

  // 3. Must not match any known production or system database name
  if (KNOWN_PRODUCTION_DB_NAMES.includes(cleanTest.toLowerCase())) {
    return {
      safe: false,
      effectiveDbName: cleanTest,
      error: `CRITICAL SAFETY ABORT: "${cleanTest}" is recognized as a production or MongoDB system database name. Refusing execution.`,
    };
  }

  // 4. Must contain a distinct test/sandbox indicator to guarantee developer intent
  const hasTestIndicator = /(?:_|-|^)test(?:_|-|$)|sandbox|ci/i.test(cleanTest);
  if (!hasTestIndicator) {
    return {
      safe: false,
      effectiveDbName: cleanTest,
      error: `CRITICAL SAFETY ABORT: MONGODB_TEST_DB_NAME ("${cleanTest}") must contain an explicit test indicator (e.g. "malwa_namkeen_test") to guarantee it is separated from production.`,
    };
  }

  return {
    safe: true,
    effectiveDbName: cleanTest,
  };
}

/**
 * Validates the complete test connection configuration (URI and database name).
 * Rejects missing test URI, prohibited fallback to MONGODB_URI, and URI database name mismatches.
 * Never logs or exposes the connection URI.
 */
export function validateTestConnectionConfig({
  testUri = process.env.MONGODB_TEST_URI,
  prodUri = process.env.MONGODB_URI,
  testDbName = process.env.MONGODB_TEST_DB_NAME,
  prodDbName = process.env.MONGODB_DB_NAME || 'malwa_namkeen',
}: {
  testUri?: string;
  prodUri?: string;
  testDbName?: string;
  prodDbName?: string;
}): TestConnectionValidation {
  const cleanTestUri = (testUri || '').trim();
  const cleanProdUri = (prodUri || '').trim();
  const cleanTestDb = (testDbName || '').trim();
  const cleanProdDb = (prodDbName || 'malwa_namkeen').trim();

  // 1. MONGODB_TEST_URI must be explicitly set and non-empty
  if (!cleanTestUri) {
    return {
      safe: false,
      effectiveUri: '',
      effectiveDbName: '',
      error: 'CRITICAL SAFETY ABORT: MONGODB_TEST_URI is not configured in test mode. Falling back to MONGODB_URI is strictly prohibited to protect production data.',
    };
  }

  // 2. MONGODB_TEST_URI must not equal production MONGODB_URI
  if (cleanProdUri && cleanTestUri.toLowerCase() === cleanProdUri.toLowerCase()) {
    return {
      safe: false,
      effectiveUri: '',
      effectiveDbName: '',
      error: 'CRITICAL SAFETY ABORT: MONGODB_TEST_URI matches production MONGODB_URI. Execution aborted to prevent mutating production database.',
    };
  }

  // 3. MONGODB_TEST_DB_NAME must be valid and isolated
  const dbValidation = validateTestDatabaseName({ testDbName: cleanTestDb, prodDbName: cleanProdDb });
  if (!dbValidation.safe) {
    return {
      safe: false,
      effectiveUri: '',
      effectiveDbName: '',
      error: dbValidation.error,
    };
  }

  // 4. Validate database name embedded in MONGODB_TEST_URI
  const embeddedDb = extractDatabaseNameFromUri(cleanTestUri);
  if (!embeddedDb) {
    return {
      safe: false,
      effectiveUri: '',
      effectiveDbName: dbValidation.effectiveDbName,
      error: `CRITICAL SAFETY ABORT: MONGODB_TEST_URI does not have an embedded database name. It must explicitly include /${dbValidation.effectiveDbName} in the connection path to prevent falling back to default or production databases.`,
    };
  }

  // 5. Embedded database name must not match production database
  if (embeddedDb.toLowerCase() === cleanProdDb.toLowerCase()) {
    return {
      safe: false,
      effectiveUri: '',
      effectiveDbName: '',
      error: `CRITICAL SAFETY ABORT: Embedded database name ("${embeddedDb}") in MONGODB_TEST_URI matches production database name ("${cleanProdDb}"). Connection prohibited.`,
    };
  }

  // 6. Embedded database name must not be in known production/system database names
  if (KNOWN_PRODUCTION_DB_NAMES.includes(embeddedDb.toLowerCase())) {
    return {
      safe: false,
      effectiveUri: '',
      effectiveDbName: '',
      error: `CRITICAL SAFETY ABORT: Embedded database name ("${embeddedDb}") in MONGODB_TEST_URI is a recognized production or system database. Connection prohibited.`,
    };
  }

  // 7. Embedded database name must match MONGODB_TEST_DB_NAME
  if (embeddedDb.toLowerCase() !== dbValidation.effectiveDbName.toLowerCase()) {
    return {
      safe: false,
      effectiveUri: '',
      effectiveDbName: '',
      error: `CRITICAL SAFETY ABORT: Database name embedded in MONGODB_TEST_URI ("${embeddedDb}") does not match configured MONGODB_TEST_DB_NAME ("${dbValidation.effectiveDbName}").`,
    };
  }

  return {
    safe: true,
    effectiveUri: cleanTestUri,
    effectiveDbName: dbValidation.effectiveDbName,
  };
}

/**
 * Resolves the effective MongoDB URI and database name for server/Mongoose startup.
 * In test mode (NODE_ENV=test or IS_E2E_TEST=true), strictly enforces MONGODB_TEST_URI and MONGODB_TEST_DB_NAME.
 * Throws immediately if test mode is enabled but test configuration is missing, mismatched, or unsafe.
 * In non-test mode, preserves standard production/development connection behavior.
 */
export function getEffectiveMongoConfig(): EffectiveMongoConfig {
  const isTest = process.env.NODE_ENV === 'test' || process.env.IS_E2E_TEST === 'true';

  if (isTest) {
    const validation = validateTestConnectionConfig({
      testUri: process.env.MONGODB_TEST_URI,
      prodUri: process.env.MONGODB_URI,
      testDbName: process.env.MONGODB_TEST_DB_NAME,
      prodDbName: process.env.MONGODB_DB_NAME || 'malwa_namkeen',
    });

    if (!validation.safe) {
      throw new Error(validation.error);
    }

    return {
      uri: validation.effectiveUri,
      dbName: validation.effectiveDbName,
      isTestMode: true,
    };
  }

  // Non-test mode: check if someone is dangerously setting test config in production
  if (process.env.NODE_ENV === 'production' && (process.env.MONGODB_TEST_URI || process.env.MONGODB_TEST_DB_NAME)) {
    throw new Error(
      'CRITICAL CONFIGURATION ERROR: MONGODB_TEST_URI or MONGODB_TEST_DB_NAME cannot be configured in NODE_ENV=production. Production deployments must not run against test databases.'
    );
  }

  const isProd = process.env.NODE_ENV === 'production';
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    if (!isProd) {
      console.warn('[MongoDB] MONGODB_URI not set. In development, attempting local MongoDB at mongodb://127.0.0.1:27017/malwa_namkeen');
      uri = 'mongodb://127.0.0.1:27017/malwa_namkeen';
    } else {
      throw new Error('[MongoDB Error] MONGODB_URI is not set in production. Database connection aborted.');
    }
  } else if (!isProd && uri.includes('mock:mock')) {
    console.warn('[MongoDB] Mock Atlas URI detected in development. Using local MongoDB at mongodb://127.0.0.1:27017/malwa_namkeen');
    uri = 'mongodb://127.0.0.1:27017/malwa_namkeen';
  }

  const dbName = (process.env.MONGODB_DB_NAME || 'malwa_namkeen').trim();

  return {
    uri,
    dbName,
    isTestMode: false,
  };
}

/**
 * Resolves the effective database name for backward compatibility.
 */
export function getEffectiveDatabaseName(): string {
  return getEffectiveMongoConfig().dbName;
}
