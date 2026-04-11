import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const localAppData =
	process.env.LOCALAPPDATA ?? join(process.env.USERPROFILE ?? process.cwd(), 'AppData', 'Local');

const cacheDir = join(localAppData, 'StakeEngine', 'cache');

mkdirSync(cacheDir, { recursive: true });

const env = {
	...process.env,
	PUBLIC_CHROMATIC: 'true',
	CACHE_DIR: cacheDir,
};

const child =
	process.platform === 'win32'
		? spawn('cmd.exe', ['/d', '/s', '/c', 'storybook dev -p 6001 -c .storybook'], {
				stdio: 'inherit',
				env,
			})
		: spawn('storybook', ['dev', '-p', '6001', '-c', '.storybook'], {
				stdio: 'inherit',
				env,
			});

child.on('exit', (code, signal) => {
	if (signal) {
		process.kill(process.pid, signal);
		return;
	}

	process.exit(code ?? 0);
});
