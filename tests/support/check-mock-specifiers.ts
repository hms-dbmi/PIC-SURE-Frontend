// Fails when a vi.mock / doMock / unmock / doUnmock / importActual / importMock specifier
// doesn't resolve to a module file, or isn't a static string that can be checked. Vitest
// treats an unresolvable specifier as a module nobody imports, so the mock silently does
// nothing and the test exercises the real module instead. Specifiers are resolved through the
// project's own Vite config (same plugins, aliases and #lib imports that Vitest uses),
// relative to the file that contains them. Checks every file under src/, tests/ and scripts/, or only
// the files given as arguments.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { createServer } from 'vite';

const root = path.resolve(import.meta.dirname, '../..');
const scanDirs = ['src', 'tests', 'scripts'];
const skipDirs = new Set(['node_modules', 'end-to-end']);
const mockMethods = new Set(['mock', 'doMock', 'unmock', 'doUnmock', 'importActual', 'importMock']);

function* sourceFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) yield* sourceFiles(full);
    } else if (/\.[jt]s$/.test(entry.name)) {
      yield full;
    }
  }
}

// vi.mock('x'), vi.mock(`x`) and vi.mock(import('x')) all name a module; anything else can't
// be checked statically, so it is reported rather than skipped.
function specifierOf(arg: ts.Expression | undefined): string | undefined {
  if (arg && ts.isCallExpression(arg) && arg.expression.kind === ts.SyntaxKind.ImportKeyword) {
    arg = arg.arguments[0];
  }
  if (arg && ts.isStringLiteralLike(arg)) return arg.text;
}

const only = process.argv.slice(2).map((file) => path.resolve(file));
const files = only.length
  ? only
  : scanDirs.flatMap((dir) => [...sourceFiles(path.join(root, dir))]);
const found: { where: string; file: string; specifier: string | undefined }[] = [];
for (const file of files) {
  const source = readFileSync(file, 'utf-8');
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest);
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'vi' &&
      mockMethods.has(node.expression.name.text)
    ) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      const where = `${path.relative(root, file)}:${line + 1}`;
      found.push({ where, file, specifier: specifierOf(node.arguments[0]) });
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

const server = await createServer({
  root,
  mode: 'test',
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, ws: false, watch: null },
});
const problems: string[] = [];
try {
  const container = server.environments.ssr.pluginContainer;
  for (const { where, file, specifier } of found) {
    if (specifier === undefined) {
      problems.push(`${where}: not a static specifier, so it can't be checked`);
      continue;
    }
    try {
      // An alias such as $app/* maps any suffix to a path, so a resolved path must also be a
      // file: `$env/dynamic` maps to a directory and is no more loadable than `$app/nope`
      const id = (await container.resolveId(specifier, file))?.id.split('?')[0];
      if (!id || (path.isAbsolute(id) && !statSync(id, { throwIfNoEntry: false })?.isFile())) {
        problems.push(`${where}: ${specifier}`);
      }
    } catch (error) {
      problems.push(
        `${where}: ${specifier} (${String(error instanceof Error ? error.message : error).split('\n')[0]})`,
      );
    }
  }
} finally {
  await server.close();
}

if (problems.length) {
  console.error(`Mock specifiers that don't resolve (each mock would silently do nothing):`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log(`All ${found.length} mock specifiers resolve.`);
