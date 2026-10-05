#!/usr/bin/env node
/* Import Supabase Auth users to Firebase Auth without exposing password hashes. */
const source = process.env.SUPABASE_DATABASE_URL;
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const projectId = process.env.FIREBASE_PROJECT_ID || 'acuarionexo';
if (!source || !serviceAccountJson) {
  throw new Error('Set SUPABASE_DATABASE_URL and FIREBASE_SERVICE_ACCOUNT_JSON as secrets.');
}

const [{ Pool }, firebaseApp, firebaseAuth] = await Promise.all([
  import('pg'),
  import('firebase-admin/app'),
  import('firebase-admin/auth')
]);
const serviceAccount = JSON.parse(serviceAccountJson);
const app = firebaseApp.initializeApp({
  credential: firebaseApp.cert(serviceAccount),
  projectId
}, 'acuarionexo-auth-migration');
const auth = firebaseAuth.getAuth(app);
const pool = new Pool({ connectionString: source, max: 2 });

try {
  const result = await pool.query(`
    select id::text as id, email, encrypted_password, email_confirmed_at,
           raw_user_meta_data, banned_until
    from auth.users
    where deleted_at is null and email is not null
    order by id
  `);

  const toImport = [];
  for (const row of result.rows) {
    const uid = String(row.id);
    const email = String(row.email).trim().toLowerCase();
    let existing = null;
    try { existing = await auth.getUser(uid); }
    catch (error) {
      if (error?.code !== 'auth/user-not-found') throw error;
    }
    if (existing) {
      if (existing.email?.toLowerCase() !== email) {
        throw new Error(`Firebase UID conflict at source row ${toImport.length}; refusing to overwrite an existing account.`);
      }
      continue;
    }

    const metadata = row.raw_user_meta_data && typeof row.raw_user_meta_data === 'object'
      ? row.raw_user_meta_data : {};
    const record = {
      uid,
      email,
      emailVerified: Boolean(row.email_confirmed_at),
      disabled: Boolean(row.banned_until && new Date(row.banned_until).getTime() > Date.now()),
      displayName: String(metadata.full_name || metadata.name || '').slice(0, 256) || undefined
    };
    const hash = String(row.encrypted_password || '');
    if (hash) {
      if (!/^\$2[aby]\$/.test(hash)) {
        throw new Error(`Unsupported password hash at source row ${result.rows.indexOf(row)}; no user has been imported from this batch.`);
      }
      record.passwordHash = Buffer.from(hash, 'utf8');
    }
    toImport.push(record);
  }

  let imported = 0;
  for (let start = 0; start < toImport.length; start += 1000) {
    const batch = toImport.slice(start, start + 1000);
    const response = await auth.importUsers(batch, { hash: { algorithm: 'BCRYPT' } });
    if (response.errors.length) {
      const errors = response.errors.map(item => ({ index: item.index, code: item.error?.code || 'import_failed' }));
      throw new Error(`Firebase rejected ${errors.length} account(s): ${JSON.stringify(errors)}.`);
    }
    imported += response.successCount;
  }

  console.log(`Firebase account migration complete: imported=${imported}; already-present=${result.rows.length - toImport.length}.`);
} finally {
  await pool.end();
  await firebaseApp.deleteApp(app);
}
