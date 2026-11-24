import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export interface ConfigurationResults {
  cursorMcp: boolean;
  cursorRules: boolean;
  claudeMd: boolean;
  claudeDesktop: boolean;
  agentsMd: boolean;
  windsurfRules: boolean;
  clineRules: boolean;
}

export class SynapseConfigurator {
  private workspaceDir: string;

  constructor(workspaceDir: string = process.cwd()) {
    this.workspaceDir = workspaceDir;
  }

  private injectDirective(filePath: string, header: string = ''): boolean {
    const directive = [
      '',
      '# --- SYNAPSE SHARED CONTEXT ---',
      'Always read .synapse/context.md or invoke synapse_get_context before starting work to stay in sync with other AI agents.',
      'When making significant architectural decisions or completing major milestones, record them using synapse_log_decision or `npx synapse log "<decision>"`.',
      '# --- END SYNAPSE DIRECTIVE ---',
      '',
    ].join('\n');

    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (!content.includes('SYNAPSE SHARED CONTEXT')) {
          fs.appendFileSync(filePath, directive, 'utf-8');
          return true;
        }
        return false;
      } else {
        const initialContent = header ? `${header}\n${directive}` : directive;
        fs.writeFileSync(filePath, initialContent, 'utf-8');
        return true;
      }
    } catch {
      return false;
    }
  }

  public initAll(): ConfigurationResults {
    const results: ConfigurationResults = {
      cursorMcp: false,
      cursorRules: false,
      claudeMd: false,
      claudeDesktop: false,
      agentsMd: false,
      windsurfRules: false,
      clineRules: false,
    };

    // 1. Cursor: .cursor/mcp.json & .cursorrules
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

    results.cursorRules = this.injectDirective(
      path.join(this.workspaceDir, '.cursorrules'),
      '# Cursor Rules with Synapse Shared Context'
    );

    // 2. Claude Code: CLAUDE.md & Claude Desktop config
    results.claudeMd = this.injectDirective(
      path.join(this.workspaceDir, 'CLAUDE.md'),
      '# Claude Code Project Guidelines'
    );

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

    // 3. Codex & AGY: AGENTS.md
    results.agentsMd = this.injectDirective(
      path.join(this.workspaceDir, 'AGENTS.md'),
      '# Agent Guidelines & Context'
    );

    // 4. Windsurf: .windsurfrules
    results.windsurfRules = this.injectDirective(
      path.join(this.workspaceDir, '.windsurfrules'),
      '# Windsurf AI Rules'
    );

    // 5. Cline: .clinerules
    results.clineRules = this.injectDirective(
      path.join(this.workspaceDir, '.clinerules'),
      '# Cline Rules'
    );

    return results;
  }
}
