import { Bash } from 'just-bash';
import { fs as zenfs, InMemory, configure } from '@zenfs/core';
import { ZenFsAdapter } from '../src/ZenFsAdapter';

describe('zen-bash: just-bash with zen-fs filesystem', () => {
  let adapter: ZenFsAdapter;

  beforeEach(async () => {
    await configure({ mounts: { '/': InMemory } });
    adapter = new ZenFsAdapter();
    zenfs.mkdirSync('/tmp', { recursive: true });
    zenfs.mkdirSync('/home', { recursive: true });
  });

  describe('just-bash operating on zen-fs filesystem via adapter', () => {
    it('writes a file via just-bash, reads it via zen-fs', async () => {
      const bash = new Bash({ fs: adapter });

      await bash.exec('echo "hello from bash" > /tmp/test.txt');

      const content = zenfs.readFileSync('/tmp/test.txt', 'utf-8');
      expect(content).toBe('hello from bash\n');
    });

    it('creates directories via just-bash, verifies via zen-fs', async () => {
      const bash = new Bash({ fs: adapter });

      await bash.exec('mkdir -p /home/user/projects/myapp');
      await bash.exec('echo "# My App" > /home/user/projects/myapp/README.md');

      expect(zenfs.existsSync('/home/user/projects/myapp')).toBe(true);
      expect(zenfs.existsSync('/home/user/projects/myapp/README.md')).toBe(true);
      expect(zenfs.readFileSync('/home/user/projects/myapp/README.md', 'utf-8')).toBe('# My App\n');
    });

    it('appends to a file via just-bash, verifies via zen-fs', async () => {
      const bash = new Bash({ fs: adapter });

      await bash.exec('echo "line1" > /tmp/log.txt');
      await bash.exec('echo "line2" >> /tmp/log.txt');
      await bash.exec('echo "line3" >> /tmp/log.txt');

      const content = zenfs.readFileSync('/tmp/log.txt', 'utf-8');
      expect(content).toBe('line1\nline2\nline3\n');
    });

    it('copies files via just-bash, verifies via zen-fs', async () => {
      const bash = new Bash({ fs: adapter });

      await bash.exec('echo "original content" > /tmp/original.txt');
      await bash.exec('cp /tmp/original.txt /tmp/copy.txt');

      expect(zenfs.existsSync('/tmp/copy.txt')).toBe(true);
      expect(zenfs.readFileSync('/tmp/copy.txt', 'utf-8')).toBe('original content\n');
    });

    it('moves files via just-bash, verifies via zen-fs', async () => {
      const bash = new Bash({ fs: adapter });

      await bash.exec('echo "movable content" > /tmp/source.txt');
      await bash.exec('mv /tmp/source.txt /tmp/destination.txt');

      expect(zenfs.existsSync('/tmp/source.txt')).toBe(false);
      expect(zenfs.existsSync('/tmp/destination.txt')).toBe(true);
      expect(zenfs.readFileSync('/tmp/destination.txt', 'utf-8')).toBe('movable content\n');
    });

    it('removes files via just-bash, verifies via zen-fs', async () => {
      const bash = new Bash({ fs: adapter });

      await bash.exec('echo "temporary" > /tmp/temp.txt');
      expect(zenfs.existsSync('/tmp/temp.txt')).toBe(true);

      await bash.exec('rm /tmp/temp.txt');
      expect(zenfs.existsSync('/tmp/temp.txt')).toBe(false);
    });
  });

  describe('bidirectional file operations', () => {
    it('zen-fs writes, just-bash reads and processes', async () => {
      zenfs.writeFileSync('/tmp/data.csv', 'name,age\nAlice,30\nBob,25\nCharlie,35');

      const bash = new Bash({ fs: adapter });
      const result = await bash.exec('cat /tmp/data.csv | grep -c ","');

      expect(result.stdout.trim()).toBe('4');
    });

    it('just-bash processes, zen-fs stores result', async () => {
      zenfs.writeFileSync('/tmp/numbers.txt', '10\n20\n30\n40\n50\n');

      const bash = new Bash({ fs: adapter });
      await bash.exec('cat /tmp/numbers.txt | wc -l > /tmp/count.txt');

      const count = zenfs.readFileSync('/tmp/count.txt', 'utf-8');
      expect(count.trim()).toBe('5');
    });

    it('complex workflow: zen-fs setup, bash transform, zen-fs verify', async () => {
      zenfs.mkdirSync('/workspace/input', { recursive: true });
      zenfs.mkdirSync('/workspace/output', { recursive: true });
      zenfs.writeFileSync('/workspace/input/config.env', 'DB_HOST=localhost\nDB_PORT=5432\nDB_NAME=mydb');

      const bash = new Bash({ fs: adapter });

      await bash.exec('grep DB_HOST /workspace/input/config.env | cut -d= -f2 > /workspace/output/host.txt');
      await bash.exec('grep DB_PORT /workspace/input/config.env | cut -d= -f2 > /workspace/output/port.txt');

      expect(zenfs.readFileSync('/workspace/output/host.txt', 'utf-8').trim()).toBe('localhost');
      expect(zenfs.readFileSync('/workspace/output/port.txt', 'utf-8').trim()).toBe('5432');
    });
  });
});
