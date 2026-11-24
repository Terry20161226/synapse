import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { SynapseStorage } from './storage.js';
import type { ActiveFileChange } from './types.js';

const execAsync = promisify(exec);

export class SynapseWatcher {
  private storage: SynapseStorage;
  private workspaceDir: string;
  private lastCommitHash: string | null = null;
  private intervalTimer: NodeJS.Timeout | null = null;
  private knownModifiedFiles: Map<string, number> = new Map();

  constructor(storage: SynapseStorage, workspaceDir: string = process.cwd()) {
    this.storage = storage;
    this.workspaceDir = workspaceDir;
  }

  public async start(intervalMs: number = 3000): Promise<void> {
    await this.checkGitState();
    await this.checkUncommittedChanges();

    this.intervalTimer = setInterval(async () => {
      try {
        await this.checkGitState();
        await this.checkUncommittedChanges();
      } catch {
        // ignore background poll errors
      }
    }, intervalMs);

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

  private async checkUncommittedChanges(): Promise<void> {
    try {
      const { stdout: statusOut } = await execAsync('git status --porcelain', {
        cwd: this.workspaceDir,
      });

      const lines = statusOut.split('\n').filter((l) => l.trim().length > 0);
      const activeChanges: ActiveFileChange[] = [];
      const now = Date.now();

      for (const line of lines) {
        const code = line.slice(0, 2).trim();
        const filePath = line.slice(3).trim();

        // Skip internal synapse files
        if (filePath.startsWith('.synapse') || filePath.includes('.test-workspace')) {
          continue;
        }

        let status: 'modified' | 'added' | 'deleted' = 'modified';
        if (code === '??' || code.includes('A')) status = 'added';
        if (code.includes('D')) status = 'deleted';

        activeChanges.push({
          path: filePath,
          status,
          lastSeen: new Date().toISOString(),
        });

        // Detect potential collision if file was touched previously
        const lastTouch = this.knownModifiedFiles.get(filePath);
        if (!lastTouch) {
          this.knownModifiedFiles.set(filePath, now);
        } else if (now - lastTouch < 5000) {
          // Rapid consecutive modifications
          this.knownModifiedFiles.set(filePath, now);
        }
      }

      // Clean up known files that are no longer dirty
      for (const file of this.knownModifiedFiles.keys()) {
        if (!activeChanges.some((c) => c.path === file)) {
          this.knownModifiedFiles.delete(file);
        }
      }

      this.storage.updateActiveChanges(activeChanges);
    } catch {
      // Ignore git status errors
    }
  }
}
