import * as fs from 'node:fs';
import * as path from 'node:path';
import { SynapseStorage } from '../src/storage.js';

async function runVerification() {
  console.log('🧪 Starting Synapse Local Verification Suite...\n');

  const testDir = path.join(process.cwd(), '.test-workspace');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir, { recursive: true });

  try {
    // 1. Test Storage & Initialization
    console.log('1. Testing Synapse Storage Engine...');
    const storage = new SynapseStorage(testDir, false);
    const initialBlackboard = storage.getBlackboard();
    console.log('   ✓ Blackboard initialized:', initialBlackboard.projectName);

    // 2. Test Goal Update
    console.log('2. Testing Goal & Conventions...');
    storage.updateGoal('Re-architecting database to PostgreSQL with Drizzle ORM', 'Claude Code');
    storage.addConvention('Always use TypeScript strict mode', 'Cursor');
    storage.addConvention('Never commit .env files', 'Developer');

    // 3. Test Architectural Decision Logging
    console.log('3. Testing Cross-Agent Decision Logging...');
    const decision = storage.addDecision({
      agent: 'Claude Code',
      title: 'Switched from bcrypt to argon2id for password hashing',
      rationale: 'Argon2id is memory-hard and recommended by OWASP 2026',
      affectedComponents: ['src/auth/hash.ts', 'src/auth/service.ts'],
    });
    console.log('   ✓ Logged decision:', decision.id, decision.title);

    // 4. Test Markdown Generation
    console.log('4. Verifying .synapse/context.md generation...');
    const md = storage.getContextMarkdown();
    if (!md.includes('Re-architecting database to PostgreSQL')) {
      throw new Error('context.md missing active goal');
    }
    if (!md.includes('argon2id')) {
      throw new Error('context.md missing logged decision');
    }
    console.log('   ✓ context.md generated and validated with full cross-agent sync!');

    // 5. Check physical files
    const contextMdPath = path.join(testDir, '.synapse', 'context.md');
    if (!fs.existsSync(contextMdPath)) {
      throw new Error('.synapse/context.md was not created on disk');
    }
    console.log('   ✓ Physical disk file verified at:', contextMdPath);

    // 6. Test Active File Change Tracking
    console.log('6. Testing Active File Change Tracking...');
    storage.updateActiveChanges([
      { path: 'src/auth/jwt.ts', status: 'modified', lastSeen: new Date().toISOString() },
    ]);
    const updatedMd = storage.getContextMarkdown();
    if (!updatedMd.includes('src/auth/jwt.ts')) {
      throw new Error('context.md missing active in-progress files section');
    }
    console.log('   ✓ Live active changes properly rendered into context.md');

    // 7. Test Configurator (init command)
    console.log('7. Testing Zero-Config Configurator...');
    const { SynapseConfigurator } = await import('../src/configurator.js');
    const configurator = new SynapseConfigurator(testDir);
    const configResult = configurator.initAll();
    if (!configResult.cursorMcp || !configResult.cursorRules) {
      throw new Error('Configurator failed to create .cursor/mcp.json or .cursorrules');
    }
    console.log('   ✓ Configurator successfully generated .cursor/mcp.json and .cursorrules');

    console.log('\n🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } finally {
    // Clean up test workspace
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
