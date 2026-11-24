import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export class SynapseConfigurator {
  private workspaceDir: string;

  constructor(workspaceDir: string = process.cwd()) {
    this.workspaceDir = workspaceDir;
  }

  public initAll(): {
    cursorMcp: boolean;
    claudeDesktop: boolean;
    cursorRules: boolean;
  } {
    const results = {
      cursorMcp: false,
      claudeDesktop: false,
      cursorRules: false,
    };

    // 1. Configure Cursor Workspace MCP (.cursor/mcp.json)
    try {
      const cursorDir = path.join(this.workspaceDir, '.cursor');
      if (!fs.existsSync(cursorDir)) {
        fs.mkdirSync(cursorDir, { recursive: true });
      }

      const cursorMcpPath = path.join(cursorDir, 'mcp.json');
      let config: any = { mcpServers: {} };
      if (fs.existsSync(cursorMcpPath)) {
        try {
          config = JSON.parse(fs.readFileSync(cursorMcpPath, 'utf-8'));
          if (!config.mcpServers) config.mcpServers = {};
        } catch {
          config = { mcpServers: {} };
        }
      }

      config.mcpServers.synapse = {
        command: 'npx',
        args: ['-y', 'synapse-agent'],
      };

      fs.writeFileSync(cursorMcpPath, JSON.stringify(config, null, 2), 'utf-8');
      results.cursorMcp = true;
    } catch {
      // ignore
    }

    // 2. Configure Claude Desktop global config if directory exists
    try {
      let claudeConfigDir = '';
      if (process.platform === 'darwin') {
        claudeConfigDir = path.join(
          os.homedir(),
          'Library',
          'Application Support',
          'Claude'
        );
      } else if (process.platform === 'win32') {
        claudeConfigDir = path.join(
          process.env.APPDATA || os.homedir(),
          'Claude'
        );
      }

      if (claudeConfigDir && fs.existsSync(claudeConfigDir)) {
        const claudeMcpPath = path.join(
          claudeConfigDir,
          'claude_desktop_config.json'
        );
        let claudeConfig: any = { mcpServers: {} };
        if (fs.existsSync(claudeMcpPath)) {
          try {
            claudeConfig = JSON.parse(
              fs.readFileSync(claudeMcpPath, 'utf-8')
            );
            if (!claudeConfig.mcpServers) claudeConfig.mcpServers = {};
          } catch {
            claudeConfig = { mcpServers: {} };
          }
        }

        claudeConfig.mcpServers.synapse = {
          command: 'npx',
          args: ['-y', 'synapse-agent'],
        };

        fs.writeFileSync(
          claudeMcpPath,
          JSON.stringify(claudeConfig, null, 2),
          'utf-8'
        );
        results.claudeDesktop = true;
      }
    } catch {
      // ignore
    }

    // 3. Inject Cursor Rules (.cursorrules)
    try {
      const cursorRulesPath = path.join(this.workspaceDir, '.cursorrules');
      const directive = [
        '',
        '# --- SYNAPSE SHARED CONTEXT DIRECTIVE ---',
        'Always read .synapse/context.md or invoke synapse_get_context before starting work to stay in sync with other AI agents.',
        'When making significant architectural decisions, log them with synapse_log_decision.',
        '# --- END SYNAPSE DIRECTIVE ---',
        '',
      ].join('\n');

      if (fs.existsSync(cursorRulesPath)) {
        const existing = fs.readFileSync(cursorRulesPath, 'utf-8');
        if (!existing.includes('SYNAPSE SHARED CONTEXT')) {
          fs.appendFileSync(cursorRulesPath, directive, 'utf-8');
          results.cursorRules = true;
        }
      } else {
        fs.writeFileSync(cursorRulesPath, directive, 'utf-8');
        results.cursorRules = true;
      }
    } catch {
      // ignore
    }

    return results;
  }
}
