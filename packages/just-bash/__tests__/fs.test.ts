import { Bash } from 'just-bash';

describe('just-bash basic filesystem operations', () => {
  let bash: Bash;

  beforeEach(() => {
    bash = new Bash();
  });

  describe('read/write operations', () => {
    it('writes and reads a file', async () => {
      await bash.exec('echo "hello world" > /tmp/test.txt');
      const result = await bash.exec('cat /tmp/test.txt');
      expect(result.stdout).toBe('hello world\n');
      expect(result.exitCode).toBe(0);
    });

    it('appends to a file', async () => {
      await bash.exec('echo "line1" > /tmp/append.txt');
      await bash.exec('echo "line2" >> /tmp/append.txt');
      const result = await bash.exec('cat /tmp/append.txt');
      expect(result.stdout).toBe('line1\nline2\n');
    });

    it('initializes with provided files', async () => {
      const bashWithFiles = new Bash({
        files: { '/data/config.json': '{"key": "value"}' }
      });
      const result = await bashWithFiles.exec('cat /data/config.json');
      expect(result.stdout).toBe('{"key": "value"}');
    });
  });

  describe('directory operations', () => {
    it('creates directories with mkdir -p', async () => {
      await bash.exec('mkdir -p /tmp/a/b/c');
      const result = await bash.exec('ls -d /tmp/a/b/c');
      expect(result.exitCode).toBe(0);
    });

    it('lists directory contents', async () => {
      await bash.exec('mkdir /tmp/dir');
      await bash.exec('touch /tmp/dir/file1.txt /tmp/dir/file2.txt');
      const result = await bash.exec('ls /tmp/dir');
      expect(result.stdout).toContain('file1.txt');
      expect(result.stdout).toContain('file2.txt');
    });
  });

  describe('copy and move operations', () => {
    it('copies a file', async () => {
      await bash.exec('echo "content" > /tmp/src.txt');
      await bash.exec('cp /tmp/src.txt /tmp/dest.txt');
      const result = await bash.exec('cat /tmp/dest.txt');
      expect(result.stdout).toBe('content\n');
    });

    it('moves a file', async () => {
      await bash.exec('echo "moveme" > /tmp/old.txt');
      await bash.exec('mv /tmp/old.txt /tmp/new.txt');
      const newResult = await bash.exec('cat /tmp/new.txt');
      expect(newResult.stdout).toBe('moveme\n');
      const oldResult = await bash.exec('cat /tmp/old.txt');
      expect(oldResult.exitCode).not.toBe(0);
    });

    it('copies directories recursively', async () => {
      await bash.exec('mkdir -p /tmp/srcdir/sub');
      await bash.exec('echo "nested" > /tmp/srcdir/sub/file.txt');
      await bash.exec('cp -r /tmp/srcdir /tmp/destdir');
      const result = await bash.exec('cat /tmp/destdir/sub/file.txt');
      expect(result.stdout).toBe('nested\n');
    });
  });

  describe('remove operations', () => {
    it('removes a file', async () => {
      await bash.exec('echo "delete" > /tmp/todelete.txt');
      await bash.exec('rm /tmp/todelete.txt');
      const result = await bash.exec('cat /tmp/todelete.txt');
      expect(result.exitCode).not.toBe(0);
    });

    it('removes directories recursively', async () => {
      await bash.exec('mkdir -p /tmp/rmdir/sub');
      await bash.exec('touch /tmp/rmdir/sub/file.txt');
      await bash.exec('rm -rf /tmp/rmdir');
      const result = await bash.exec('ls /tmp/rmdir');
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe('symbolic links', () => {
    it('creates and reads symlinks', async () => {
      await bash.exec('echo "target" > /tmp/target.txt');
      await bash.exec('ln -s /tmp/target.txt /tmp/link.txt');
      const result = await bash.exec('cat /tmp/link.txt');
      expect(result.stdout).toBe('target\n');
    });

    it('reads link target with readlink', async () => {
      await bash.exec('touch /tmp/real.txt');
      await bash.exec('ln -s /tmp/real.txt /tmp/sym.txt');
      const result = await bash.exec('readlink /tmp/sym.txt');
      expect(result.stdout.trim()).toBe('/tmp/real.txt');
    });
  });

  describe('error handling', () => {
    it('returns error for missing files', async () => {
      const result = await bash.exec('cat /nonexistent.txt');
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr.length).toBeGreaterThan(0);
    });

    it('returns error for invalid copy', async () => {
      const result = await bash.exec('cp /nonexistent /tmp/dest');
      expect(result.exitCode).not.toBe(0);
    });
  });
});
