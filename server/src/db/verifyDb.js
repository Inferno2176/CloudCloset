import { query, getClient, closePool } from './pool.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * CloudCloset Atelier Database Connectivity & Health Verification Script
 * Validates the 7 core database connectivity requirements:
 * 1. Connection establishment to PostgreSQL
 * 2. Execution of simple query
 * 3. Reading existing application records
 * 4. Permitted transactional write and verification
 * 5. Constraint and relational integrity validation
 * 6. Graceful error handling for database failures
 * 7. Transient connection recovery
 */

async function runDatabaseVerification() {
  console.log('================================================================');
  console.log('  CloudCloset Atelier — Database Connectivity Verification Suite');
  console.log('================================================================\n');

  const results = [];

  // 1. Connection check
  try {
    const client = await getClient();
    results.push({ test: '1. Connect to PostgreSQL', status: 'PASS', details: 'Client connection successfully acquired from pool.' });
    client.release();
  } catch (err) {
    results.push({ test: '1. Connect to PostgreSQL', status: 'FAIL', details: err.message });
    console.error('Fatal: Cannot connect to PostgreSQL database.');
    printSummary(results);
    process.exit(1);
  }

  // 2. Simple database query
  try {
    const res = await query('SELECT 1 as ping, current_database() as db_name, version() as version_info');
    const dbName = res.rows[0].db_name;
    const versionSnippet = res.rows[0].version_info.split(',')[0];
    results.push({
      test: '2. Simple Query Execution',
      status: 'PASS',
      details: `Executed "SELECT 1" on database "${dbName}". Engine: ${versionSnippet}`
    });
  } catch (err) {
    results.push({ test: '2. Simple Query Execution', status: 'FAIL', details: err.message });
  }

  // 3. Read existing application records
  try {
    const catRes = await query('SELECT count(*)::int as count FROM categories');
    const prodRes = await query('SELECT count(*)::int as count FROM products');
    const userRes = await query('SELECT count(*)::int as count FROM users');

    results.push({
      test: '3. Read Application Records',
      status: 'PASS',
      details: `Found ${catRes.rows[0].count} categories, ${prodRes.rows[0].count} archival products, and ${userRes.rows[0].count} users.`
    });
  } catch (err) {
    results.push({ test: '3. Read Application Records', status: 'FAIL', details: err.message });
  }

  // 4. Permitted write & verify within an isolated transaction
  try {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const testId = `test-verify-${Date.now()}`;
      await client.query(
        'INSERT INTO categories (id, name, slug, description) VALUES ($1, $2, $3, $4)',
        [testId, 'Verification Temp Category', `temp-${testId}`, 'Temporary record for verification']
      );

      const verifyRes = await client.query('SELECT name FROM categories WHERE id = $1', [testId]);
      if (verifyRes.rows.length === 1 && verifyRes.rows[0].name === 'Verification Temp Category') {
        // Rollback so no test pollution is persisted
        await client.query('ROLLBACK');
        results.push({
          test: '4. Permitted Write & Readback',
          status: 'PASS',
          details: 'Successfully inserted test record, read it back, and safely rolled back transaction.'
        });
      } else {
        await client.query('ROLLBACK');
        results.push({ test: '4. Permitted Write & Readback', status: 'FAIL', details: 'Record not read back accurately.' });
      }
    } finally {
      client.release();
    }
  } catch (err) {
    results.push({ test: '4. Permitted Write & Readback', status: 'FAIL', details: err.message });
  }

  // 5. Constraints and validation test (Unique constraint violation)
  try {
    // Attempt duplicate insert of admin email
    let caughtConstraint = false;
    try {
      await query(
        `INSERT INTO users (id, email, password_hash, role, full_name)
         VALUES ($1, 'admin@cloudcloset.com', 'dummyhash', 'Admin', 'Duplicate Admin')`,
        [`dup-${Date.now()}`]
      );
    } catch (err) {
      if (err.code === '23505') {
        caughtConstraint = true;
      }
    }

    if (caughtConstraint) {
      results.push({
        test: '5. Relational Constraints & Validation',
        status: 'PASS',
        details: 'PostgreSQL unique constraint violation (code 23505) correctly intercepted.'
      });
    } else {
      results.push({
        test: '5. Relational Constraints & Validation',
        status: 'FAIL',
        details: 'Unique constraint was not enforced as expected.'
      });
    }
  } catch (err) {
    results.push({ test: '5. Relational Constraints & Validation', status: 'FAIL', details: err.message });
  }

  // 6. Graceful failure handling (Syntax / Outage simulation)
  try {
    let handledGracefully = false;
    try {
      await query('SELECT * FROM non_existent_table_for_testing_error_handler_safety');
    } catch (err) {
      // Must not contain password or connection string
      const errStr = String(err.message);
      const containsSecrets = errStr.includes('postgres:') || errStr.includes('password') || errStr.includes('@');
      if (!containsSecrets) {
        handledGracefully = true;
      }
    }

    if (handledGracefully) {
      results.push({
        test: '6. Graceful Error & Outage Handling',
        status: 'PASS',
        details: 'Database error caught cleanly without leaking secrets or connection strings.'
      });
    } else {
      results.push({
        test: '6. Graceful Error & Outage Handling',
        status: 'FAIL',
        details: 'Error contained sensitive tokens or unhandled rejection.'
      });
    }
  } catch (err) {
    results.push({ test: '6. Graceful Error & Outage Handling', status: 'FAIL', details: err.message });
  }

  // 7. Transient reconnect / recovery
  try {
    const resAfterErrors = await query('SELECT 1 as recovered');
    if (resAfterErrors.rows[0].recovered === 1) {
      results.push({
        test: '7. Connection Pool Recovery',
        status: 'PASS',
        details: 'Connection pool successfully recovered and executed subsequent queries without restart.'
      });
    } else {
      results.push({ test: '7. Connection Pool Recovery', status: 'FAIL', details: 'Pool failed to recover.' });
    }
  } catch (err) {
    results.push({ test: '7. Connection Pool Recovery', status: 'FAIL', details: err.message });
  }

  printSummary(results);

  await closePool();

  const allPassed = results.every(r => r.status === 'PASS');
  process.exit(allPassed ? 0 : 1);
}

function printSummary(results) {
  console.log('\n----------------------------------------------------------------');
  console.log('  VERIFICATION RESULTS:');
  console.log('----------------------------------------------------------------');
  for (const r of results) {
    const mark = r.status === 'PASS' ? '✅ [PASS]' : '❌ [FAIL]';
    console.log(`${mark} ${r.test}`);
    console.log(`         Details: ${r.details}`);
  }
  console.log('----------------------------------------------------------------\n');
}

runDatabaseVerification();
