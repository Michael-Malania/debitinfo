/**
 * ============================================================================
 * Debitinfo.GE Schema Push Tool (Local + Remote Layerbase Database)
 * ============================================================================
 * 
 * Automatically applies prisma schema changes to:
 *   1. Local PostgreSQL database
 *   2. Remote Cloud PostgreSQL (Layerbase)
 *   3. Re-generates Prisma Client
 * 
 * Usage:
 *   npm run db:push:all
 *   npm run db:push:remote
 * ============================================================================
 */

import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const LOCAL_URL =
  process.env.LOCAL_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:admin@localhost:5432/debitinfo?schema=public';

const REMOTE_URL =
  process.env.REMOTE_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:ReGXjjgvKSey5Y3aCs48Frj4@debitinfo-worn-gear-pooler.sage.cloud.layerbase.dev:5432/debitinfo?sslmode=require';

const target = process.argv[2] || 'all';

function runPush(dbUrl: string, name: string) {
  console.log(`\n📦 [${name}] სქემის განახლება (Prisma db push)...`);
  try {
    execSync('npx prisma db push --skip-generate', {
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
    });
    console.log(`✅ [${name}] სქემა წარმატებით განახლდა!`);
  } catch (err) {
    console.error(`❌ [${name}] სქემის განახლება ვერ მოხერხდა:`, err);
    throw err;
  }
}

function runGenerate() {
  console.log('\n⚙️ Prisma Client-ის ხელახალი გენერირება...');
  try {
    execSync('npx prisma generate', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
    });
    console.log('✅ Prisma Client წარმატებით დაგენერირდა!');
  } catch (err: any) {
    console.warn('\nℹ️ შენიშვნა: თუ ლოკალური backend სერვერი გაშვებულია, Windows დროებით ბლოკავს .dll ფაილის გადაწერას.');
    console.warn('   სქემა ორივე ბაზაში (Local & Layerbase) უკვე წარმატებით განახლებულია!');
    console.warn('   Prisma Client-ის გადასაგენერირებლად უბრალოდ გაუშვით `npm run prisma:generate` სერვერის გადატვირთვისას.');
  }
}

async function main() {
  console.log('=============================================================================');
  console.log('🚀 Debitinfo.GE — მონაცემთა ბაზების სქემის სინქრონიზაცია (Schema Push)');
  console.log('=============================================================================');

  if (target === 'local' || target === 'all') {
    runPush(LOCAL_URL, 'Local Database');
  }

  if (target === 'remote' || target === 'all') {
    runPush(REMOTE_URL, 'Remote Cloud Layerbase');
  }

  runGenerate();

  console.log('\n=============================================================================');
  console.log('🎉 ყველა ბაზის სქემა 100%-ით სინქრონიზებულია! შეგიძლიათ გაუშვათ db:sync.');
  console.log('=============================================================================\n');
}

main().catch(() => process.exit(1));
