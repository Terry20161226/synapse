#!/usr/bin/env node
import { SynapseServer } from './server.js';
import { SynapseStorage } from './storage.js';
import { SynapseWatcher } from './watcher.js';
import { SynapseConfigurator } from './configurator.js';

const args = process.argv.slice(2);
const command = args[0];

const storage = new SynapseStorage(process.cwd());

if (command === 'init') {
  console.log('\n🧠 \x1b[1m\x1b[36mInitializing Synapse in current project...\x1b[0m');
  const configurator = new SynapseConfigurator(process.cwd());
  const res = configurator.initAll();

  console.log(`📁 Local .synapse context directory initialized.`);
  if (res.cursorMcp) {
    console.log(`  \x1b[32m✓\x1b[0m Injected Synapse into \x1b[1m.cursor/mcp.json\x1b[0m`);
  }
  if (res.cursorRules) {
    console.log(`  \x1b[32m✓\x1b[0m Injected shared context rules into \x1b[1m.cursorrules\x1b[0m`);
  }
  if (res.claudeDesktop) {
    console.log(`  \x1b[32m✓\x1b[0m Injected Synapse into \x1b[1mClaude Desktop configuration\x1b[0m`);
  }

  console.log('\n\x1b[32m🎉 Synapse ready! Your Cursor and Claude Code are now linked.\x1b[0m');
  console.log('Run \x1b[36mnpx synapse status\x1b[0m to see the shared blackboard anytime.\n');
  process.exit(0);
}

if (command === 'status') {
  const blackboard = storage.getBlackboard();
  const timeline = storage.getTimeline(5);

  console.log('\n🧠 \x1b[1m\x1b[36mSYNAPSE SHARED CONTEXT\x1b[0m');
  console.log(`📁 Project: \x1b[33m${blackboard.projectName}\x1b[0m`);
  console.log(`🎯 Active Goal: \x1b[32m${blackboard.activeGoal}\x1b[0m\n`);

  console.log('\x1b[1mRecent Architectural Decisions:\x1b[0m');
  if (blackboard.decisions.length === 0) {
    console.log('  (None recorded yet)');
  } else {
    blackboard.decisions.slice(0, 3).forEach((d) => {
      console.log(`  • \x1b[35m[${d.agent}]\x1b[0m ${d.title}`);
      if (d.rationale) console.log(`    \x1b[90m${d.rationale}\x1b[0m`);
    });
  }

  console.log('\n\x1b[1mRecent Timeline Events:\x1b[0m');
  if (timeline.length === 0) {
    console.log('  (No activity logged yet)');
  } else {
    timeline.forEach((t) => {
      console.log(`  • \x1b[90m[${new Date(t.timestamp).toLocaleTimeString()}]\x1b[0m \x1b[34m[${t.agent}]\x1b[0m ${t.summary}`);
    });
  }
  console.log('');
  process.exit(0);
}

if (command === 'set-goal') {
  const goal = args.slice(1).join(' ');
  if (!goal) {
    console.error('Usage: synapse set-goal <goal description>');
    process.exit(1);
  }
  storage.updateGoal(goal, 'User/CLI');
  console.log(`\x1b[32m✓ Active goal set to:\x1b[0m ${goal}`);
  process.exit(0);
}

if (command === 'log') {
  const title = args.slice(1).join(' ');
  if (!title) {
    console.error('Usage: synapse log <decision title>');
    process.exit(1);
  }
  storage.addDecision({
    agent: 'User/CLI',
    title,
  });
  console.log(`\x1b[32m✓ Decision logged:\x1b[0m ${title}`);
  process.exit(0);
}

// Default: Start MCP Server
async function main() {
  const server = new SynapseServer(process.cwd());
  const watcher = new SynapseWatcher(storage, process.cwd());
  
  await watcher.start(10000);
  await server.start();
}

main().catch((err) => {
  console.error('[Synapse] Fatal error:', err);
  process.exit(1);
});
