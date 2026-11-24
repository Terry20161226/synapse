import * as readline from 'node:readline';
import { SynapseStorage } from './storage.js';
import { SynapseWatcher } from './watcher.js';

export class SynapseDashboard {
  private storage: SynapseStorage;
  private watcher: SynapseWatcher;
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(workspaceDir: string = process.cwd()) {
    this.storage = new SynapseStorage(workspaceDir);
    this.watcher = new SynapseWatcher(this.storage, workspaceDir);
  }

  public async start(): Promise<void> {
    this.isRunning = true;

    // Switch to alternate screen buffer & hide cursor
    process.stdout.write('\x1b[?1049h\x1b[?25l');

    // Setup watcher
    await this.watcher.start(2000);

    // Initial render
    this.render();

    // Render loop every 1.5s
    this.timer = setInterval(() => {
      if (this.isRunning) {
        this.render();
      }
    }, 1500);

    // Keybindings handling
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      readline.emitKeypressEvents(process.stdin);
      process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'c') {
          this.stop();
          process.exit(0);
        }
        if (key.name === 'q' || key.name === 'escape') {
          this.stop();
          process.exit(0);
        }
        if (key.name === 'r') {
          this.render();
        }
      });
    }

    const cleanup = () => {
      this.stop();
      process.exit(0);
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.watcher.stop();
    // Restore normal screen buffer & cursor
    process.stdout.write('\x1b[?25h\x1b[?1049l');
  }

  public renderToString(): string {
    const blackboard = this.storage.getBlackboard();
    const timeline = this.storage.getTimeline(6);
    const activeChanges = blackboard.activeChanges || [];

    const cols = process.stdout.columns || 80;
    const width = Math.max(76, Math.min(cols - 2, 110));
    const hr = '─'.repeat(width);

    const out: string[] = [];

    // Header
    out.push(`\x1b[1m\x1b[36m┌${hr}┐\x1b[0m`);
    const title = ` 🧠 SYNAPSE LIVE CONTEXT MONITOR  •  v0.3.0 `;
    const timeStr = `[${new Date().toLocaleTimeString()}] `;
    const padding = ' '.repeat(Math.max(1, width - title.length - timeStr.length));
    out.push(`\x1b[1m\x1b[36m│\x1b[0m\x1b[1m\x1b[97m${title}\x1b[0m\x1b[90m${padding}${timeStr}\x1b[0m\x1b[1m\x1b[36m│\x1b[0m`);
    out.push(`\x1b[1m\x1b[36m├${hr}┤\x1b[0m`);

    // Section 1: Project & Active Goal
    out.push(`\x1b[1m\x1b[36m│\x1b[0m \x1b[1m\x1b[33m📁 Project:\x1b[0m ${blackboard.projectName.padEnd(width - 13)}\x1b[1m\x1b[36m│\x1b[0m`);
    const goalText = blackboard.activeGoal.slice(0, width - 17);
    out.push(`\x1b[1m\x1b[36m│\x1b[0m \x1b[1m\x1b[32m🎯 Goal:\x1b[0m    ${goalText.padEnd(width - 13)}\x1b[1m\x1b[36m│\x1b[0m`);

    if (blackboard.conventions.length > 0) {
      const conv = blackboard.conventions[0].slice(0, width - 17);
      out.push(`\x1b[1m\x1b[36m│\x1b[0m \x1b[90m📜 Rule:\x1b[0m    ${conv.padEnd(width - 13)}\x1b[1m\x1b[36m│\x1b[0m`);
    }

    out.push(`\x1b[1m\x1b[36m├${hr}┤\x1b[0m`);

    // Section 2: Active In-Progress Files (Real-time Watcher)
    out.push(`\x1b[1m\x1b[36m│\x1b[0m \x1b[1m\x1b[97m🚧 ACTIVE WORKING TREE CHANGES (Uncommitted):\x1b[0m${' '.repeat(width - 45)}\x1b[1m\x1b[36m│\x1b[0m`);
    if (activeChanges.length === 0) {
      out.push(`\x1b[1m\x1b[36m│\x1b[0m   \x1b[32m✓ Working tree clean. All AI agents in sync.\x1b[0m${' '.repeat(width - 47)}\x1b[1m\x1b[36m│\x1b[0m`);
    } else {
      activeChanges.slice(0, 4).forEach((c) => {
        const statusBadge =
          c.status === 'modified'
            ? '\x1b[33m[MODIFIED]\x1b[0m'
            : c.status === 'added'
            ? '\x1b[32m[ADDED]   \x1b[0m'
            : '\x1b[31m[DELETED] \x1b[0m';
        const rawLine = `  ${statusBadge} ${c.path}`;
        const visualLen = 13 + c.path.length;
        const pad = ' '.repeat(Math.max(1, width - visualLen - 2));
        out.push(`\x1b[1m\x1b[36m│\x1b[0m${rawLine}${pad}\x1b[1m\x1b[36m│\x1b[0m`);
      });
    }

    out.push(`\x1b[1m\x1b[36m├${hr}┤\x1b[0m`);

    // Section 3: Recent Decisions & Activity
    out.push(`\x1b[1m\x1b[36m│\x1b[0m \x1b[1m\x1b[97m⏱️  RECENT CROSS-AGENT TIMELINE:\x1b[0m${' '.repeat(width - 32)}\x1b[1m\x1b[36m│\x1b[0m`);
    if (timeline.length === 0) {
      out.push(`\x1b[1m\x1b[36m│\x1b[0m   \x1b[90m(No events recorded yet)\x1b[0m${' '.repeat(width - 27)}\x1b[1m\x1b[36m│\x1b[0m`);
    } else {
      timeline.forEach((t) => {
        const time = new Date(t.timestamp).toLocaleTimeString();
        const line = `  \x1b[90m[${time}]\x1b[0m \x1b[35m[${t.agent}]\x1b[0m ${t.summary}`;
        const visualLen = 11 + t.agent.length + 3 + t.summary.length;
        const pad = ' '.repeat(Math.max(1, width - visualLen - 2));
        out.push(`\x1b[1m\x1b[36m│\x1b[0m${line}${pad}\x1b[1m\x1b[36m│\x1b[0m`);
      });
    }

    out.push(`\x1b[1m\x1b[36m├${hr}┤\x1b[0m`);

    // Footer Keybindings
    const footer = ` [q] Quit  •  [r] Force Refresh  •  Live Watcher Active `;
    const footPad = ' '.repeat(Math.max(1, width - footer.length));
    out.push(`\x1b[1m\x1b[36m│\x1b[0m\x1b[90m${footer}${footPad}\x1b[0m\x1b[1m\x1b[36m│\x1b[0m`);
    out.push(`\x1b[1m\x1b[36m└${hr}┘\x1b[0m`);

    return out.join('\n');
  }

  private render(): void {
    const content = this.renderToString();
    // Move cursor to top-left and draw frame
    process.stdout.write(`\x1b[H${content}`);
  }
}
