export interface Decision {
  id: string;
  timestamp: string;
  agent: string;
  title: string;
  rationale?: string;
  affectedComponents?: string[];
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  agent: string;
  type: 'decision' | 'file_change' | 'milestone' | 'note';
  summary: string;
  details?: string;
}

export interface BlackboardState {
  version: string;
  projectName: string;
  activeGoal: string;
  conventions: string[];
  decisions: Decision[];
  lastUpdated: string;
}

export interface SynapseConfig {
  storageDir: string;
  maxTimelineEvents: number;
  autoGitWatch: boolean;
}
