/**
 * ============================================================================
 * Debitinfo.GE Database Synchronization Engine (Local <-> Remote Cloud Layerbase)
 * ============================================================================
 * 
 * Commands:
 *   status           - Compare Local vs Remote database record counts & diffs
 *   pull             - Synchronize Remote (Layerbase Cloud) -> Local PostgreSQL
 *   push             - Synchronize Local PostgreSQL -> Remote (Layerbase Cloud)
 *   bidir            - Two-way smart sync based on timestamps (updatedAt / id)
 * 
 * Options:
 *   --clean          - Completely wipe destination tables before copying (fresh mirror)
 *   --dry-run        - Analyze and print what will be synchronized without modifying databases
 * 
 * Usage:
 *   npx ts-node scripts/sync-db.ts status
 *   npx ts-node scripts/sync-db.ts pull
 *   npx ts-node scripts/sync-db.ts push
 *   npx ts-node scripts/sync-db.ts bidir
 *   npx ts-node scripts/sync-db.ts pull --clean
 * ============================================================================
 */

import { Prisma, PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const LOCAL_URL =
  process.env.LOCAL_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:admin@localhost:5432/debitinfo?schema=public';

const REMOTE_URL =
  process.env.REMOTE_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:ReGXjjgvKSey5Y3aCs48Frj4@debitinfo-worn-gear-pooler.sage.cloud.layerbase.dev:5432/debitinfo?sslmode=require';

interface ModelSyncConfig {
  name: string;
  accessor: string;
  displayName: string;
  primaryKey: string;
}

/**
 * Dynamically resolves all models from Prisma schema and performs a topological
 * sort based on foreign key relationships so that parent tables are processed
 * before child tables without requiring manual configuration.
 */
function getSyncModels(): ModelSyncConfig[] {
  const models = Prisma.dmmf.datamodel.models;
  const modelNames = models.map((m) => m.name);

  // Build dependency graph from relations
  const graph = new Map<string, Set<string>>();
  for (const m of models) {
    const deps = new Set<string>();
    for (const f of m.fields) {
      if (
        f.relationFromFields &&
        f.relationFromFields.length > 0 &&
        modelNames.includes(f.type) &&
        f.type !== m.name
      ) {
        deps.add(f.type);
      }
    }
    graph.set(m.name, deps);
  }

  // Topological sort (DFS with cycle breaking)
  const visited = new Set<string>();
  const sortedNames: string[] = [];

  function visit(name: string, ancestors = new Set<string>()) {
    if (visited.has(name)) return;
    if (ancestors.has(name)) return;
    ancestors.add(name);
    const deps = graph.get(name) || new Set<string>();
    for (const dep of deps) {
      visit(dep, new Set(ancestors));
    }
    visited.add(name);
    sortedNames.push(name);
  }

  for (const name of modelNames) {
    visit(name);
  }

  return sortedNames.map((name) => {
    const m = models.find((x) => x.name === name)!;
    const idField = m.fields.find((f) => f.isId);
    const primaryKey = idField
      ? idField.name
      : (m as any).primaryKey?.fields?.[0] || 'id';
    const accessor = name.charAt(0).toLowerCase() + name.slice(1);
    return {
      name,
      accessor,
      primaryKey,
      displayName: name,
    };
  });
}

function sanitizeRecord(record: any): any {
  // Prisma findMany() without include returns only scalar database fields (strings, numbers, dates, Decimals, etc.)
  const clean: any = {};
  for (const [key, val] of Object.entries(record)) {
    if (val !== undefined) {
      clean[key] = val;
    }
  }
  return clean;
}

async function showStatus(local: PrismaClient, remote: PrismaClient) {
  const models = getSyncModels();
  console.log('\n=============================================================================');
  console.log(`📊 Debitinfo.GE — მონაცემთა ბაზების შედარება (${models.length} მოდელი: Local vs Remote)`);
  console.log('=============================================================================');
  console.log(
    '| #  | მოდელი (Model)                   | Local DB | Remote DB | სტატუსი (Diff) |'
  );
  console.log('-----------------------------------------------------------------------------');

  let totalLocal = 0;
  let totalRemote = 0;
  let matchCount = 0;

  for (let i = 0; i < models.length; i++) {
    const m = models[i];
    const lCount = await (local as any)[m.accessor].count();
    const rCount = await (remote as any)[m.accessor].count();

    totalLocal += lCount;
    totalRemote += rCount;

    const isMatch = lCount === rCount;
    if (isMatch) matchCount++;

    const statusBadge = isMatch ? '✅ MATCH' : `⚠️ DIFF (${rCount - lCount > 0 ? '+' : ''}${rCount - lCount})`;
    const idxStr = String(i + 1).padStart(2, ' ');
    const nameStr = m.name.padEnd(30, ' ');
    const lStr = String(lCount).padStart(8, ' ');
    const rStr = String(rCount).padStart(9, ' ');

    console.log(`| ${idxStr} | ${nameStr} | ${lStr} | ${rStr} | ${statusBadge.padEnd(14, ' ')} |`);
  }

  console.log('-----------------------------------------------------------------------------');
  console.log(
    `|    | სულ ჩანაწერები (TOTAL)          | ${String(totalLocal).padStart(8, ' ')} | ${String(totalRemote).padStart(9, ' ')} | ${
      totalLocal === totalRemote ? '✅ 100% IN SYNC' : '⚠️ MISMATCH'
    } |`
  );
  console.log('=============================================================================\n');
}

async function wipeDatabase(target: PrismaClient, targetName: string) {
  const models = getSyncModels();
  console.log(`🧹 იწყება ${targetName}-ის ცხრილების გასუფთავება უსაფრთხო მიმდევრობით...`);
  // Wipe in reverse dependency order
  const reversed = models.slice().reverse();
  for (const m of reversed) {
    const count = await (target as any)[m.accessor].count();
    if (count > 0) {
      await (target as any)[m.accessor].deleteMany({});
      console.log(`   - [${m.name}] გასუფთავდა ${count} ჩანაწერი`);
    }
  }
  console.log(`✅ ${targetName} წარმატებით გასუფთავდა!\n`);
}

async function syncDirection(
  source: PrismaClient,
  target: PrismaClient,
  sourceName: string,
  targetName: string,
  options: { clean?: boolean; dryRun?: boolean }
) {
  const models = getSyncModels();
  console.log('\n=============================================================================');
  console.log(`🚀 Debitinfo.GE Sync (${models.length} მოდელი): [${sourceName}] ➡️  [${targetName}]`);
  console.log(`   Clean Mode: ${options.clean ? 'კი (Overwriting)' : 'არა (Safe Upsert)'}`);
  console.log(`   Dry Run:    ${options.dryRun ? 'კი (Simulation Only)' : 'არა (Live DB Write)'}`);
  console.log('=============================================================================\n');

  if (options.clean && !options.dryRun) {
    await wipeDatabase(target, targetName);
  }

  let totalUpserted = 0;

  for (const m of models) {
    const pk = m.primaryKey || 'id';
    const records = await (source as any)[m.accessor].findMany();

    if (records.length === 0) {
      console.log(`⏩ [${m.name}] 0 ჩანაწერი — გამოტოვებულია.`);
      continue;
    }

    if (options.dryRun) {
      console.log(`🔍 [${m.name}] დაიპრესება ${records.length} ჩანაწერი (Dry Run).`);
      totalUpserted += records.length;
      continue;
    }

    let processed = 0;
    for (const record of records) {
      const clean = sanitizeRecord(record);
      const { [pk]: _, ...dataToUpdate } = clean;

      await (target as any)[m.accessor].upsert({
        where: { [pk]: record[pk] },
        update: dataToUpdate,
        create: clean,
      });
      processed++;
    }

    totalUpserted += processed;
    console.log(`✅ [${m.name}] წარმატებით სინქრონიზდა: ${processed} ჩანაწერი`);
  }

  console.log('\n=============================================================================');
  console.log(`🎉 სინქრონიზაცია წარმატებით დასრულდა! სულ დამუშავდა: ${totalUpserted} ჩანაწერი.`);
  console.log('=============================================================================\n');
}

async function smartBidirSync(local: PrismaClient, remote: PrismaClient, options: { dryRun?: boolean }) {
  const models = getSyncModels();
  console.log('\n=============================================================================');
  console.log(`🔄 ორმხრივი ჭკვიანი სინქრონიზაცია (${models.length} მოდელი): Local <-> Remote`);
  console.log(`   Dry Run: ${options.dryRun ? 'კი (Simulation)' : 'არა (Live DB Write)'}`);
  console.log('=============================================================================\n');

  let pulledCount = 0;
  let pushedCount = 0;
  let unchangedCount = 0;

  for (const m of models) {
    const pk = m.primaryKey || 'id';
    const localRecords: any[] = await (local as any)[m.accessor].findMany();
    const remoteRecords: any[] = await (remote as any)[m.accessor].findMany();

    const localMap = new Map<string, any>(localRecords.map(r => [r[pk], r]));
    const remoteMap = new Map<string, any>(remoteRecords.map(r => [r[pk], r]));

    // 1. Pull missing or newer records from remote -> local
    for (const rRec of remoteRecords) {
      const lRec = localMap.get(rRec[pk]);
      if (!lRec) {
        // Record exists only on Remote -> Pull to Local
        if (!options.dryRun) {
          await (local as any)[m.accessor].create({ data: sanitizeRecord(rRec) });
        }
        pulledCount++;
      } else {
        // Exists in both: compare updatedAt if exists
        const rUpdated = rRec.updatedAt ? new Date(rRec.updatedAt).getTime() : 0;
        const lUpdated = lRec.updatedAt ? new Date(lRec.updatedAt).getTime() : 0;

        if (rUpdated > lUpdated) {
          if (!options.dryRun) {
            const { [pk]: _, ...updateData } = sanitizeRecord(rRec);
            await (local as any)[m.accessor].update({ where: { [pk]: rRec[pk] }, data: updateData });
          }
          pulledCount++;
        } else if (lUpdated > rUpdated) {
          if (!options.dryRun) {
            const { [pk]: _, ...updateData } = sanitizeRecord(lRec);
            await (remote as any)[m.accessor].update({ where: { [pk]: lRec[pk] }, data: updateData });
          }
          pushedCount++;
        } else {
          unchangedCount++;
        }
      }
    }

    // 2. Push missing local records -> remote
    for (const lRec of localRecords) {
      if (!remoteMap.has(lRec[pk])) {
        if (!options.dryRun) {
          await (remote as any)[m.accessor].create({ data: sanitizeRecord(lRec) });
        }
        pushedCount++;
      }
    }

    console.log(`✅ [${m.name}] მოდელი დამუშავდა.`);
  }

  console.log('\n=============================================================================');
  console.log(`🎉 ორმხრივი სინქრონიზაციის შედეგები:`);
  console.log(`   ⬇️  Remote ➡️ Local (Pulled/Updated): ${pulledCount}`);
  console.log(`   ⬆️  Local ➡️ Remote (Pushed/Updated): ${pushedCount}`);
  console.log(`   ⏹️  უცვლელი (Already in sync):      ${unchangedCount}`);
  console.log('=============================================================================\n');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  const clean = args.includes('--clean');
  const dryRun = args.includes('--dry-run');

  const local = new PrismaClient({ datasources: { db: { url: LOCAL_URL } } });
  const remote = new PrismaClient({ datasources: { db: { url: REMOTE_URL } } });

  try {
    switch (command.toLowerCase()) {
      case 'status':
      case 'diff':
        await showStatus(local, remote);
        break;

      case 'pull':
        await syncDirection(remote, local, 'Remote Cloud (Layerbase)', 'Local Database', { clean, dryRun });
        await showStatus(local, remote);
        break;

      case 'push':
        await syncDirection(local, remote, 'Local Database', 'Remote Cloud (Layerbase)', { clean, dryRun });
        await showStatus(local, remote);
        break;

      case 'bidir':
      case 'sync':
        await smartBidirSync(local, remote, { dryRun });
        await showStatus(local, remote);
        break;

      default:
        console.log(`
უცნობი ბრძანება: "${command}"

გამოყენების ინსტრუქცია:
  npm run db:sync:status    - ბაზების სტატუსისა და რაოდენობების შედარება
  npm run db:sync:pull      - Remote (Layerbase Cloud) -> Local ლოკალურ ბაზაში ჩამოტვირთვა
  npm run db:sync:push      - Local ლოკალური -> Remote (Layerbase Cloud) ატვირთვა
  npm run db:sync           - ორმხრივი ჭკვიანი სინქრონიზაცია (Bidirectional sync)
  
დამატებითი პარამეტრები:
  --clean                   - სამიზნე ბაზის წინასწარ გასუფთავება (fresh mirror)
  --dry-run                 - სიმულაცია ცვლილებების გარეშე
`);
        break;
    }
  } catch (error: any) {
    console.error('❌ სინქრონიზაციის შეცდომა:', error.message || error);
    process.exit(1);
  } finally {
    await local.$disconnect();
    await remote.$disconnect();
  }
}

main();
