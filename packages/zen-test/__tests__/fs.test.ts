import { fs, InMemory, configure } from '@zenfs/core';

describe('zen-fs basic file operations', () => {
  beforeEach(async () => {
    await configure({ mounts: { '/': InMemory } });
  });

  describe('in-memory file operations', () => {
    it('writes and reads a file', async () => {
      fs.writeFileSync('/test.txt', 'hello world');
      const content = fs.readFileSync('/test.txt', 'utf-8');
      expect(content).toBe('hello world');
    });

    it('appends to a file', async () => {
      fs.writeFileSync('/append.txt', 'line1\n');
      fs.appendFileSync('/append.txt', 'line2\n');
      const content = fs.readFileSync('/append.txt', 'utf-8');
      expect(content).toBe('line1\nline2\n');
    });

    it('checks file existence', async () => {
      fs.writeFileSync('/exists.txt', 'content');
      expect(fs.existsSync('/exists.txt')).toBe(true);
      expect(fs.existsSync('/nonexistent.txt')).toBe(false);
    });
  });

  describe('directory operations', () => {
    it('creates directories recursively', async () => {
      fs.mkdirSync('/a/b/c', { recursive: true });
      expect(fs.existsSync('/a/b/c')).toBe(true);
    });

    it('lists directory contents', async () => {
      fs.mkdirSync('/dir');
      fs.writeFileSync('/dir/file1.txt', 'content1');
      fs.writeFileSync('/dir/file2.txt', 'content2');
      const files = fs.readdirSync('/dir');
      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.txt');
    });
  });

  describe('copy and move operations', () => {
    it('copies a file', async () => {
      fs.writeFileSync('/src.txt', 'content');
      fs.copyFileSync('/src.txt', '/dest.txt');
      const content = fs.readFileSync('/dest.txt', 'utf-8');
      expect(content).toBe('content');
    });

    it('renames a file', async () => {
      fs.writeFileSync('/old.txt', 'content');
      fs.renameSync('/old.txt', '/new.txt');
      expect(fs.existsSync('/old.txt')).toBe(false);
      expect(fs.readFileSync('/new.txt', 'utf-8')).toBe('content');
    });
  });

  describe('remove operations', () => {
    it('removes a file', async () => {
      fs.writeFileSync('/todelete.txt', 'content');
      fs.unlinkSync('/todelete.txt');
      expect(fs.existsSync('/todelete.txt')).toBe(false);
    });

    it('removes directories recursively', async () => {
      fs.mkdirSync('/rmdir/sub', { recursive: true });
      fs.writeFileSync('/rmdir/sub/file.txt', 'content');
      fs.rmSync('/rmdir', { recursive: true });
      expect(fs.existsSync('/rmdir')).toBe(false);
    });
  });

  describe('file stats', () => {
    it('gets file stats', async () => {
      fs.writeFileSync('/statfile.txt', 'hello');
      const stats = fs.statSync('/statfile.txt');
      expect(stats.isFile()).toBe(true);
      expect(stats.isDirectory()).toBe(false);
      expect(stats.size).toBe(5);
    });

    it('distinguishes files and directories', async () => {
      fs.writeFileSync('/file.txt', 'content');
      fs.mkdirSync('/directory');
      expect(fs.statSync('/file.txt').isFile()).toBe(true);
      expect(fs.statSync('/directory').isDirectory()).toBe(true);
    });
  });

  describe('symbolic links', () => {
    it('creates and reads symlinks', async () => {
      fs.writeFileSync('/target.txt', 'target content');
      fs.symlinkSync('/target.txt', '/link.txt');
      const content = fs.readFileSync('/link.txt', 'utf-8');
      expect(content).toBe('target content');
    });

    it('reads link target with readlink', async () => {
      fs.writeFileSync('/real.txt', 'content');
      fs.symlinkSync('/real.txt', '/sym.txt');
      const target = fs.readlinkSync('/sym.txt');
      expect(target).toBe('/real.txt');
    });
  });

  describe('error handling', () => {
    it('throws error for missing files', async () => {
      expect(() => fs.readFileSync('/nonexistent.txt')).toThrow();
    });

    it('throws error for invalid operations', async () => {
      expect(() => fs.rmdirSync('/nonexistent')).toThrow();
    });
  });
});
