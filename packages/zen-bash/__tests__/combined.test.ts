import { Bash } from 'just-bash';
import { fs as zenfs, InMemory, configure } from '@zenfs/core';

describe('zen-bash: combining just-bash with zen-fs', () => {
  describe('using just-bash VirtualFs (default)', () => {
    it('executes bash commands with built-in virtual filesystem', async () => {
      const bash = new Bash();
      await bash.exec('echo "hello from just-bash" > /tmp/test.txt');
      const result = await bash.exec('cat /tmp/test.txt');
      expect(result.stdout).toBe('hello from just-bash\n');
    });

    it('supports complex file operations', async () => {
      const bash = new Bash();
      await bash.exec('mkdir -p /tmp/project/src');
      await bash.exec('echo "console.log(42)" > /tmp/project/src/index.js');
      await bash.exec('cp /tmp/project/src/index.js /tmp/project/src/backup.js');
      const result = await bash.exec('cat /tmp/project/src/backup.js');
      expect(result.stdout).toBe('console.log(42)\n');
    });
  });

  describe('using zen-fs InMemory backend', () => {
    beforeEach(async () => {
      await configure({ mounts: { '/': InMemory } });
    });

    it('performs file operations with zen-fs', async () => {
      zenfs.writeFileSync('/data.txt', 'zen-fs content');
      const content = zenfs.readFileSync('/data.txt', 'utf-8');
      expect(content).toBe('zen-fs content');
    });

    it('creates directories and files', async () => {
      zenfs.mkdirSync('/project/src', { recursive: true });
      zenfs.writeFileSync('/project/src/main.ts', 'export const x = 1;');
      const files = zenfs.readdirSync('/project/src');
      expect(files).toContain('main.ts');
    });
  });

  describe('interoperability patterns', () => {
    beforeEach(async () => {
      await configure({ mounts: { '/': InMemory } });
    });

    it('prepares files with zen-fs, processes with just-bash', async () => {
      zenfs.mkdirSync('/workspace', { recursive: true });
      zenfs.writeFileSync('/workspace/input.txt', 'line1\nline2\nline3\n');

      const bash = new Bash({
        files: {
          '/workspace/input.txt': zenfs.readFileSync('/workspace/input.txt', 'utf-8')
        }
      });

      const result = await bash.exec('wc -l < /workspace/input.txt');
      expect(result.stdout.trim()).toBe('3');
    });

    it('uses just-bash for text processing, zen-fs for storage', async () => {
      const bash = new Bash({
        files: { '/data/users.json': '[{"name":"Alice"},{"name":"Bob"}]' }
      });

      const result = await bash.exec('cat /data/users.json | grep -o \'"name":"[^"]*"\' | wc -l');
      expect(result.stdout.trim()).toBe('2');

      zenfs.mkdirSync('/processed', { recursive: true });
      zenfs.writeFileSync('/processed/count.txt', result.stdout.trim());
      expect(zenfs.readFileSync('/processed/count.txt', 'utf-8')).toBe('2');
    });

    it('combines bash scripting with zen-fs file management', async () => {
      zenfs.mkdirSync('/scripts', { recursive: true });
      zenfs.writeFileSync('/scripts/config.env', 'APP_NAME=myapp\nAPP_VERSION=1.0.0');

      const bash = new Bash({
        files: {
          '/scripts/config.env': zenfs.readFileSync('/scripts/config.env', 'utf-8')
        }
      });

      const nameResult = await bash.exec('grep APP_NAME /scripts/config.env | cut -d= -f2');
      const versionResult = await bash.exec('grep APP_VERSION /scripts/config.env | cut -d= -f2');

      expect(nameResult.stdout.trim()).toBe('myapp');
      expect(versionResult.stdout.trim()).toBe('1.0.0');

      zenfs.mkdirSync('/output', { recursive: true });
      zenfs.writeFileSync('/output/app-info.json', JSON.stringify({
        name: nameResult.stdout.trim(),
        version: versionResult.stdout.trim()
      }));

      const appInfo = JSON.parse(zenfs.readFileSync('/output/app-info.json', 'utf-8'));
      expect(appInfo.name).toBe('myapp');
      expect(appInfo.version).toBe('1.0.0');
    });
  });

  describe('parallel usage patterns', () => {
    it('maintains separate filesystems for isolation', async () => {
      await configure({ mounts: { '/': InMemory } });

      const bash1 = new Bash({ files: { '/config.txt': 'env=dev' } });
      const bash2 = new Bash({ files: { '/config.txt': 'env=prod' } });

      const result1 = await bash1.exec('cat /config.txt');
      const result2 = await bash2.exec('cat /config.txt');

      expect(result1.stdout).toBe('env=dev');
      expect(result2.stdout).toBe('env=prod');

      zenfs.writeFileSync('/shared.txt', 'shared data');
      expect(zenfs.readFileSync('/shared.txt', 'utf-8')).toBe('shared data');
    });
  });
});
