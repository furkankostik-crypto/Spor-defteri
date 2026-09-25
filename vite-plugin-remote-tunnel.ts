import type { Plugin, ViteDevServer } from 'vite';
import { spawn, execSync, type ChildProcess } from 'node:child_process';

interface RemoteTunnelOptions {
  /**
   * Whether remote tunnel is enabled.
   * Defaults to true unless NO_TUNNEL environment variable is set or --no-tunnel arg is passed.
   */
  enabled?: boolean;
}

function isCommandAvailable(cmd: string): boolean {
  try {
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function remoteTunnelPlugin(options: RemoteTunnelOptions = {}): Plugin {
  const isNoTunnelArg = process.argv.includes('--no-tunnel');
  const isNoTunnelEnv = process.env.NO_TUNNEL === 'true' || process.env.NO_TUNNEL === '1';
  const isEnabled = options.enabled ?? (!isNoTunnelArg && !isNoTunnelEnv);

  let tunnelProc: ChildProcess | null = null;
  let remoteUrl: string | null = null;

  const killTunnel = () => {
    if (tunnelProc) {
      const pid = tunnelProc.pid;
      try {
        tunnelProc.kill('SIGINT');
      } catch {}

      if (process.platform === 'win32' && pid) {
        try {
          execSync(`taskkill /pid ${pid} /f /t`, { stdio: 'ignore' });
        } catch {}
      }
      tunnelProc = null;
    }
  };

  return {
    name: 'vite-plugin-remote-tunnel',
    apply: 'serve',

    configureServer(server: ViteDevServer) {
      if (!isEnabled) {
        return;
      }

      // Cleanup any previous tunnel
      killTunnel();

      // Hook printUrls to display remote URL
      const originalPrintUrls = server.printUrls.bind(server);
      server.printUrls = () => {
        originalPrintUrls();
        if (remoteUrl) {
          server.config.logger.info(
            `  \x1b[32m➜\x1b[0m  \x1b[1mRemote:\x1b[0m   \x1b[36m${remoteUrl}/\x1b[0m \x1b[90m(Dış Ağ / Canlı Test)\x1b[0m`
          );
        } else {
          server.config.logger.info(
            `  \x1b[33m➜\x1b[0m  \x1b[1mRemote:\x1b[0m   \x1b[90mBağlantı linki oluşturuluyor...\x1b[0m`
          );
        }
      };

      // When the HTTP server starts listening
      server.httpServer?.once('listening', () => {
        const address = server.httpServer?.address();
        const port = typeof address === 'object' && address ? address.port : (server.config.server.port || 5173);

        const hasCloudflared = isCommandAvailable('cloudflared');
        const hasLt = isCommandAvailable('lt');

        if (!hasCloudflared && !hasLt) {
          server.config.logger.warn(
            '\n  \x1b[33m⚠️  Remote Tunnel:\x1b[0m Dış ağ tüneli için "cloudflared" veya "localtunnel" bulunamadı.'
          );
          return;
        }

        if (hasCloudflared) {
          tunnelProc = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${port}`], {
            stdio: ['ignore', 'pipe', 'pipe']
          });
        } else {
          tunnelProc = spawn('lt', ['--port', port.toString()], {
            shell: process.platform === 'win32',
            stdio: ['ignore', 'pipe', 'pipe']
          });
        }

        const handleData = (chunk: Buffer) => {
          const text = chunk.toString();
          const match = text.match(/(https:\/\/[a-zA-Z0-9-]+\.(?:trycloudflare\.com|loca\.lt))/);
          if (match && !remoteUrl) {
            remoteUrl = match[1];
            server.config.logger.info(
              `\n  \x1b[32m➜\x1b[0m  \x1b[1mRemote:\x1b[0m   \x1b[36m\x1b[1m${remoteUrl}/\x1b[0m \x1b[32m✔ Yerel ağ dışından canlı test için hazır!\x1b[0m\n`
            );
          }
        };

        tunnelProc.stdout?.on('data', handleData);
        tunnelProc.stderr?.on('data', handleData);

        tunnelProc.on('error', (err) => {
          server.config.logger.warn(`  \x1b[33m⚠️  Remote Tunnel hatası:\x1b[0m ${err.message}`);
        });

        tunnelProc.on('close', () => {
          tunnelProc = null;
        });
      });

      // Cleanup on server close or process exit
      server.httpServer?.on('close', killTunnel);
      process.on('exit', killTunnel);
      process.on('SIGINT', () => {
        killTunnel();
        process.exit(0);
      });
      process.on('SIGTERM', () => {
        killTunnel();
        process.exit(0);
      });
    }
  };
}
