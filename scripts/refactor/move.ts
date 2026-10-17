// Moves files with `git mv` and rewrites every reference to them, so a restructure is generated
// from a reviewable mapping file instead of edited by hand.
//
// Usage (from the repo root, Node 24):
//   node scripts/refactor/move.ts <mapping> --dry-run    print the moves, the edits and any warnings
//   node scripts/refactor/move.ts <mapping> --check      print only problems; exit 1 if there are any
//   node scripts/refactor/move.ts <mapping>              move the files and rewrite the references
//   add --reverse to any of these to apply the mapping right-to-left (undo a move)
// Then run `pnpm format` (rewritten imports can outgrow a line), `pnpm check` (svelte-check plus
// the vi.mock specifier check) and the tests. If a run stops partway, the moves made so far are
// staged; `git reset --hard` undoes them on a tree that was clean before.
//
// Mapping file: one move per line, repo-relative paths, `#` starts a comment.
//   src/lib/old-dir -> src/lib/feature/new-dir         a directory: every tracked file in it
//   src/lib/old-dir/Thing.ts -> src/lib/Thing.svelte.ts   a single file
// A file line wins over a directory line that contains it, and a deeper directory line wins over
// a shallower one, so a directory can move with exceptions. Several directories can merge into
// one. A destination can't exist already or be the source of another move (no swaps or chains);
// split those into two runs. A line whose source doesn't exist is a warning, not an error, so a
// branch that deleted a file can still replay the mapping. --reverse is an exact undo only when
// each destination directory was new and no two lines share one; otherwise write the reverse
// mapping with file lines.
//
// What gets rewritten, in tracked .ts/.js/.svelte files under src/ and tests/ (svelte: <script>):
// static and dynamic imports, `export … from`, `import('…')` types, vi.mock/doMock/unmock/doUnmock/
// importActual/importMock strings, and `new URL('…', import.meta.url)`. A specifier is rewritten
// when the file it names or the file containing it moves. It keeps its style: `#lib/…` and
// `$lib/…` stay aliases while the target stays under src/lib, relative paths stay relative, and an
// explicit extension stays explicit (Kit 3's `#lib/x.ts`) while an extensionless relative import
// stays extensionless. `./$types` in a route file (`+page.ts`, …) stays put, since the types
// follow the route; other `$types` imports, including `.svelte-kit/types/…` ones, follow the route
// directory they named (moved by a directory line, or by moving all its `+` files together).
//
// Warnings (--check fails on them): template-literal imports and mocks that may cover a moved file,
// and any tracked text file that still mentions a moved path afterwards (`src/lib/x.ts`,
// `#lib/x.ts`, with or without the extension, or a moved directory), e.g. config globs and docs.
// Not handled: CSS `url()`/`@import`, and untracked files inside a moved directory (they stay).
//
// Rebasing an open branch over the move commit M (its mapping committed in scripts/refactor/;
// hand edits in M or after it are kept). Start from a clean tree, on your branch:
//   git rebase M^                     # 1. put the branch on the commit just before the move
//   B=$(git rev-parse HEAD)           #    (B keeps your branch tip from here on)
//   moved() {                         # 2. replay the move on a commit; prints the result
//     git switch -q --detach "$1" && git restore --source=M -- scripts/refactor &&
//     node scripts/refactor/move.ts scripts/refactor/<mapping> >&2 &&
//     git add scripts/refactor && git commit -qam "moved $1" && git rev-parse HEAD
//   }
//   base=$(moved M^) && mine=$(moved "$B")
//   git diff --binary "$base" "$mine" > /tmp/branch.patch   # 3. your change, in the new layout
//   git switch -C <your-branch> <target>                    # 4. M, or anything after it
//   git apply --3way --index /tmp/branch.patch && pnpm format && pnpm check &&
//     git commit -a
// Files the branch added inside a moved directory move with it. This lands the branch as one
// commit; to keep several, run `moved` on each of them and apply the diffs between consecutive
// results in order.
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const scanDirs = ['src/', 'tests/'];
const codeFile = /\.(?:[cm]?[jt]s|svelte)$/;
const libDir = 'src/lib/';
const aliases = ['#lib', '$lib'];
const mockMethods = new Set(['mock', 'doMock', 'unmock', 'doUnmock', 'importActual', 'importMock']);
// Suffixes a specifier may leave off, tried in this order when the exact path isn't a file.
const impliedSuffixes = ['.ts', '.js', '/index.ts', '/index.js'];
const suffixesLongestFirst = [...impliedSuffixes].sort((a, b) => b.length - a.length);
const mentionSkip = new Set(['pnpm-lock.yaml']);

type Edit = { start: number; end: number; text: string; line: number; from: string };
type Plan = {
  moves: Map<string, string>;
  edits: Map<string, Edit[]>;
  errors: string[];
  warnings: string[];
};

const posix = path.posix;

function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf-8', maxBuffer: 1 << 28 });
}

function parseMapping(text: string, reverse = false): [string, string][] {
  const pairs: [string, string][] = [];
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) continue;
    const parts = line.split('->').map((part) => part.trim().replace(/^\.\/|\/+$/g, ''));
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error(`Bad mapping line (want "old -> new"): ${raw}`);
    }
    pairs.push(reverse ? [parts[1], parts[0]] : [parts[0], parts[1]]);
  }
  return pairs;
}

// Expands directory lines into files; the most specific line for each file wins.
function expandMoves(
  pairs: [string, string][],
  files: Set<string>,
  errors: string[],
  warnings: string[],
) {
  const moves = new Map<string, string>();
  const depthOf = new Map<string, number>();
  const sources = new Set<string>();
  for (const [from, to] of pairs) {
    if (sources.has(from)) errors.push(`${from} is the source of two lines`);
    sources.add(from);
    if (files.has(from)) {
      moves.set(from, to);
      depthOf.set(from, Infinity);
      continue;
    }
    const inside = [...files].filter((file) => file.startsWith(`${from}/`));
    if (!inside.length) warnings.push(`${from}: no tracked file or directory by that name`);
    for (const file of inside) {
      if ((depthOf.get(file) ?? -1) >= from.length) continue;
      moves.set(file, to + file.slice(from.length));
      depthOf.set(file, from.length);
    }
  }
  for (const [from, to] of moves) if (from === to) moves.delete(from);
  const dirs = new Set([...files].flatMap((file) => ancestors(file)));
  const seen = new Map<string, string>();
  for (const [from, to] of moves) {
    if (seen.has(to)) errors.push(`${from} and ${seen.get(to)} both move to ${to}`);
    seen.set(to, from);
    if (moves.has(to)) errors.push(`${from} -> ${to}: ${to} moves too; split this into two runs`);
    else if (dirs.has(to)) errors.push(`${from} -> ${to}: ${to} is a directory; name the file`);
    else if (files.has(to)) errors.push(`${from} -> ${to}: ${to} already exists`);
    // On a case-insensitive filesystem a case-only rename finds its own source here.
    else if (existsSync(to) && to.toLowerCase() !== from.toLowerCase()) {
      errors.push(`${from} -> ${to}: ${to} already exists (untracked)`);
    }
  }
  return moves;
}

function ancestors(file: string) {
  const dirs: string[] = [];
  for (let dir = posix.dirname(file); dir !== '.'; dir = posix.dirname(dir)) dirs.push(dir);
  return dirs;
}

function lineAt(text: string, offset: number) {
  return text.slice(0, offset).split('\n').length;
}

type Found = { node: ts.Expression; offset: number };

// Every module-specifier-like expression in a script, with the offset of its source text.
function findSpecifiers(code: string, offset: number, out: Found[]) {
  const source = ts.createSourceFile('x.ts', code, ts.ScriptTarget.Latest, true);
  const add = (node: ts.Node | undefined) => {
    if (node && ts.isLiteralTypeNode(node)) node = node.literal;
    if (node && (ts.isStringLiteralLike(node) || ts.isTemplateExpression(node))) {
      out.push({ node, offset });
    }
  };
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      add(node.moduleSpecifier);
    } else if (ts.isImportTypeNode(node)) {
      add(node.argument);
    } else if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const arg: ts.Expression | undefined = node.arguments[0];
      if (
        ts.isPropertyAccessExpression(callee) &&
        ts.isIdentifier(callee.expression) &&
        callee.expression.text === 'vi' &&
        mockMethods.has(callee.name.text)
      ) {
        // vi.mock(import('x')) is reached as the inner import() call below.
        if (
          arg &&
          !(ts.isCallExpression(arg) && arg.expression.kind === ts.SyntaxKind.ImportKeyword)
        ) {
          add(arg);
        }
      } else if (callee.kind === ts.SyntaxKind.ImportKeyword) {
        add(arg);
      }
    } else if (
      ts.isNewExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'URL' &&
      node.arguments?.[1]?.getText(source) === 'import.meta.url'
    ) {
      add(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

function specifiersIn(file: string, text: string) {
  const found: Found[] = [];
  if (file.endsWith('.svelte')) {
    for (const match of text.matchAll(/(<script\b[^>]*>)([\s\S]*?)<\/script>/g)) {
      findSpecifiers(match[2], match.index + match[1].length, found);
    }
  } else {
    findSpecifiers(text, 0, found);
  }
  return found;
}

type Target = { file: string; bare: string; suffix: string; alias?: string; query: string };

// Resolves a specifier, as written in `importer`, to a tracked file in the pre-move tree.
function resolve(spec: string, importer: string, files: Set<string>): Target | undefined {
  const queryAt = spec.includes('?') ? spec.indexOf('?') : spec.length;
  const bare = spec.slice(0, queryAt);
  const query = spec.slice(queryAt);
  let base: string;
  let alias: string | undefined;
  const aliasMatch = aliases.find((name) => bare === name || bare.startsWith(`${name}/`));
  if (aliasMatch) {
    alias = aliasMatch;
    base = bare === alias ? `${libDir}index.ts` : libDir + bare.slice(alias.length + 1);
  } else if (bare.startsWith('./') || bare.startsWith('../')) {
    base = posix.join(posix.dirname(importer), bare);
  } else {
    return undefined;
  }
  const file = lookup(base, files);
  if (file) return { file, bare, suffix: file.slice(base.length), alias, query };
}

function lookup(base: string, files: Set<string>) {
  if (files.has(base)) return base;
  return impliedSuffixes.map((suffix) => base + suffix).find((file) => files.has(file));
}

function relative(fromFile: string, to: string) {
  const rel = posix.relative(posix.dirname(fromFile), to);
  return rel.startsWith('../') ? rel : `./${rel}`;
}

function write(target: Target, newFile: string, newImporter: string, newFiles: Set<string>) {
  let file = newFile;
  // An extensionless specifier stays extensionless, in the shortest spelling that still names
  // this file in the new tree: `./a` for a/index.ts moved to b.ts reads `./b`.
  if (target.suffix) {
    const stem = suffixesLongestFirst
      .filter((suffix) => newFile.endsWith(suffix))
      .map((suffix) => newFile.slice(0, -suffix.length))
      .find((stem) => lookup(stem, newFiles) === newFile);
    if (stem) file = stem;
  }
  if (target.alias && file.startsWith(libDir)) {
    return `${target.alias}/${file.slice(libDir.length)}${target.query}`;
  }
  return relative(newImporter, file) + target.query;
}

const isRouteFile = (file: string) => posix.basename(file).startsWith('+');

const generatedTypes = '.svelte-kit/types/';

// `$types` is generated per route directory, so it names a directory rather than a file.
function rewriteTypes(
  spec: string,
  importer: string,
  newImporter: string,
  dirMove: (dir: string) => string,
) {
  const dir = posix.join(posix.dirname(importer), posix.dirname(spec));
  // Tests reach a route's types through the generated tree, which mirrors src/.
  const generated = dir.startsWith(generatedTypes) ? generatedTypes : '';
  const newDir = generated + dirMove(dir.slice(generated.length));
  if (posix.dirname(spec) === '.' && isRouteFile(importer)) return spec;
  if (posix.join(posix.dirname(newImporter), posix.dirname(spec)) === newDir) return spec;
  const rewritten = `${posix.relative(posix.dirname(newImporter), newDir) || '.'}/$types`;
  return rewritten.startsWith('.') ? rewritten : `./${rewritten}`;
}

// The directory a template literal's static head points into, if it names a local path.
function templateDir(head: string, importer: string) {
  const dir = head.slice(0, head.lastIndexOf('/') + 1);
  const alias = aliases.find((name) => dir.startsWith(`${name}/`));
  if (alias) return libDir + dir.slice(alias.length + 1);
  if (dir.startsWith('./') || dir.startsWith('../')) {
    return `${posix.join(posix.dirname(importer), dir).replace(/\/$/, '')}/`;
  }
}

function plan(pairs: [string, string][], files: Set<string>, read: (file: string) => string): Plan {
  const errors: string[] = [];
  const warnings: string[] = [];
  const moves = expandMoves(pairs, files, errors, warnings);
  const newPath = (file: string) => moves.get(file) ?? file;
  const newFiles = new Set([...files].map(newPath));
  const dirPairs = pairs
    .filter(([from]) => !files.has(from))
    .sort((a, b) => b[0].length - a[0].length);
  // A route directory moves with a directory line, or when all its `+` files move to one place.
  const routeDirs = new Map<string, Set<string>>();
  for (const file of files) {
    if (!isRouteFile(file)) continue;
    const dir = posix.dirname(file);
    if (!routeDirs.has(dir)) routeDirs.set(dir, new Set());
    routeDirs.get(dir)!.add(posix.dirname(newPath(file)));
  }
  const dirMove = (dir: string) => {
    for (const [from, to] of dirPairs) {
      if (dir === from || dir.startsWith(`${from}/`)) return to + dir.slice(from.length);
    }
    const routeTo = routeDirs.get(dir);
    return routeTo?.size === 1 ? [...routeTo][0] : dir;
  };
  const movedDirs = [...new Set([...moves.keys()].map((file) => posix.dirname(file)))];

  const edits = new Map<string, Edit[]>();
  const scanned = [...files].filter(
    (f) => scanDirs.some((d) => f.startsWith(d)) && codeFile.test(f),
  );
  for (const importer of scanned) {
    const text = read(importer);
    const newImporter = newPath(importer);
    const fileEdits: Edit[] = [];
    for (const { node, offset } of specifiersIn(importer, text)) {
      const start = offset + node.getStart() + 1;
      const end = offset + node.getEnd() - 1;
      const line = lineAt(text, start);
      if (ts.isTemplateExpression(node)) {
        // Only the static head is known: warn when it could reach a moved file.
        const head = node.head.text;
        const dir = templateDir(head, importer);
        const touched =
          dir &&
          ((importer !== newImporter && !aliases.some((name) => head.startsWith(name))) ||
            movedDirs.some((moved) => `${moved}/`.startsWith(dir)));
        if (touched) warnings.push(`${importer}:${line}: can't rewrite the template \`${head}…\``);
        continue;
      }
      const spec = (node as ts.StringLiteralLike).text;
      let newSpec: string | undefined;
      if (posix.basename(spec) === '$types') {
        if (spec.startsWith('.')) newSpec = rewriteTypes(spec, importer, newImporter, dirMove);
      } else {
        const target = resolve(spec, importer, files);
        if (!target) continue;
        const newTarget = newPath(target.file);
        if (newTarget === target.file && (newImporter === importer || target.alias)) continue;
        // A relative import that still reaches its target from the new location stays as written.
        if (
          !target.alias &&
          posix.join(posix.dirname(newImporter), target.bare) + target.suffix === newTarget
        ) {
          continue;
        }
        newSpec = write(target, newTarget, newImporter, newFiles);
      }
      if (newSpec !== undefined && newSpec !== spec) {
        fileEdits.push({ start, end, text: newSpec, line, from: spec });
      }
    }
    if (fileEdits.length) edits.set(importer, fileEdits);
  }

  // Mentions of moved paths that survive the rewrite (configs, docs, comments) would dangle.
  const needles: string[] = [];
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const from of moves.keys()) {
    const stem = from.replace(/\.[jt]s$/, '');
    needles.push(stem);
    if (stem.startsWith(libDir))
      for (const alias of aliases) needles.push(`${alias}/${stem.slice(libDir.length)}`);
  }
  for (const [from] of dirPairs) needles.push(from);
  if (needles.length) {
    const pattern = new RegExp(
      `(?<![\\w.$#-])(?:${needles.map(escape).join('|')})(?:\\.[jt]s)?(?![\\w.-])`,
      'g',
    );
    for (const file of files) {
      if (mentionSkip.has(file)) continue;
      let text = read(file);
      if (text.includes('\0')) continue;
      const fileEdits = edits.get(file);
      if (fileEdits) text = applyEdits(text, fileEdits);
      for (const match of text.matchAll(pattern)) {
        warnings.push(`${newPath(file)}:${lineAt(text, match.index)}: still mentions ${match[0]}`);
      }
    }
  }
  return { moves, edits, errors, warnings };
}

function applyEdits(text: string, edits: Edit[]) {
  let out = text;
  for (const edit of [...edits].sort((a, b) => b.start - a.start)) {
    out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
  }
  return out;
}

function removeEmptyDirs(dir: string) {
  while (dir && dir !== '.' && existsSync(dir) && readdirSync(dir).length === 0) {
    rmdirSync(dir);
    dir = posix.dirname(dir);
  }
}

function main(argv: string[]) {
  const flags = new Set(argv.filter((arg) => arg.startsWith('--')));
  const [mappingFile, ...extra] = argv.filter((arg) => !arg.startsWith('--'));
  const known = ['--dry-run', '--check', '--reverse'];
  if (!mappingFile || extra.length || [...flags].some((flag) => !known.includes(flag))) {
    console.error(
      'Usage: node scripts/refactor/move.ts <mapping> [--dry-run | --check] [--reverse]',
    );
    return 2;
  }
  const mappingAbsolute = path.resolve(mappingFile);
  process.chdir(git(['rev-parse', '--show-toplevel']).trim());
  const pairs = parseMapping(readFileSync(mappingAbsolute, 'utf-8'), flags.has('--reverse'));
  const files = new Set(git(['ls-files', '-z']).split('\0').filter(Boolean));
  const mappingPath = posix.normalize(path.relative(process.cwd(), mappingAbsolute));
  files.delete(mappingPath);
  const cache = new Map<string, string>();
  const read = (file: string) => {
    if (!cache.has(file)) cache.set(file, existsSync(file) ? readFileSync(file, 'utf-8') : '');
    return cache.get(file)!;
  };
  const result = plan(pairs, files, read);
  const editCount = [...result.edits.values()].reduce((n, list) => n + list.length, 0);

  if (flags.has('--dry-run')) {
    for (const [from, to] of result.moves) console.log(`move  ${from} -> ${to}`);
    for (const [file, list] of result.edits) {
      for (const edit of list)
        console.log(`edit  ${file}:${edit.line}  ${edit.from} -> ${edit.text}`);
    }
  }
  for (const error of result.errors) console.error(`error ${error}`);
  for (const warning of result.warnings) console.error(`warn  ${warning}`);
  const summary = `${result.moves.size} files, ${editCount} references in ${result.edits.size} files`;
  if (result.errors.length) {
    console.error(`Nothing moved: fix the ${result.errors.length} mapping errors first.`);
    return 1;
  }
  if (flags.has('--check')) {
    if (result.warnings.length) return 1;
    console.log(`ok: ${summary}, nothing left dangling`);
    return 0;
  }
  if (flags.has('--dry-run')) {
    console.log(`plan: ${summary}`);
    return 0;
  }

  let done = 0;
  try {
    for (const [from, to] of result.moves) {
      mkdirSync(posix.dirname(to), { recursive: true });
      git(['mv', from, to]);
      done++;
    }
  } catch (error) {
    console.error(`Stopped after ${done} of ${result.moves.size} moves, before any rewrite.`);
    console.error('The moves so far are staged; `git reset --hard` undoes them on a clean tree.');
    throw error;
  }
  for (const [file, list] of result.edits) {
    const target = result.moves.get(file) ?? file;
    writeFileSync(target, applyEdits(read(file), list));
  }
  for (const from of result.moves.keys()) removeEmptyDirs(posix.dirname(from));
  console.log(
    `moved ${summary}${result.warnings.length ? `; ${result.warnings.length} warnings above` : ''}`,
  );
  return 0;
}

if (import.meta.main) process.exit(main(process.argv.slice(2)));
