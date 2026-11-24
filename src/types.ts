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
  type: 'decision' | 'file_change' | 'milestone' | 'note' | 'collision_warning';
  summary: string;
  details?: string;
}

export interface ActiveFileChange {
  path: string;
  status: 'modified' | 'added' | 'deleted';
  lastSeen: string;
}

export interface BlackboardState {
  version: string;
  projectName: string;
  activeGoal: string;
  conventions: string[];
  decisions: Decision[];
  activeChanges?: ActiveFileChange[];
  lastUpdated: string;
}

export interface SynapseConfig {
  storageDir: string;
  maxTimelineEvents: number;
  autoGitWatch: boolean;
}
