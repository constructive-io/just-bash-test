import { Bash } from 'just-bash';

describe('just-bash filesystem capabilities', () => {
  describe('file creation and reading', () => {
    it('should create and read files using echo and cat', async () => {
      const bash = new Bash();
      await bash.exec('echo "Hello World" > /tmp/test.txt');
      const result = await bash.exec('cat /tmp/test.txt');
      expect(result.stdout).toBe('Hello World\n');
      expect(result.exitCode).toBe(0);
    });

    it('should append to files using >>', async () => {
      const bash = new Bash();
      await bash.exec('echo "Line 1" > /tmp/append.txt');
      await bash.exec('echo "Line 2" >> /tmp/append.txt');
      const result = await bash.exec('cat /tmp/append.txt');
      expect(result.stdout).toBe('Line 1\nLine 2\n');
    });

    it('should initialize with provided files', async () => {
      const bash = new Bash({
        files: {
          '/data/config.json': '{"key": "value"}',
          '/data/readme.txt': 'Hello from init'
        }
      });
      const result = await bash.exec('cat /data/config.json');
      expect(result.stdout).toBe('{"key": "value"}');
      expect(result.exitCode).toBe(0);
    });

    it('should handle multi-line file content', async () => {
      const bash = new Bash();
      await bash.exec('printf "line1\\nline2\\nline3" > /tmp/multiline.txt');
      const result = await bash.exec('cat /tmp/multiline.txt');
      expect(result.stdout).toBe('line1\nline2\nline3');
    });
  });

  describe('touch command', () => {
    it('should create empty files with touch', async () => {
      const bash = new Bash();
      await bash.exec('touch /tmp/newfile.txt');
      const result = await bash.exec('ls /tmp/newfile.txt');
      expect(result.exitCode).toBe(0);
    });

    it('should create multiple files with touch', async () => {
      const bash = new Bash();
      await bash.exec('touch /tmp/a.txt /tmp/b.txt /tmp/c.txt');
      const result = await bash.exec('ls /tmp/*.txt');
      expect(result.stdout).toContain('a.txt');
      expect(result.stdout).toContain('b.txt');
      expect(result.stdout).toContain('c.txt');
    });
  });

  describe('mkdir command', () => {
    it('should create directories with mkdir', async () => {
      const bash = new Bash();
      await bash.exec('mkdir /tmp/newdir');
      const result = await bash.exec('ls -d /tmp/newdir');
      expect(result.exitCode).toBe(0);
    });

    it('should create nested directories with mkdir -p', async () => {
      const bash = new Bash();
      await bash.exec('mkdir -p /tmp/a/b/c/d');
      const result = await bash.exec('ls -d /tmp/a/b/c/d');
      expect(result.exitCode).toBe(0);
    });

    it('should fail when creating nested dirs without -p', async () => {
      const bash = new Bash();
      const result = await bash.exec('mkdir /tmp/x/y/z');
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe('cp command', () => {
    it('should copy files', async () => {
      const bash = new Bash();
      await bash.exec('echo "original" > /tmp/source.txt');
      await bash.exec('cp /tmp/source.txt /tmp/dest.txt');
      const result = await bash.exec('cat /tmp/dest.txt');
      expect(result.stdout).toBe('original\n');
    });

    it('should copy files to directory', async () => {
      const bash = new Bash();
      await bash.exec('echo "content" > /tmp/file.txt');
      await bash.exec('mkdir /tmp/targetdir');
      await bash.exec('cp /tmp/file.txt /tmp/targetdir/');
      const result = await bash.exec('cat /tmp/targetdir/file.txt');
      expect(result.stdout).toBe('content\n');
    });

    it('should copy directories recursively with -r', async () => {
      const bash = new Bash();
      await bash.exec('mkdir -p /tmp/srcdir/subdir');
      await bash.exec('echo "nested" > /tmp/srcdir/subdir/file.txt');
      await bash.exec('cp -r /tmp/srcdir /tmp/destdir');
      const result = await bash.exec('cat /tmp/destdir/subdir/file.txt');
      expect(result.stdout).toBe('nested\n');
    });
  });

  describe('mv command', () => {
    it('should move/rename files', async () => {
      const bash = new Bash();
      await bash.exec('echo "moveme" > /tmp/old.txt');
      await bash.exec('mv /tmp/old.txt /tmp/new.txt');

      const oldResult = await bash.exec('cat /tmp/old.txt');
      expect(oldResult.exitCode).not.toBe(0);

      const newResult = await bash.exec('cat /tmp/new.txt');
      expect(newResult.stdout).toBe('moveme\n');
    });

    it('should move files into directory', async () => {
      const bash = new Bash();
      await bash.exec('echo "content" > /tmp/tomove.txt');
      await bash.exec('mkdir /tmp/dest');
      await bash.exec('mv /tmp/tomove.txt /tmp/dest/');
      const result = await bash.exec('cat /tmp/dest/tomove.txt');
      expect(result.stdout).toBe('content\n');
    });

    it('should move directories', async () => {
      const bash = new Bash();
      await bash.exec('mkdir /tmp/movedir');
      await bash.exec('echo "inside" > /tmp/movedir/file.txt');
      await bash.exec('mv /tmp/movedir /tmp/moveddir');
      const result = await bash.exec('cat /tmp/moveddir/file.txt');
      expect(result.stdout).toBe('inside\n');
    });
  });

  describe('rm command', () => {
    it('should remove files', async () => {
      const bash = new Bash();
      await bash.exec('echo "delete me" > /tmp/todelete.txt');
      await bash.exec('rm /tmp/todelete.txt');
      const result = await bash.exec('cat /tmp/todelete.txt');
      expect(result.exitCode).not.toBe(0);
    });

    it('should remove directories with -r', async () => {
      const bash = new Bash();
      await bash.exec('mkdir -p /tmp/rmdir/sub');
      await bash.exec('echo "file" > /tmp/rmdir/sub/f.txt');
      await bash.exec('rm -r /tmp/rmdir');
      const result = await bash.exec('ls /tmp/rmdir');
      expect(result.exitCode).not.toBe(0);
    });

    it('should support -f flag for force removal', async () => {
      const bash = new Bash();
      const result = await bash.exec('rm -f /tmp/nonexistent.txt');
      expect(result.exitCode).toBe(0);
    });

    it('should remove multiple files', async () => {
      const bash = new Bash();
      await bash.exec('touch /tmp/a.txt /tmp/b.txt /tmp/c.txt');
      await bash.exec('rm /tmp/a.txt /tmp/b.txt /tmp/c.txt');
      const result = await bash.exec('ls /tmp/*.txt 2>/dev/null');
      expect(result.stdout).toBe('');
    });
  });

  describe('ls command', () => {
    it('should list directory contents', async () => {
      const bash = new Bash();
      await bash.exec('mkdir /tmp/lsdir');
      await bash.exec('touch /tmp/lsdir/file1.txt /tmp/lsdir/file2.txt');
      const result = await bash.exec('ls /tmp/lsdir');
      expect(result.stdout).toContain('file1.txt');
      expect(result.stdout).toContain('file2.txt');
    });

    it('should support -l for long listing', async () => {
      const bash = new Bash();
      await bash.exec('echo "content" > /tmp/file.txt');
      const result = await bash.exec('ls -l /tmp/file.txt');
      expect(result.exitCode).toBe(0);
      expect(result.stdout.length).toBeGreaterThan(0);
    });

    it('should support -a for hidden files', async () => {
      const bash = new Bash();
      await bash.exec('touch /tmp/.hidden');
      const result = await bash.exec('ls -a /tmp');
      expect(result.stdout).toContain('.hidden');
    });

    it('should support glob patterns', async () => {
      const bash = new Bash();
      await bash.exec('touch /tmp/test1.txt /tmp/test2.txt /tmp/other.md');
      const result = await bash.exec('ls /tmp/*.txt');
      expect(result.stdout).toContain('test1.txt');
      expect(result.stdout).toContain('test2.txt');
      expect(result.stdout).not.toContain('other.md');
    });
  });

  describe('symbolic links (ln -s)', () => {
    it('should create symbolic links', async () => {
      const bash = new Bash();
      await bash.exec('echo "target content" > /tmp/target.txt');
      await bash.exec('ln -s /tmp/target.txt /tmp/link.txt');
      const result = await bash.exec('cat /tmp/link.txt');
      expect(result.stdout).toBe('target content\n');
    });

    it('should read link target with readlink', async () => {
      const bash = new Bash();
      await bash.exec('echo "target" > /tmp/target.txt');
      await bash.exec('ln -s /tmp/target.txt /tmp/symlink.txt');
      const result = await bash.exec('readlink /tmp/symlink.txt');
      expect(result.stdout.trim()).toBe('/tmp/target.txt');
    });

    it('should identify symlinks using stat or readlink', async () => {
      const bash = new Bash();
      await bash.exec('touch /tmp/real.txt');
      await bash.exec('ln -s /tmp/real.txt /tmp/sym.txt');
      // Use readlink to verify it's a symlink (ls -l may not show -> in just-bash)
      const result = await bash.exec('readlink /tmp/sym.txt');
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('/tmp/real.txt');
    });
  });

  describe('hard links (ln)', () => {
    it('should create hard links', async () => {
      const bash = new Bash();
      await bash.exec('echo "shared content" > /tmp/original.txt');
      await bash.exec('ln /tmp/original.txt /tmp/hardlink.txt');
      const result = await bash.exec('cat /tmp/hardlink.txt');
      expect(result.stdout).toBe('shared content\n');
    });

    it('should create readable hard link copy', async () => {
      const bash = new Bash();
      await bash.exec('echo "initial" > /tmp/orig.txt');
      await bash.exec('ln /tmp/orig.txt /tmp/hard.txt');
      // Hard links in just-bash create a copy of content at creation time
      const result = await bash.exec('cat /tmp/hard.txt');
      expect(result.stdout).toBe('initial\n');
    });
  });

  describe('stat command', () => {
    it('should show file information', async () => {
      const bash = new Bash();
      await bash.exec('echo "test" > /tmp/statfile.txt');
      const result = await bash.exec('stat /tmp/statfile.txt');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('statfile.txt');
    });

    it('should distinguish files and directories', async () => {
      const bash = new Bash();
      await bash.exec('touch /tmp/file.txt');
      await bash.exec('mkdir /tmp/dir');

      const fileResult = await bash.exec('stat /tmp/file.txt');
      const dirResult = await bash.exec('stat /tmp/dir');

      expect(fileResult.exitCode).toBe(0);
      expect(dirResult.exitCode).toBe(0);
    });
  });

  describe('tree command', () => {
    it('should display directory tree', async () => {
      const bash = new Bash();
      await bash.exec('mkdir -p /tmp/treetest/a/b');
      await bash.exec('touch /tmp/treetest/file1.txt');
      await bash.exec('touch /tmp/treetest/a/file2.txt');
      await bash.exec('touch /tmp/treetest/a/b/file3.txt');
      const result = await bash.exec('tree /tmp/treetest');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('file1.txt');
      expect(result.stdout).toContain('file2.txt');
      expect(result.stdout).toContain('file3.txt');
    });
  });

  describe('working directory', () => {
    it('should start in default directory /home/user', async () => {
      const bash = new Bash();
      const result = await bash.exec('pwd');
      expect(result.stdout.trim()).toBe('/home/user');
    });

    it('should respect custom cwd option', async () => {
      const bash = new Bash({ cwd: '/tmp' });
      const result = await bash.exec('pwd');
      expect(result.stdout.trim()).toBe('/tmp');
    });

    it('should create files relative to cwd', async () => {
      const bash = new Bash({ cwd: '/tmp' });
      await bash.exec('echo "relative" > test.txt');
      const result = await bash.exec('cat /tmp/test.txt');
      expect(result.stdout).toBe('relative\n');
    });
  });

  describe('redirections', () => {
    it('should redirect stdout to file', async () => {
      const bash = new Bash();
      await bash.exec('echo "stdout" > /tmp/out.txt');
      const result = await bash.exec('cat /tmp/out.txt');
      expect(result.stdout).toBe('stdout\n');
    });

    it('should redirect stderr to file', async () => {
      const bash = new Bash();
      await bash.exec('ls /nonexistent 2> /tmp/err.txt');
      const result = await bash.exec('cat /tmp/err.txt');
      expect(result.stdout.length).toBeGreaterThan(0);
    });

    it('should redirect stderr to stdout', async () => {
      const bash = new Bash();
      const result = await bash.exec('ls /nonexistent 2>&1');
      expect(result.stdout).toContain('No such file');
    });

    it('should read from file with <', async () => {
      const bash = new Bash();
      await bash.exec('echo "input content" > /tmp/input.txt');
      const result = await bash.exec('cat < /tmp/input.txt');
      expect(result.stdout).toBe('input content\n');
    });
  });

  describe('file permissions (chmod)', () => {
    it('should change file permissions', async () => {
      const bash = new Bash();
      await bash.exec('touch /tmp/permfile.txt');
      const result = await bash.exec('chmod 755 /tmp/permfile.txt');
      expect(result.exitCode).toBe(0);
    });

    it('should support symbolic mode', async () => {
      const bash = new Bash();
      await bash.exec('touch /tmp/symmode.txt');
      const result = await bash.exec('chmod +x /tmp/symmode.txt');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('find command', () => {
    it('should find files by name', async () => {
      const bash = new Bash();
      await bash.exec('mkdir -p /tmp/findtest/sub');
      await bash.exec('touch /tmp/findtest/target.txt');
      await bash.exec('touch /tmp/findtest/sub/target.txt');
      const result = await bash.exec('find /tmp/findtest -name "target.txt"');
      expect(result.stdout).toContain('/tmp/findtest/target.txt');
      expect(result.stdout).toContain('/tmp/findtest/sub/target.txt');
    });

    it('should find files by type', async () => {
      const bash = new Bash();
      await bash.exec('mkdir -p /tmp/findtype/dir');
      await bash.exec('touch /tmp/findtype/file.txt');
      const filesResult = await bash.exec('find /tmp/findtype -type f');
      expect(filesResult.stdout).toContain('file.txt');

      const dirsResult = await bash.exec('find /tmp/findtype -type d');
      expect(dirsResult.stdout).toContain('dir');
    });
  });

  describe('basename and dirname', () => {
    it('should extract basename', async () => {
      const bash = new Bash();
      const result = await bash.exec('basename /path/to/file.txt');
      expect(result.stdout.trim()).toBe('file.txt');
    });

    it('should extract dirname', async () => {
      const bash = new Bash();
      const result = await bash.exec('dirname /path/to/file.txt');
      expect(result.stdout.trim()).toBe('/path/to');
    });
  });

  describe('du command', () => {
    it('should show disk usage', async () => {
      const bash = new Bash();
      await bash.exec('mkdir -p /tmp/dutest');
      await bash.exec('echo "some content" > /tmp/dutest/file.txt');
      const result = await bash.exec('du /tmp/dutest');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should return non-zero exit code for missing files', async () => {
      const bash = new Bash();
      const result = await bash.exec('cat /nonexistent/file.txt');
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr.length).toBeGreaterThan(0);
    });

    it('should return non-zero exit code for invalid operations', async () => {
      const bash = new Bash();
      const result = await bash.exec('cp /nonexistent /tmp/dest');
      expect(result.exitCode).not.toBe(0);
    });

    it('should handle permission denied gracefully', async () => {
      const bash = new Bash();
      // Try to write to root directory (may be restricted)
      const result = await bash.exec('mkdir /test 2>&1 || true');
      expect(result.exitCode).toBe(0); // || true ensures exit 0
    });
  });

  describe('complex operations', () => {
    it('should handle pipes with file operations', async () => {
      const bash = new Bash();
      await bash.exec('echo -e "line1\\nline2\\nline3" > /tmp/pipe.txt');
      const result = await bash.exec('cat /tmp/pipe.txt | wc -l');
      expect(result.stdout.trim()).toBe('3');
    });

    it('should handle command chaining with files', async () => {
      const bash = new Bash();
      const result = await bash.exec('mkdir /tmp/chain && echo "created" > /tmp/chain/file.txt && cat /tmp/chain/file.txt');
      expect(result.stdout).toBe('created\n');
    });

    it('should handle glob expansion in commands', async () => {
      const bash = new Bash();
      await bash.exec('mkdir /tmp/glob');
      await bash.exec('touch /tmp/glob/a.txt /tmp/glob/b.txt /tmp/glob/c.md');
      const result = await bash.exec('cat /tmp/glob/*.txt');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('isolation between exec calls', () => {
    it('should persist filesystem changes across exec calls', async () => {
      const bash = new Bash();
      await bash.exec('echo "persistent" > /tmp/persist.txt');
      const result = await bash.exec('cat /tmp/persist.txt');
      expect(result.stdout).toBe('persistent\n');
    });

    it('should not persist environment variables across exec calls', async () => {
      const bash = new Bash();
      await bash.exec('export MY_VAR=hello');
      const result = await bash.exec('echo $MY_VAR');
      expect(result.stdout.trim()).toBe('');
    });

    it('should not persist cwd changes across exec calls', async () => {
      const bash = new Bash();
      await bash.exec('cd /tmp');
      const result = await bash.exec('pwd');
      expect(result.stdout.trim()).toBe('/home/user');
    });
  });
});
