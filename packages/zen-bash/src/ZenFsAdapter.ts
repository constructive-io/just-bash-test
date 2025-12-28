import { fs } from '@zenfs/core';
import { posix } from 'path';

type StatLike = { isFile(): boolean; isDirectory(): boolean; isSymbolicLink(): boolean; mode: number | bigint; size: number | bigint; mtime: Date };
const toStat = (s: StatLike) => ({
  isFile: s.isFile(),
  isDirectory: s.isDirectory(),
  isSymbolicLink: s.isSymbolicLink(),
  mode: Number(s.mode),
  size: Number(s.size),
  mtime: s.mtime,
});

export class ZenFsAdapter {
  readFile = (p: string) => fs.promises.readFile(p, 'utf-8');
  readFileBuffer = async (p: string) => new Uint8Array(await fs.promises.readFile(p));
  writeFile = (p: string, c: string | Uint8Array) => fs.promises.writeFile(p, c);
  appendFile = (p: string, c: string | Uint8Array) => fs.promises.appendFile(p, c);
  exists = (p: string) => fs.promises.exists(p);
  mkdir = async (p: string, o?: { recursive?: boolean }) => { await fs.promises.mkdir(p, o); };
  readdir = (p: string) => fs.promises.readdir(p) as Promise<string[]>;
  rm = (p: string, o?: { recursive?: boolean; force?: boolean }) => fs.promises.rm(p, o);
  cp = (s: string, d: string, o?: { recursive?: boolean }) => fs.promises.cp(s, d, o);
  mv = async (s: string, d: string) => { await fs.promises.rename(s, d); };
  chmod = (p: string, m: number) => fs.promises.chmod(p, m);
  symlink = (t: string, l: string) => fs.promises.symlink(t, l);
  link = (e: string, n: string) => fs.promises.link(e, n);
  readlink = (p: string) => fs.promises.readlink(p);
  stat = async (p: string) => toStat(await fs.promises.stat(p));
  lstat = async (p: string) => toStat(await fs.promises.lstat(p));
  resolvePath = (base: string, p: string) => posix.normalize(p.startsWith('/') ? p : posix.join(base, p));

  getAllPaths(): string[] {
    const walk = (dir: string): string[] => {
      const paths = [dir];
      try {
        for (const e of fs.readdirSync(dir)) {
          const full = dir === '/' ? `/${e}` : `${dir}/${e}`;
          paths.push(...(fs.lstatSync(full).isDirectory() ? walk(full) : [full]));
        }
      } catch { /* skip unreadable */ }
      return paths;
    };
    return walk('/');
  }
}
