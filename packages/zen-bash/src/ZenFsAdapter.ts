import { fs as zenfs } from '@zenfs/core';
import * as path from 'path';

export interface FsStat {
  isFile: boolean;
  isDirectory: boolean;
  isSymbolicLink: boolean;
  mode: number;
  size: number;
  mtime: Date;
}

export interface MkdirOptions {
  recursive?: boolean;
}

export interface RmOptions {
  recursive?: boolean;
  force?: boolean;
}

export interface CpOptions {
  recursive?: boolean;
}

export interface ReadFileOptions {
  encoding?: string | null;
}

export interface WriteFileOptions {
  encoding?: string;
}

export type FileContent = string | Uint8Array;

export class ZenFsAdapter {
  async readFile(filePath: string, options?: ReadFileOptions | string): Promise<string> {
    const encoding = typeof options === 'string' ? options : options?.encoding ?? 'utf-8';
    return zenfs.readFileSync(filePath, encoding as BufferEncoding);
  }

  async readFileBuffer(filePath: string): Promise<Uint8Array> {
    const buffer = zenfs.readFileSync(filePath);
    if (typeof buffer === 'string') {
      return new TextEncoder().encode(buffer);
    }
    return new Uint8Array(buffer);
  }

  async writeFile(filePath: string, content: FileContent, options?: WriteFileOptions | string): Promise<void> {
    this.ensureParentDirs(filePath);
    zenfs.writeFileSync(filePath, content);
  }

  async appendFile(filePath: string, content: FileContent, options?: WriteFileOptions | string): Promise<void> {
    this.ensureParentDirs(filePath);
    zenfs.appendFileSync(filePath, content);
  }

  async exists(filePath: string): Promise<boolean> {
    return zenfs.existsSync(filePath);
  }

  async stat(filePath: string): Promise<FsStat> {
    const stats = zenfs.statSync(filePath);
    return {
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      isSymbolicLink: stats.isSymbolicLink(),
      mode: stats.mode,
      size: stats.size,
      mtime: stats.mtime,
    };
  }

  async lstat(filePath: string): Promise<FsStat> {
    const stats = zenfs.lstatSync(filePath);
    return {
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      isSymbolicLink: stats.isSymbolicLink(),
      mode: stats.mode,
      size: stats.size,
      mtime: stats.mtime,
    };
  }

  async mkdir(dirPath: string, options?: MkdirOptions): Promise<void> {
    zenfs.mkdirSync(dirPath, { recursive: options?.recursive });
  }

  async readdir(dirPath: string): Promise<string[]> {
    return zenfs.readdirSync(dirPath) as string[];
  }

  async rm(filePath: string, options?: RmOptions): Promise<void> {
    try {
      zenfs.rmSync(filePath, { recursive: options?.recursive, force: options?.force });
    } catch (e) {
      if (!options?.force) throw e;
    }
  }

  async cp(src: string, dest: string, options?: CpOptions): Promise<void> {
    const srcStat = zenfs.statSync(src);
    if (srcStat.isDirectory()) {
      if (!options?.recursive) {
        throw new Error(`EISDIR: is a directory, cp '${src}'`);
      }
      zenfs.mkdirSync(dest, { recursive: true });
      const entries = zenfs.readdirSync(src) as string[];
      for (const entry of entries) {
        await this.cp(path.posix.join(src, entry), path.posix.join(dest, entry), options);
      }
    } else {
      this.ensureParentDirs(dest);
      zenfs.copyFileSync(src, dest);
    }
  }

  async mv(src: string, dest: string): Promise<void> {
    zenfs.renameSync(src, dest);
  }

  resolvePath(base: string, filePath: string): string {
    if (filePath.startsWith('/')) {
      return path.posix.normalize(filePath);
    }
    return path.posix.normalize(path.posix.join(base, filePath));
  }

  getAllPaths(): string[] {
    const paths: string[] = [];
    this.walkDir('/', paths);
    return paths;
  }

  private walkDir(dir: string, paths: string[]): void {
    paths.push(dir);
    try {
      const entries = zenfs.readdirSync(dir) as string[];
      for (const entry of entries) {
        const fullPath = dir === '/' ? `/${entry}` : `${dir}/${entry}`;
        try {
          const stats = zenfs.lstatSync(fullPath);
          if (stats.isDirectory()) {
            this.walkDir(fullPath, paths);
          } else {
            paths.push(fullPath);
          }
        } catch {
          paths.push(fullPath);
        }
      }
    } catch {
      // Directory not readable, skip
    }
  }

  async chmod(filePath: string, mode: number): Promise<void> {
    zenfs.chmodSync(filePath, mode);
  }

  async symlink(target: string, linkPath: string): Promise<void> {
    this.ensureParentDirs(linkPath);
    zenfs.symlinkSync(target, linkPath);
  }

  async link(existingPath: string, newPath: string): Promise<void> {
    this.ensureParentDirs(newPath);
    zenfs.linkSync(existingPath, newPath);
  }

  async readlink(linkPath: string): Promise<string> {
    const result = zenfs.readlinkSync(linkPath);
    return typeof result === 'string' ? result : result.toString('utf-8');
  }

  private ensureParentDirs(filePath: string): void {
    const dir = path.posix.dirname(filePath);
    if (dir && dir !== '/' && !zenfs.existsSync(dir)) {
      zenfs.mkdirSync(dir, { recursive: true });
    }
  }
}
