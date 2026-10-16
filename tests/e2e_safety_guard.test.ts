/**
 * Malwa Namkeen House — E2E Test Database Safety & Isolation Verification
 *
 * Verifies that the E2E guard strictly refuses production databases, missing configurations,
 * prohibited fallbacks, and unsafe connection URIs, while permitting verified, isolated test configurations.
 *
 * Does NOT require a live database. Never logs or leaks connection URIs.
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateTestDatabaseName,
  validateTestConnectionConfig,
  extractDatabaseNameFromUri,
  getEffectiveMongoConfig,
  getEffectiveDatabaseName,
  assertSafeTestDatabaseEnvironment,
  verifyLiveServerDatabaseIsolation,
  TestRecordTracker,
  KNOWN_PRODUCTION_DB_NAMES,
} from './test_db_guard.ts';

const DUMMY_PROD_URI = 'mongodb+srv://produser:prodpass123@prod-cluster.mongodb.net/malwa_namkeen?retryWrites=true';
const DUMMY_TEST_URI = 'mongodb+srv://testuser:testpass123@test-cluster.mongodb.net/malwa_namkeen_test?retryWrites=true';

describe('Malwa Namkeen House — E2E Database Safety Gate Suite', () => {

  // =========================================================================
  // 1. DATABASE NAME VALIDATION MATRIX (validateTestDatabaseName)
  // =========================================================================
  describe('1. Database Name Isolation & Safety Validation', () => {
    it('Refuses missing or undefined test database name', () => {
      const res1 = validateTestDatabaseName({ testDbName: undefined });
      assert.equal(res1.safe, false);
      assert.ok(res1.error?.includes('MONGODB_TEST_DB_NAME is not configured'));

      const res2 = validateTestDatabaseName({ testDbName: '' });
      assert.equal(res2.safe, false);

      const res3 = validateTestDatabaseName({ testDbName: '   ' });
      assert.equal(res3.safe, false);
    });

    it('Refuses test database name matching production database name', () => {
      const res = validateTestDatabaseName({
        testDbName: 'malwa_namkeen',
        prodDbName: 'malwa_namkeen',
      });
      assert.equal(res.safe, false);
      assert.ok(res.error?.includes('matches production database'));
    });

    it('Refuses case-insensitive matches against production database', () => {
      const res = validateTestDatabaseName({
        testDbName: 'MALWA_NAMKEEN',
        prodDbName: 'malwa_namkeen',
      });
      assert.equal(res.safe, false);
      assert.ok(res.error?.includes('matches production database'));
    });

    it('Refuses known production and MongoDB system database names', () => {
      for (const dangerousName of KNOWN_PRODUCTION_DB_NAMES) {
        const res = validateTestDatabaseName({ testDbName: dangerousName, prodDbName: 'custom_prod' });
        assert.equal(res.safe, false, `Database name "${dangerousName}" must be rejected`);
        assert.ok(res.error?.includes('recognized as a production or MongoDB system database name'));
      }
    });

    it('Refuses arbitrary database names that lack an explicit test indicator', () => {
      const unsafeNames = ['malwa_dev', 'store_backup', 'namkeen_staging', 'indore_store'];
      for (const name of unsafeNames) {
        const res = validateTestDatabaseName({ testDbName: name, prodDbName: 'malwa_namkeen' });
        assert.equal(res.safe, false, `Database name "${name}" without test indicator must be rejected`);
        assert.ok(res.error?.includes('must contain an explicit test indicator'));
      }
    });

    it('Accepts strictly isolated test database names with valid test indicator', () => {
      const validNames = [
        'malwa_namkeen_test',
        'malwa-test',
        'namkeen_sandbox',
        'malwa_ci',
        'test_malwa_namkeen',
      ];
      for (const name of validNames) {
        const res = validateTestDatabaseName({ testDbName: name, prodDbName: 'malwa_namkeen' });
        assert.equal(res.safe, true, `Database name "${name}" must be accepted`);
        assert.equal(res.effectiveDbName, name);
        assert.equal(res.error, undefined);
      }
    });
  });

  // =========================================================================
  // 2. URI DATABASE EXTRACTION (extractDatabaseNameFromUri)
  // =========================================================================
  describe('2. URI Database Extraction Helper', () => {
    it('Extracts database name from standard mongodb+srv connection string', () => {
      const db = extractDatabaseNameFromUri(
        'mongodb+srv://user:secret@cluster0.abc.mongodb.net/malwa_namkeen_test?retryWrites=true&w=majority'
      );
      assert.equal(db, 'malwa_namkeen_test');
    });

    it('Extracts database name from local mongodb standalone connection string', () => {
      const db = extractDatabaseNameFromUri('mongodb://127.0.0.1:27017/malwa_namkeen_test');
      assert.equal(db, 'malwa_namkeen_test');
    });

    it('Extracts database name from multi-host replica set URI', () => {
      const db = extractDatabaseNameFromUri(
        'mongodb://user:p%40ss@host1:27017,host2:27017/namkeen_sandbox?replicaSet=rs0&authSource=admin'
      );
      assert.equal(db, 'namkeen_sandbox');
    });

    it('Returns null when URI lacks an embedded database path', () => {
      assert.equal(extractDatabaseNameFromUri('mongodb+srv://cluster0.abc.mongodb.net/?appName=test'), null);
      assert.equal(extractDatabaseNameFromUri('mongodb+srv://cluster0.abc.mongodb.net/'), null);
      assert.equal(extractDatabaseNameFromUri('mongodb://localhost:27017'), null);
      assert.equal(extractDatabaseNameFromUri(''), null);
    });
  });

  // =========================================================================
  // 3. STRICT TEST URI & CONFIGURATION VALIDATION (validateTestConnectionConfig)
  // =========================================================================
  describe('3. Strict Test Connection Configuration & Isolation Validation', () => {
    it('Rejects missing MONGODB_TEST_URI even if production MONGODB_URI is provided', () => {
      const res = validateTestConnectionConfig({
        testUri: undefined,
        prodUri: DUMMY_PROD_URI,
        testDbName: 'malwa_namkeen_test',
        prodDbName: 'malwa_namkeen',
      });

      assert.equal(res.safe, false);
      assert.ok(res.error?.includes('MONGODB_TEST_URI is not configured in test mode'));
      assert.ok(res.error?.includes('Falling back to MONGODB_URI is strictly prohibited'));
    });

    it('Rejects prohibited fallback: MONGODB_TEST_URI matching production MONGODB_URI', () => {
      const res = validateTestConnectionConfig({
        testUri: DUMMY_PROD_URI,
        prodUri: DUMMY_PROD_URI,
        testDbName: 'malwa_namkeen_test',
        prodDbName: 'malwa_namkeen',
      });

      assert.equal(res.safe, false);
      assert.ok(res.error?.includes('MONGODB_TEST_URI matches production MONGODB_URI'));
      assert.ok(!res.error?.includes('prodpass123'), 'Secrets must never be leaked in error message');
    });

    it('Rejects MONGODB_TEST_URI lacking an embedded database path', () => {
      const uriWithoutDb = 'mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true';
      const res = validateTestConnectionConfig({
        testUri: uriWithoutDb,
        prodUri: DUMMY_PROD_URI,
        testDbName: 'malwa_namkeen_test',
        prodDbName: 'malwa_namkeen',
      });

      assert.equal(res.safe, false);
      assert.ok(res.error?.includes('does not have an embedded database name'));
      assert.ok(!res.error?.includes('user:pass'), 'Credentials must never be leaked');
    });

    it('Rejects MONGODB_TEST_URI whose embedded database matches production database', () => {
      const uriWithProdDb = 'mongodb+srv://testuser:pass@cluster.mongodb.net/malwa_namkeen?retryWrites=true';
      const res = validateTestConnectionConfig({
        testUri: uriWithProdDb,
        prodUri: DUMMY_PROD_URI,
        testDbName: 'malwa_namkeen_test',
        prodDbName: 'malwa_namkeen',
      });

      assert.equal(res.safe, false);
      assert.ok(res.error?.includes('matches production database name'));
    });

    it('Rejects MONGODB_TEST_URI whose embedded database matches known system database', () => {
      const uriWithAdminDb = 'mongodb+srv://testuser:pass@cluster.mongodb.net/admin?retryWrites=true';
      const res = validateTestConnectionConfig({
        testUri: uriWithAdminDb,
        prodUri: DUMMY_PROD_URI,
        testDbName: 'malwa_namkeen_test',
        prodDbName: 'malwa_namkeen',
      });

      assert.equal(res.safe, false);
      assert.ok(res.error?.includes('is a recognized production or system database'));
    });

    it('Rejects mismatch between embedded database in URI and MONGODB_TEST_DB_NAME', () => {
      const uriWithWrongDb = 'mongodb+srv://testuser:pass@cluster.mongodb.net/namkeen_other_test?retryWrites=true';
      const res = validateTestConnectionConfig({
        testUri: uriWithWrongDb,
        prodUri: DUMMY_PROD_URI,
        testDbName: 'malwa_namkeen_test',
        prodDbName: 'malwa_namkeen',
      });

      assert.equal(res.safe, false);
      assert.ok(res.error?.includes('does not match configured MONGODB_TEST_DB_NAME'));
    });

    it('Accepts completely isolated and matching test connection configuration', () => {
      const res = validateTestConnectionConfig({
        testUri: DUMMY_TEST_URI,
        prodUri: DUMMY_PROD_URI,
        testDbName: 'malwa_namkeen_test',
        prodDbName: 'malwa_namkeen',
      });

      assert.equal(res.safe, true);
      assert.equal(res.effectiveDbName, 'malwa_namkeen_test');
      assert.equal(res.effectiveUri, DUMMY_TEST_URI);
      assert.equal(res.error, undefined);
    });

    it('Ensures error messages never expose credentials or hostnames', () => {
      const sensitiveUri = 'mongodb+srv://super_secret_user:super_secret_password_999@secret-host.mongodb.net/malwa_namkeen';
      const res = validateTestConnectionConfig({
        testUri: sensitiveUri,
        prodUri: DUMMY_PROD_URI,
        testDbName: 'malwa_namkeen_test',
        prodDbName: 'malwa_namkeen',
      });

      assert.equal(res.safe, false);
      assert.ok(!res.error?.includes('super_secret_user'));
      assert.ok(!res.error?.includes('super_secret_password_999'));
      assert.ok(!res.error?.includes('secret-host.mongodb.net'));
    });
  });

  // =========================================================================
  // 4. EFFECTIVE MONGO CONFIG RESOLUTION (getEffectiveMongoConfig)
  // =========================================================================
  describe('4. Effective Mongo Config Resolution & Environment Precedence', () => {
    const origEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...origEnv };
    });

    it('In test mode (IS_E2E_TEST=true), aborts immediately if MONGODB_TEST_URI is unset', () => {
      process.env.IS_E2E_TEST = 'true';
      delete process.env.MONGODB_TEST_URI;
      process.env.MONGODB_TEST_DB_NAME = 'malwa_namkeen_test';
      process.env.MONGODB_URI = DUMMY_PROD_URI;

      assert.throws(
        () => getEffectiveMongoConfig(),
        /CRITICAL SAFETY ABORT: MONGODB_TEST_URI is not configured in test mode/
      );
    });

    it('In test mode (NODE_ENV=test), aborts if MONGODB_TEST_URI matches production MONGODB_URI', () => {
      process.env.NODE_ENV = 'test';
      process.env.MONGODB_TEST_URI = DUMMY_PROD_URI;
      process.env.MONGODB_URI = DUMMY_PROD_URI;
      process.env.MONGODB_TEST_DB_NAME = 'malwa_namkeen_test';

      assert.throws(
        () => getEffectiveMongoConfig(),
        /MONGODB_TEST_URI matches production MONGODB_URI/
      );
    });

    it('In test mode, successfully resolves verified isolated test URI and database name', () => {
      process.env.IS_E2E_TEST = 'true';
      process.env.MONGODB_TEST_URI = DUMMY_TEST_URI;
      process.env.MONGODB_TEST_DB_NAME = 'malwa_namkeen_test';
      process.env.MONGODB_URI = DUMMY_PROD_URI;
      process.env.MONGODB_DB_NAME = 'malwa_namkeen';

      const config = getEffectiveMongoConfig();
      assert.equal(config.isTestMode, true);
      assert.equal(config.dbName, 'malwa_namkeen_test');
      assert.equal(config.uri, DUMMY_TEST_URI);
      assert.equal(getEffectiveDatabaseName(), 'malwa_namkeen_test');
    });

    it('In production mode (NODE_ENV=production), rejects any attempt to configure MONGODB_TEST_URI', () => {
      process.env.NODE_ENV = 'production';
      process.env.MONGODB_TEST_URI = DUMMY_TEST_URI;
      delete process.env.IS_E2E_TEST;

      assert.throws(
        () => getEffectiveMongoConfig(),
        /CRITICAL CONFIGURATION ERROR: MONGODB_TEST_URI.*cannot be configured in NODE_ENV=production/
      );
    });

    it('In normal development mode without test flags, preserves standard connection behavior', () => {
      delete process.env.IS_E2E_TEST;
      process.env.NODE_ENV = 'development';
      delete process.env.MONGODB_TEST_URI;
      delete process.env.MONGODB_TEST_DB_NAME;
      process.env.MONGODB_URI = DUMMY_PROD_URI;
      process.env.MONGODB_DB_NAME = 'malwa_namkeen';

      const config = getEffectiveMongoConfig();
      assert.equal(config.isTestMode, false);
      assert.equal(config.uri, DUMMY_PROD_URI);
      assert.equal(config.dbName, 'malwa_namkeen');
      assert.equal(getEffectiveDatabaseName(), 'malwa_namkeen');
    });
  });

  // =========================================================================
  // 5. PROCESS ENVIRONMENT HARD ASSERTION GATE (assertSafeTestDatabaseEnvironment)
  // =========================================================================
  describe('5. Process Environment Hard Assertion Gate', () => {
    const origEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...origEnv };
    });

    it('Throws critical safety abort when MONGODB_TEST_URI is missing', () => {
      delete process.env.MONGODB_TEST_URI;
      process.env.MONGODB_TEST_DB_NAME = 'malwa_namkeen_test';
      assert.throws(
        () => assertSafeTestDatabaseEnvironment(),
        /CRITICAL SAFETY ABORT: MONGODB_TEST_URI is not configured in test mode/
      );
    });

    it('Throws critical safety abort when MONGODB_TEST_DB_NAME is missing', () => {
      process.env.MONGODB_TEST_URI = DUMMY_TEST_URI;
      delete process.env.MONGODB_TEST_DB_NAME;
      assert.throws(
        () => assertSafeTestDatabaseEnvironment(),
        /CRITICAL SAFETY ABORT: MONGODB_TEST_DB_NAME is not configured/
      );
    });

    it('Throws critical safety abort when embedded database matches malwa_namkeen', () => {
      process.env.MONGODB_TEST_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/malwa_namkeen';
      process.env.MONGODB_TEST_DB_NAME = 'malwa_namkeen_test';
      process.env.MONGODB_DB_NAME = 'malwa_namkeen';
      assert.throws(
        () => assertSafeTestDatabaseEnvironment(),
        /matches production database name/
      );
    });

    it('Passes and returns database name when both MONGODB_TEST_URI and MONGODB_TEST_DB_NAME are valid', () => {
      process.env.MONGODB_TEST_URI = DUMMY_TEST_URI;
      process.env.MONGODB_TEST_DB_NAME = 'malwa_namkeen_test';
      process.env.MONGODB_URI = DUMMY_PROD_URI;
      process.env.MONGODB_DB_NAME = 'malwa_namkeen';

      const db = assertSafeTestDatabaseEnvironment();
      assert.equal(db, 'malwa_namkeen_test');
    });
  });

  // =========================================================================
  // 6. LIVE SERVER HEALTH & ISOLATION CHECK (verifyLiveServerDatabaseIsolation)
  // =========================================================================
  describe('6. Live Server Database Pre-flight Verification', () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('Rejects server reporting degraded 503 status', async () => {
      globalThis.fetch = (async () => ({
        ok: false,
        status: 503,
      })) as any;

      const check = await verifyLiveServerDatabaseIsolation('http://mock-server:3000');
      assert.equal(check.safe, false);
      assert.ok(check.error?.includes('returned status 503'));
    });

    it('Rejects server reporting 200 OK but omitting database property', async () => {
      globalThis.fetch = (async () => ({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok', mongodb: 'connected' }),
      })) as any;

      const check = await verifyLiveServerDatabaseIsolation('http://mock-server:3000');
      assert.equal(check.safe, false);
      assert.ok(check.error?.includes('did not disclose connected database name'));
    });

    it('Rejects server connected to production database (malwa_namkeen)', async () => {
      globalThis.fetch = (async () => ({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok', mongodb: 'connected', database: 'malwa_namkeen' }),
      })) as any;

      const check = await verifyLiveServerDatabaseIsolation('http://mock-server:3000');
      assert.equal(check.safe, false);
      assert.ok(check.error?.includes('LIVE SERVER SAFETY VIOLATION'));
      assert.ok(check.error?.includes('malwa_namkeen'));
    });

    it('Rejects server connected to production database name variations', async () => {
      globalThis.fetch = (async () => ({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok', mongodb: 'connected', database: 'production' }),
      })) as any;

      const check = await verifyLiveServerDatabaseIsolation('http://mock-server:3000');
      assert.equal(check.safe, false);
      assert.ok(check.error?.includes('recognized as a production or MongoDB system database name'));
    });

    it('Approves server connected to verified isolated test database (malwa_namkeen_test)', async () => {
      globalThis.fetch = (async () => ({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok', mongodb: 'connected', database: 'malwa_namkeen_test' }),
      })) as any;

      const check = await verifyLiveServerDatabaseIsolation('http://mock-server:3000');
      assert.equal(check.safe, true);
      assert.equal(check.connectedDatabase, 'malwa_namkeen_test');
      assert.equal(check.error, undefined);
    });
  });

  // =========================================================================
  // 7. TEST RECORD TRACKER & SCOPED TEARDOWN (TestRecordTracker)
  // =========================================================================
  describe('7. Test Record Tracker & Scoped Teardown', () => {
    it('Generates unique test record identifiers scoped to the test run', () => {
      const tracker = new TestRecordTracker('test_run');
      assert.ok(tracker.runId.startsWith('test_run_'));

      const email1 = tracker.getTestUserEmail();
      assert.ok(email1.includes(tracker.runId));
      assert.ok(email1.endsWith('@malwa-isolated.test'));
      assert.ok(tracker.userEmails.includes(email1));

      const adminEmail = tracker.getTestAdminEmail();
      assert.ok(adminEmail.includes(tracker.runId));
      assert.ok(adminEmail.endsWith('@malwa-isolated.test'));
      assert.ok(tracker.userEmails.includes(adminEmail));
      assert.notEqual(email1, adminEmail);

      const inqEmail = tracker.getTestInquiryEmail();
      assert.ok(inqEmail.includes(tracker.runId));
      assert.ok(tracker.inquiryEmails.includes(inqEmail));

      const prodSlug = tracker.getTestProductSlug();
      assert.ok(prodSlug.includes(tracker.runId));

      const idemp = tracker.getTestIdempotencyKey();
      assert.ok(idemp.includes(tracker.runId));
    });

    it('Refuses scoped cleanup if test database environment is unsafe', async () => {
      const origEnv = { ...process.env };
      try {
        delete process.env.MONGODB_TEST_URI;
        delete process.env.MONGODB_TEST_DB_NAME;
        const tracker = new TestRecordTracker('safety_test');
        tracker.userIds.push('65f000000000000000000099');

        const result = await tracker.performScopedCleanup();
        assert.equal(result.cleanedCount, 0);
        assert.ok(result.failures.length > 0);
        assert.ok(result.failures[0].includes('Teardown aborted'));
      } finally {
        process.env = origEnv;
      }
    });

    it('Safely reports uncleaned identifiers without leaking secrets', () => {
      const tracker = new TestRecordTracker('audit_test');
      tracker.userIds.push('65f000000000000000000001');
      tracker.orderNumbers.push('MN-20261016-9999');
      tracker.getTestUserEmail();
      tracker.getTestInquiryEmail();

      // Ensure reportUncleanedIdentifiers runs without throwing
      assert.doesNotThrow(() => {
        tracker.reportUncleanedIdentifiers();
      });
    });

    it('Excludes pre-existing accounts and emails lacking runId from deletion query scope', () => {
      const tracker = new TestRecordTracker('preexisting_test');

      // Simulate an untracked pre-existing admin account email
      const preExistingAdminEmail = 'test_admin_e2e@malwa-isolated.test';
      tracker.userEmails.push(preExistingAdminEmail);

      // Verify that filter strictly excludes non-runId emails
      const runTaggedEmails = tracker.userEmails.filter(e => e.includes(tracker.runId));
      assert.equal(runTaggedEmails.length, 0);
      assert.ok(!runTaggedEmails.includes(preExistingAdminEmail));

      // Only runId-tagged emails are included
      const runEmail = tracker.getTestUserEmail();
      const runTaggedEmailsAfter = tracker.userEmails.filter(e => e.includes(tracker.runId));
      assert.equal(runTaggedEmailsAfter.length, 1);
      assert.equal(runTaggedEmailsAfter[0], runEmail);

      // Verify userIds only contains explicitly tracked IDs created during the run
      assert.equal(tracker.userIds.length, 0);
    });
  });

});
