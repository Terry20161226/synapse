import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { SynapseStorage } from './storage.js';

const execAsync = promisify(exec);

export class SynapseServer {
  private server: Server;
  private storage: SynapseStorage;
  private workspaceDir: string;

  constructor(workspaceDir: string = process.cwd()) {
    this.workspaceDir = workspaceDir;
    this.storage = new SynapseStorage(workspaceDir);
    this.server = new Server(
      {
        name: 'synapse-context-engine',
        version: '0.2.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.registerHandlers();
  }

  private registerHandlers(): void {
    // 1. List Tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'synapse_get_context',
            description:
              'Retrieve the real-time cross-agent context, active goal, project rules/conventions, and recent architectural decisions made by other agents (Cursor, Claude Code, etc.). Always call this before starting a new task.',
            inputSchema: {
              type: 'object',
              properties: {
                format: {
                  type: 'string',
                  enum: ['markdown', 'json'],
                  description: 'Preferred format of the context (default: markdown)',
                },
              },
            },
          },
          {
            name: 'synapse_log_decision',
            description:
              'Record an architectural or design decision made by this agent so other agents and future sessions stay synchronized and avoid conflicting work.',
            inputSchema: {
              type: 'object',
              properties: {
                agent: {
                  type: 'string',
                  description: 'Name of the current agent (e.g., "Claude Code", "Cursor", "Windsurf")',
                },
                title: {
                  type: 'string',
                  description: 'Brief summary of the decision (e.g. "Migrated auth to JWT tokens")',
                },
                rationale: {
                  type: 'string',
                  description: 'Why this decision was made and what alternatives were rejected',
                },
                affectedComponents: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Paths or modules affected (e.g. ["src/auth", "src/middleware"])',
                },
              },
              required: ['agent', 'title'],
            },
          },
          {
            name: 'synapse_set_goal',
            description:
              'Update the current active milestone or objective across all agents.',
            inputSchema: {
              type: 'object',
              properties: {
                goal: {
                  type: 'string',
                  description: 'The new active goal for the project',
                },
                agent: {
                  type: 'string',
                  description: 'Name of the agent updating the goal',
                },
              },
              required: ['goal'],
            },
          },
          {
            name: 'synapse_add_convention',
            description:
              'Register a project convention, style rule, or constraint that all agents must respect.',
            inputSchema: {
              type: 'object',
              properties: {
                convention: {
                  type: 'string',
                  description: 'The rule or convention to register (e.g. "Use pnpm instead of npm")',
                },
                agent: {
                  type: 'string',
                  description: 'Name of the agent registering the convention',
                },
              },
              required: ['convention'],
            },
          },
          {
            name: 'synapse_get_recent_diffs',
            description:
              'Inspect recently modified files and git diffs across the project. Use this to understand what other agents or the developer recently touched.',
            inputSchema: {
              type: 'object',
              properties: {
                target: {
                  type: 'string',
                  enum: ['uncommitted', 'stat', 'last_commit'],
                  description:
                    'Scope of diff: "uncommitted" (unstaged/staged changes, default), "stat" (summary of changed files), or "last_commit"',
                },
              },
            },
          },
        ],
      };
    });

    // 2. Call Tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'synapse_get_context': {
            const format = (args?.format as string) || 'markdown';
            if (format === 'json') {
              const state = this.storage.getBlackboard();
              const timeline = this.storage.getTimeline(10);
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({ state, timeline }, null, 2),
                  },
                ],
              };
            }
            const md = this.storage.getContextMarkdown();
            return {
              content: [
                {
                  type: 'text',
                  text: md,
                },
              ],
            };
          }

          case 'synapse_log_decision': {
            const agent = String(args?.agent || 'Unknown Agent');
            const title = String(args?.title || '');
            const rationale = args?.rationale ? String(args.rationale) : undefined;
            const affectedComponents = Array.isArray(args?.affectedComponents)
              ? (args.affectedComponents as string[])
              : undefined;

            const decision = this.storage.addDecision({
              agent,
              title,
              rationale,
              affectedComponents,
            });

            return {
              content: [
                {
                  type: 'text',
                  text: `Decision successfully logged to Synapse [${decision.id}]: "${title}". Synced across all agents.`,
                },
              ],
            };
          }

          case 'synapse_set_goal': {
            const goal = String(args?.goal || '');
            const agent = String(args?.agent || 'Agent');
            this.storage.updateGoal(goal, agent);
            return {
              content: [
                {
                  type: 'text',
                  text: `Active goal updated to: "${goal}". All agents will be notified on their next context query.`,
                },
              ],
            };
          }

          case 'synapse_add_convention': {
            const convention = String(args?.convention || '');
            const agent = String(args?.agent || 'Agent');
            this.storage.addConvention(convention, agent);
            return {
              content: [
                {
                  type: 'text',
                  text: `Convention registered: "${convention}".`,
                },
              ],
            };
          }

          case 'synapse_get_recent_diffs': {
            const target = (args?.target as string) || 'uncommitted';
            let cmd = 'git diff';
            if (target === 'stat') cmd = 'git status -s';
            if (target === 'last_commit') cmd = 'git show --stat';

            try {
              const { stdout } = await execAsync(cmd, { cwd: this.workspaceDir });
              const output = stdout.trim() || 'No recent diffs detected in working tree.';
              return {
                content: [
                  {
                    type: 'text',
                    text: output,
                  },
                ],
              };
            } catch (err) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Unable to read diffs: ${err instanceof Error ? err.message : String(err)}`,
                  },
                ],
              };
            }
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errMessage = error instanceof Error ? error.message : String(error);
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${errMessage}`,
            },
          ],
        };
      }
    });
  }

  public async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[Synapse] Server running on stdio');
  }
}
