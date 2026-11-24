import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { SynapseStorage } from './storage.js';

const execAsync = promisify(exec);

export class SynapseWatcher {
  private storage: SynapseStorage;
  private workspaceDir: string;
  private lastCommitHash: string | null = null;
  private intervalTimer: NodeJS.Timeout | null = null;

  constructor(storage: SynapseStorage, workspaceDir: string = process.cwd()) {
    this.storage = storage;
    this.workspaceDir = workspaceDir;
  }

  public async start(intervalMs: number = 10000): Promise<void> {
    await this.checkGitState();
    this.intervalTimer = setInterval(() => {
      this.checkGitState().catch(() => {});
    }, intervalMs);
    // don't hold the event loop open if stdio is closed
    if (this.intervalTimer.unref) {
      this.intervalTimer.unref();
    }
  }

  public stop(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  private async checkGitState(): Promise<void> {
    try {
      const { stdout: hashOut } = await execAsync('git rev-parse HEAD', {
        cwd: this.workspaceDir,
      });
      const currentHash = hashOut.trim();

      if (!this.lastCommitHash) {
        this.lastCommitHash = currentHash;
        return;
      }

      if (this.lastCommitHash !== currentHash) {
        // New commit detected!
        const { stdout: commitInfo } = await execAsync(
          `git log -1 --pretty=format:"%s (%an)"`,
          { cwd: this.workspaceDir }
        );
        const { stdout: diffStat } = await execAsync(
          `git diff --stat ${this.lastCommitHash}..${currentHash}`,
          { cwd: this.workspaceDir }
        );

        this.lastCommitHash = currentHash;

        this.storage.addTimelineEvent({
          id: `git-${Date.now()}`,
          timestamp: new Date().toISOString(),
          agent: 'Git/Developer',
          type: 'milestone',
          summary: `Commit: ${commitInfo.trim()}`,
          details: diffStat.trim().split('\n').slice(-1)[0] || '',
        });

        this.storage.regenerateContextMd();
      }
    } catch {
      // Not a git repository or git error; fail silently
    }
  }
}
