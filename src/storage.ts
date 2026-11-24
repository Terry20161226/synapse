import * as fs from 'node:fs';
import * as path from 'node:path';
import type { BlackboardState, Decision, TimelineEvent } from './types.js';

export class SynapseStorage {
  private baseDir: string;
  private synapseDir: string;
  private blackboardPath: string;
  private timelinePath: string;
  private contextMdPath: string;

  constructor(workspaceDir: string = process.cwd()) {
    this.baseDir = workspaceDir;
    this.synapseDir = path.join(this.baseDir, '.synapse');
    this.blackboardPath = path.join(this.synapseDir, 'blackboard.json');
    this.timelinePath = path.join(this.synapseDir, 'timeline.json');
    this.contextMdPath = path.join(this.synapseDir, 'context.md');
    this.init();
  }

  private init(): void {
    if (!fs.existsSync(this.synapseDir)) {
      fs.mkdirSync(this.synapseDir, { recursive: true });
    }

    if (!fs.existsSync(this.blackboardPath)) {
      const defaultState: BlackboardState = {
        version: '1.0.0',
        projectName: path.basename(this.baseDir),
        activeGoal: 'Project initialized with Synapse.',
        conventions: [],
        decisions: [],
        lastUpdated: new Date().toISOString(),
      };
      this.writeJsonAtomic(this.blackboardPath, defaultState);
    }

    if (!fs.existsSync(this.timelinePath)) {
      this.writeJsonAtomic(this.timelinePath, []);
    }

    this.regenerateContextMd();
  }

  public getBlackboard(): BlackboardState {
    try {
      const raw = fs.readFileSync(this.blackboardPath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return {
        version: '1.0.0',
        projectName: path.basename(this.baseDir),
        activeGoal: 'Unknown',
        conventions: [],
        decisions: [],
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  public updateGoal(goal: string, agent: string = 'User/Agent'): void {
    const state = this.getBlackboard();
    state.activeGoal = goal;
    state.lastUpdated = new Date().toISOString();
    this.writeJsonAtomic(this.blackboardPath, state);

    this.addTimelineEvent({
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      agent,
      type: 'milestone',
      summary: `Active goal updated: ${goal}`,
    });

    this.regenerateContextMd();
  }

  public addConvention(convention: string, agent: string = 'User/Agent'): void {
    const state = this.getBlackboard();
    if (!state.conventions.includes(convention)) {
      state.conventions.push(convention);
      state.lastUpdated = new Date().toISOString();
      this.writeJsonAtomic(this.blackboardPath, state);

      this.addTimelineEvent({
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        agent,
        type: 'note',
        summary: `Added project convention: ${convention}`,
      });

      this.regenerateContextMd();
    }
  }

  public addDecision(decision: Omit<Decision, 'id' | 'timestamp'>): Decision {
    const state = this.getBlackboard();
    const newDecision: Decision = {
      ...decision,
      id: `dec-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    state.decisions.unshift(newDecision);
    // keep latest 50 decisions
    if (state.decisions.length > 50) {
      state.decisions = state.decisions.slice(0, 50);
    }
    state.lastUpdated = new Date().toISOString();
    this.writeJsonAtomic(this.blackboardPath, state);

    this.addTimelineEvent({
      id: `evt-${Date.now()}`,
      timestamp: newDecision.timestamp,
      agent: newDecision.agent,
      type: 'decision',
      summary: `Decision: ${newDecision.title}`,
      details: newDecision.rationale,
    });

    this.regenerateContextMd();
    return newDecision;
  }

  public getTimeline(limit: number = 20): TimelineEvent[] {
    try {
      const raw = fs.readFileSync(this.timelinePath, 'utf-8');
      const events: TimelineEvent[] = JSON.parse(raw);
      return events.slice(0, limit);
    } catch {
      return [];
    }
  }

  public addTimelineEvent(event: TimelineEvent): void {
    try {
      const events = this.getTimeline(100);
      events.unshift(event);
      this.writeJsonAtomic(this.timelinePath, events);
    } catch (err) {
      console.error('Failed to append timeline event', err);
    }
  }

  public getContextMarkdown(): string {
    if (fs.existsSync(this.contextMdPath)) {
      return fs.readFileSync(this.contextMdPath, 'utf-8');
    }
    return this.regenerateContextMd();
  }

  public regenerateContextMd(): string {
    const state = this.getBlackboard();
    const timeline = this.getTimeline(10);

    const lines: string[] = [
      `# 🧠 Synapse Shared Context: ${state.projectName}`,
      `> *Last Updated: ${state.lastUpdated}*`,
      '',
      `## 🎯 Current Active Goal`,
      state.activeGoal || 'No active goal set.',
      '',
      `## 📜 Project Conventions & Rules`,
      state.conventions.length > 0
        ? state.conventions.map((c) => `- ${c}`).join('\n')
        : '- No special conventions registered.',
      '',
      `## 💡 Key Architectural Decisions (Recent)`,
    ];

    if (state.decisions.length > 0) {
      state.decisions.slice(0, 5).forEach((d) => {
        lines.push(`### [${d.agent}] ${d.title} (${new Date(d.timestamp).toLocaleTimeString()})`);
        if (d.rationale) lines.push(`- **Rationale:** ${d.rationale}`);
        if (d.affectedComponents?.length) {
          lines.push(`- **Components:** \`${d.affectedComponents.join('`, `')}\``);
        }
      });
    } else {
      lines.push('- No architectural decisions logged yet.');
    }

    lines.push('', '## ⏱️ Recent Agent Activity Timeline');
    if (timeline.length > 0) {
      timeline.forEach((t) => {
        const timeStr = new Date(t.timestamp).toLocaleTimeString();
        lines.push(`- **[${timeStr}] [${t.agent}]** \`${t.type}\`: ${t.summary}`);
      });
    } else {
      lines.push('- No recent activity logged.');
    }

    lines.push('', '---', '*Generated automatically by Synapse. Synced across all AI agents.*');

    const content = lines.join('\n');
    this.writeAtomic(this.contextMdPath, content);
    return content;
  }

  private writeJsonAtomic(filePath: string, data: unknown): void {
    this.writeAtomic(filePath, JSON.stringify(data, null, 2));
  }

  private writeAtomic(filePath: string, content: string): void {
    const tempPath = `${filePath}.${Date.now()}.tmp`;
    fs.writeFileSync(tempPath, content, 'utf-8');
    fs.renameSync(tempPath, filePath);
  }
}
