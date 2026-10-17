// Renames data-testid values in the app and every test that reads them, from a reviewable mapping
// file, and checks that the app's testids follow the `{area}-{entity}-{action}` convention.
//
// Usage (from the repo root, Node 24):
//   node scripts/refactor/rename-testids.ts <mapping> --dry-run   print the edits and warnings
//   node scripts/refactor/rename-testids.ts <mapping> --check     print problems; exit 1 if any
//   node scripts/refactor/rename-testids.ts <mapping> --list      print every testid the app sets
//   node scripts/refactor/rename-testids.ts <mapping>             rewrite the files
// Then run `pnpm format` and the tests.
//
// Mapping file: one rename per line, `#` starts a comment; the first matching line wins. `<name>`
// is a hole for a part of the testid that's built at runtime. The new side can drop a hole but
// not add one.
//   add-filter-btn -> genomic-filter-add
//   user-<id>-edit-btn -> admin-user-edit-<id>
// In the app a hole matches interpolations (`{data.cell}`, `${data.cell}`) and the text around
// them; in a test's plain string it matches any text (`'user-a@b.c-edit-btn'`). A rule that starts
// with a hole (`<id>-btn -> <id>-trigger`) applies in the app where that hole is a single
// interpolation (`{testid}-btn`), and anywhere where it is itself a testid another line renames or
// keeps (`'copy-btn'` -> `'ui-copy-trigger'`); a test's `${x}-btn` is reported instead.
// A rule whose new side is `keep` names a testid that doesn't change (it also exempts it from
// --check; say why in a comment); one whose new side is `!` marks a testid renamed by hand,
// which the script reports instead of rewriting.
//
// What gets rewritten, in tracked files under src/ and tests/:
//   - the app's testids: `data-testid`/`testid`/`testId` attribute values in .svelte markup, and
//     string literals in `'data-testid'`/`testid` object keys, prop defaults and testid variables;
//   - in test files (tests/, *.test.ts, *.spec.ts), string literals passed to `*ByTestId(…)` or
//     assigned to a variable named like `testId` or `modalId`;
//   - `data-testid=x` / `[data-testid="x"]` selectors inside any string and in .json files.
// Not rewritten: other strings in tests that match an old testid (an id table, a helper's
// argument, or a DOM id with the same name), listed as `note` by --dry-run and a plain run;
// regular expressions and prefix or suffix selectors (`[data-testid^=…]`) that name an old
// testid, and a test's `${x}-btn`, reported as warnings; and concatenations like `id + '-btn'`, which only the e2e run
// finds.
//
// --check fails on: testids still in the mapping's old column, the warnings above, and app
// testids outside the convention (kebab-case, a known area first, holes as whole segments, no
// `btn`/`button` segment, nothing built from display text or from a prop that isn't a testid).
// A testid that is only the component's testid prop (`data-testid={testid}`, `"{testid}-trigger"`)
// is checked where its callers set it.
//
// Rebasing an open branch over the rename commit (the mapping is committed in scripts/refactor/;
// hand edits in it or after it are kept). Start from a clean tree, on your branch:
//   R=<the rename commit>
//   git rebase "$R^"                  # 1. put the branch on the commit just before the rename
//   B=$(git rev-parse HEAD)           #    (B keeps your branch tip from here on)
//   renamed() {                       # 2. replay the rename on a commit; prints the result
//     git switch -q --detach "$1" && git restore --source="$R" -- scripts/refactor &&
//     node scripts/refactor/rename-testids.ts scripts/refactor/testids.map >&2 &&
//     git add scripts/refactor && git commit -qam "renamed $1" && git rev-parse HEAD
//   }
//   base=$(renamed "$R^" 2>/dev/null) && mine=$(renamed "$B")
//   git diff --binary "$base" "$mine" > /tmp/branch.patch   # 3. your change, with new testids
//   git switch -C <your-branch> <target>                    # 4. R, or anything after it
//   git apply --3way --index /tmp/branch.patch && pnpm format &&
//     node scripts/refactor/rename-testids.ts scripts/refactor/testids.map --check
// Read the `note` and `warn` lines step 2 printed and fix by hand the ones that are testids.
// --check lists the testids the branch added that don't follow the convention; rename them too
// (and add them to the mapping if other branches use them). This lands the branch as one commit.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const scanDirs = ['src/', 'tests/'];
const scanFile = /\.(?:[cm]?[jt]s|svelte|json)$/;
// The script's own test builds its fixture out of testid-shaped strings.
const skip = new Set(['tests/unit/renameTestidsScript.test.ts']);
export const areas = [
  'admin',
  'api',
  'app',
  'banner',
  'dashboard',
  'dataset',
  'explorer',
  'export',
  'filter',
  'genomic',
  'landing',
  'login',
  'results',
  'terms',
  'ui',
  'user',
];
const testidAttribute = /(?<![\w:-])(?:data-test[iI]d|test[iI][dD])=/g;
const testidName = /^(?:data-test[iI]d|test[iI][dD])$/;
const testidVariable = /^(?:\w*_)?(?:test|modal)_?id$/i;
const selector = /data-testid([\^$*~|]?)=\s*(?:(\\?["'])(.*?)\2|([\w:.@-]+))/g;
const fromText = 'built from display text';
const notTestid = "built from a value that isn't a testid prop";
const testidProp = /^\$?\{\s*test_?id\s*\}$/i;
const open = '\u0001';
const close = '\u0002';

type Rule = { from: string; to: string; pattern: RegExp; holes: string[]; leadingHole: boolean };
type Hole = 'svelte' | 'js' | 'none';
// A testid found in a file: the app sets it (`source`) or a test or selector names it (`reader`).
export type Span = {
  file: string;
  start: number;
  end: number;
  raw: string;
  holes: Hole;
  // `loose`: any other string in a test, renamed only by hand (it may be a DOM id or copy).
  role: 'source' | 'reader' | 'loose';
  // A regex or a prefix/suffix selector: never rewritten, only reported.
  partial?: boolean;
};
type Derived = { file: string; start: number; raw: string; problem: string };
export type Edit = { span: Span; text: string; line: number };
type Report = {
  edits: Edit[];
  notes: string[];
  warnings: string[];
  violations: string[];
  sources: Span[];
};

export function parseMapping(text: string) {
  const rules: Rule[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) continue;
    const parts = line.split('->').map((part) => part.trim());
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      errors.push(`bad mapping line (want "old -> new"): ${raw}`);
      continue;
    }
    const [from, to] = parts;
    if (seen.has(from)) errors.push(`${from} is renamed twice`);
    seen.add(from);
    const holes = [...from.matchAll(/<(\w+)>/g)].map((match) => match[1]);
    const toHoles = [...to.matchAll(/<(\w+)>/g)].map((match) => match[1]);
    const unknown = toHoles.filter((hole) => !holes.includes(hole));
    if (unknown.length) errors.push(`${line}: <${unknown.join('>, <')}> isn't on the old side`);
    const body = from
      .split(/<\w+>/)
      .map((literal) => literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join(`((?:${open}\\d+${close}|[^${open}${close}])+?)`);
    rules.push({
      from,
      to,
      holes,
      pattern: new RegExp(`^${body}$`),
      leadingHole: from.startsWith('<'),
    });
  }
  return { rules, errors };
}

// Splits a raw testid into literal text and interpolations, replacing each interpolation with a
// numbered marker so a hole can match it whole.
function tokenize(raw: string, holes: Hole) {
  const interpolations: string[] = [];
  if (holes === 'none') return { marked: raw, interpolations };
  let marked = '';
  for (let i = 0; i < raw.length; ) {
    const start = holes === 'js' ? raw.startsWith('${', i) : raw[i] === '{';
    if (!start) {
      marked += raw[i++];
      continue;
    }
    const end = matchBrace(raw, raw.indexOf('{', i));
    marked += `${open}${interpolations.length}${close}`;
    interpolations.push(raw.slice(i, end));
    i = end;
  }
  return { marked, interpolations };
}

function untokenize(text: string, interpolations: string[]) {
  return text.replace(new RegExp(`${open}(\\d+)${close}`, 'g'), (_, n) => interpolations[+n]);
}

// The index just past the `}` matching the `{` at `start`, skipping string literals.
function matchBrace(text: string, start: number) {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return i + 1;
    else if (char === '"' || char === "'" || char === '`') {
      for (i++; i < text.length && text[i] !== char; i++) if (text[i] === '\\') i++;
    }
  }
  return text.length;
}

// The new testid, or `keep`, `!`, or `?` when a test names `${x}-btn`: whether `x` is a testid
// (so this is a trigger) is something only a person can tell.
export function rename(span: Span, rules: Rule[]): string | undefined {
  const { marked, interpolations } = tokenize(span.raw, span.holes);
  for (const rule of rules) {
    const match = rule.pattern.exec(marked);
    if (!match) continue;
    const values = new Map(rule.holes.map((hole, i) => [hole, match[i + 1]]));
    if (rule.leadingHole && !new RegExp(`^${open}\\d+${close}$`).test(match[1])) {
      // In plain text the leading hole has to be a testid itself: `copy-btn` is the trigger of
      // `copy`, while `add-filter-btn` has its own line above this rule.
      const inner = rename({ ...span, raw: untokenize(match[1], interpolations) }, rules);
      if (inner === undefined || inner === '!') continue;
      const stem = inner === 'keep' ? match[1] : tokenize(inner, span.holes).marked;
      values.set(rule.holes[0], stem);
    } else if (rule.leadingHole && isTestFile(span.file)) {
      return '?';
    } else if (rule.to === 'keep' || rule.to === '!') return rule.to;
    return untokenize(
      rule.to.replace(/<(\w+)>/g, (_, hole) => values.get(hole)!),
      interpolations,
    );
  }
  return undefined;
}

export function isTestFile(file: string) {
  return file.startsWith('tests/') || /\.(?:test|spec)\.[jt]s$/.test(file);
}

// Literal nodes that make up the value of a testid expression: the operands of `||`, `??`, `+`,
// `?:` and `$derived(…)`, not the operands of comparisons.
function testidLiterals(node: ts.Node, out: ts.Node[]) {
  if (ts.isStringLiteralLike(node) || ts.isTemplateExpression(node)) out.push(node);
  else if (ts.isParenthesizedExpression(node)) testidLiterals(node.expression, out);
  else if (ts.isConditionalExpression(node)) {
    testidLiterals(node.whenTrue, out);
    testidLiterals(node.whenFalse, out);
  } else if (ts.isBinaryExpression(node)) {
    const op = node.operatorToken.kind;
    const k = ts.SyntaxKind;
    if (op === k.BarBarToken || op === k.QuestionQuestionToken || op === k.PlusToken) {
      testidLiterals(node.left, out);
      testidLiterals(node.right, out);
    }
  } else if (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === '$derived'
  ) {
    for (const arg of node.arguments) testidLiterals(arg, out);
  }
}

function nameOf(node: ts.PropertyName | ts.BindingName | undefined) {
  if (!node) return '';
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text;
  return '';
}

function literalSpan(file: string, node: ts.Node, offset: number, role: Span['role']): Span {
  const source = node.getSourceFile();
  const start = node.getStart(source) + 1 + offset;
  const end = node.end - 1 + offset;
  return {
    file,
    start,
    end,
    raw: source.text.slice(start - offset, end - offset),
    holes: ts.isTemplateExpression(node) ? 'js' : 'none',
    role,
  };
}

// Testids in a script: the app's testid expressions, every whole literal in a test file, and
// selectors inside any literal.
function scanScript(file: string, code: string, offset: number, out: Span[], derived: Derived[]) {
  const source = ts.createSourceFile('x.ts', code, ts.ScriptTarget.Latest, true);
  const test = isTestFile(file);
  const named = new Set<ts.Node>();
  const visit = (node: ts.Node) => {
    let value: ts.Node | undefined;
    if (ts.isPropertyAssignment(node) && testidName.test(nameOf(node.name))) {
      value = node.initializer;
    } else if (ts.isBindingElement(node) && node.initializer) {
      if (testidName.test(nameOf(node.propertyName ?? node.name))) value = node.initializer;
    } else if (ts.isVariableDeclaration(node) && node.initializer) {
      if (testidVariable.test(nameOf(node.name))) value = node.initializer;
    } else if (ts.isCallExpression(node) && /ByTestId$/.test(calleeName(node.expression))) {
      value = node.arguments[0];
    }
    if (value) {
      const literals: ts.Node[] = [];
      testidLiterals(value, literals);
      for (const literal of literals) named.add(literal);
      if (/\.replaceAll\(/.test(value.getText(source))) {
        derived.push({
          file,
          start: value.getStart(source) + offset,
          raw: value.getText(source),
          problem: fromText,
        });
      }
    }
    if (ts.isStringLiteralLike(node) || ts.isTemplateExpression(node)) {
      const role = named.has(node) ? (test ? 'reader' : 'source') : 'loose';
      const span = literalSpan(file, node, offset, role);
      if (role !== 'loose' || test) out.push(span);
      scanSelectors(file, span.raw, span.start, out);
    }
    if (ts.isRegularExpressionLiteral(node) && test) {
      out.push({ ...literalSpan(file, node, offset, 'reader'), raw: node.text, partial: true });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

function calleeName(node: ts.Expression) {
  if (ts.isIdentifier(node)) return node.text;
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  return '';
}

function scanSelectors(file: string, text: string, offset: number, out: Span[]) {
  for (const match of text.matchAll(selector)) {
    const value = match[3] ?? match[4];
    const start = offset + match.index + match[0].length - value.length - (match[2]?.length ?? 0);
    out.push({
      file,
      start,
      end: start + value.length,
      raw: value,
      holes: 'none',
      role: 'reader',
      partial: Boolean(match[1]),
    });
  }
}

function scanMarkup(file: string, markup: string, out: Span[], derived: Derived[]) {
  for (const match of markup.matchAll(testidAttribute)) {
    const at = match.index + match[0].length;
    const quote = markup[at];
    if (quote === '"' || quote === "'") {
      let end = at + 1;
      while (end < markup.length && markup[end] !== quote) {
        end = markup[end] === '{' ? matchBrace(markup, end) : end + 1;
      }
      out.push({
        file,
        start: at + 1,
        end,
        raw: markup.slice(at + 1, end),
        holes: 'svelte',
        role: 'source',
      });
    } else if (quote === '{') {
      const end = matchBrace(markup, at);
      const expression = ts.createSourceFile(
        'x.ts',
        `(${markup.slice(at + 1, end - 1)})`,
        ts.ScriptTarget.Latest,
        true,
      );
      const statement = expression.statements[0];
      const literals: ts.Node[] = [];
      if (statement && ts.isExpressionStatement(statement)) {
        testidLiterals(statement.expression, literals);
      }
      for (const literal of literals) out.push(literalSpan(file, literal, at, 'source'));
      if (/\.replaceAll\(/.test(markup.slice(at, end))) {
        derived.push({ file, start: at, raw: markup.slice(at, end), problem: fromText });
      }
      const name = markup.slice(at + 1, end - 1).trim();
      if (!literals.length && /^[\w.]+$/.test(name) && !/(?:^|\.)test_?id$/i.test(name)) {
        derived.push({ file, start: at, raw: name, problem: notTestid });
      }
    }
  }
  // Spread attributes can carry a testid: {...{ 'data-testid': `${testid}-btn` }}.
  for (const match of markup.matchAll(/\{\s*\.\.\./g)) {
    const end = matchBrace(markup, match.index);
    const start = match.index + match[0].length;
    scanScript(file, `(${markup.slice(start, end - 1)})`, start - 1, out, derived);
  }
}

export function scan(file: string, text: string) {
  const spans: Span[] = [];
  const derived: Derived[] = [];
  if (file.endsWith('.json')) {
    scanSelectors(file, text, 0, spans);
  } else if (file.endsWith('.svelte')) {
    let markup = text;
    for (const match of text.matchAll(/(<script\b[^>]*>)([\s\S]*?)<\/script>/g)) {
      const start = match.index + match[1].length;
      scanScript(file, match[2], start, spans, derived);
      markup =
        markup.slice(0, match.index) +
        ' '.repeat(match[0].length) +
        markup.slice(match.index + match[0].length);
    }
    markup = markup.replace(/<style\b[\s\S]*?<\/style>/g, (block) => ' '.repeat(block.length));
    scanMarkup(file, markup, spans, derived);
  } else {
    scanScript(file, text, 0, spans, derived);
  }
  const seen = new Set<string>();
  const unique = spans
    .sort((a, b) => a.start - b.start || (a.role === 'source' ? -1 : 1))
    .filter((span) => {
      const key = `${span.start}:${span.end}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return { spans: unique, derived };
}

function lineAt(text: string, offset: number) {
  return text.slice(0, offset).split('\n').length;
}

// Problems with an app testid's shape, or nothing.
export function conventionProblem(span: Span): string | undefined {
  const { marked, interpolations } = tokenize(span.raw, span.holes);
  if (marked.startsWith(open) && !testidProp.test(interpolations[0])) {
    return `starts with ${interpolations[0]}, not an area or the testid prop`;
  }
  const shape = marked.replace(new RegExp(`${open}\\d+${close}`, 'g'), open);
  if (!shape || shape === open) return undefined;
  const segments = shape.split('-');
  if (segments.some((segment) => segment !== open && !/^[a-z0-9]+$/.test(segment))) {
    return 'not kebab-case, or a runtime part shares a segment with text';
  }
  if (segments[0] !== open && !areas.includes(segments[0])) {
    return `starts with "${segments[0]}", not an area (${areas.join(', ')})`;
  }
  if (segments.length < 2) return 'needs at least an area and an entity';
  if (segments.some((segment) => segment === 'btn' || segment === 'button')) {
    return 'names the element ("btn"), not the action';
  }
  return undefined;
}

// Whether a regex or partial selector names an old testid's leading text.
function namesOldTestid(text: string, rules: Rule[]) {
  return rules.some((rule) => {
    if (rule.leadingHole || rule.to === 'keep') return false;
    const prefix = rule.from.split('<')[0];
    for (let at = text.indexOf(prefix); at >= 0; at = text.indexOf(prefix, at + 1)) {
      if (at === 0 || !/[a-z0-9-]/.test(text[at - 1])) {
        const next = text[at + prefix.length];
        if (rule.holes.length || next === undefined || !/[a-z0-9-]/.test(next)) return true;
      }
    }
    return false;
  });
}

export function plan(files: string[], read: (file: string) => string, rules: Rule[]): Report {
  const report: Report = { edits: [], notes: [], warnings: [], violations: [], sources: [] };
  for (const file of files) {
    const text = read(file);
    const { spans, derived } = scan(file, text);
    for (const span of derived) {
      report.violations.push(
        `${file}:${lineAt(text, span.start)}  ${span.problem}: ${span.raw.trim()}`,
      );
    }
    for (const span of spans) {
      const line = lineAt(text, span.start);
      if (span.partial) {
        if (namesOldTestid(span.raw, rules)) {
          report.warnings.push(`${file}:${line}  names an old testid; edit by hand: ${span.raw}`);
        }
        continue;
      }
      let renamed = rename(span, rules);
      if (span.role === 'loose') {
        if (renamed !== undefined && renamed !== 'keep' && renamed !== '?') {
          report.notes.push(`${file}:${line}  ${span.raw} (-> ${renamed})`);
        }
        continue;
      }
      if (renamed === '!') {
        report.warnings.push(`${file}:${line}  names a testid renamed by hand: ${span.raw}`);
      } else if (renamed === '?') {
        report.warnings.push(`${file}:${line}  may name a trigger; edit by hand: ${span.raw}`);
      }
      const kept = renamed === 'keep';
      if (renamed === '!' || renamed === '?' || kept) renamed = undefined;
      if (renamed !== undefined && renamed !== span.raw) {
        report.edits.push({ span, text: renamed, line });
      }
      if (span.role !== 'source' || isTestFile(file) || !file.startsWith('src/')) continue;
      report.sources.push(span);
      const after = { ...span, raw: renamed ?? span.raw };
      if (kept) continue;
      const problem = conventionProblem(after);
      if (problem) report.violations.push(`${file}:${line}  ${after.raw}: ${problem}`);
    }
  }
  return report;
}

function applyEdits(text: string, edits: Edit[]) {
  let out = text;
  for (const edit of [...edits].sort((a, b) => b.span.start - a.span.start)) {
    out = out.slice(0, edit.span.start) + edit.text + out.slice(edit.span.end);
  }
  return out;
}

function main(argv: string[]) {
  const flags = new Set(argv.filter((arg) => arg.startsWith('--')));
  const [mappingFile, ...extra] = argv.filter((arg) => !arg.startsWith('--'));
  const known = ['--dry-run', '--check', '--list'];
  if (
    !mappingFile ||
    extra.length ||
    flags.size > 1 ||
    [...flags].some((f) => !known.includes(f))
  ) {
    console.error(
      'Usage: node scripts/refactor/rename-testids.ts <mapping> [--dry-run | --check | --list]',
    );
    return 2;
  }
  const mapping = readFileSync(path.resolve(mappingFile), 'utf-8');
  process.chdir(
    execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf-8' }).trim(),
  );
  const { rules, errors } = parseMapping(mapping);
  for (const error of errors) console.error(`error ${error}`);
  if (errors.length) return 1;
  const files = execFileSync('git', ['ls-files', '-z', ...scanDirs], {
    encoding: 'utf-8',
    maxBuffer: 1 << 28,
  })
    .split('\0')
    .filter((file) => scanFile.test(file) && !skip.has(file));
  const cache = new Map<string, string>();
  const read = (file: string) => {
    if (!cache.has(file)) cache.set(file, readFileSync(file, 'utf-8'));
    return cache.get(file)!;
  };
  const report = plan(files, read, rules);
  const byFile = Map.groupBy(report.edits, (edit) => edit.span.file);
  const summary = `${report.edits.length} testids in ${byFile.size} files`;

  if (flags.has('--list')) {
    for (const span of report.sources) {
      console.log(`${span.file}:${lineAt(read(span.file), span.start)}  ${span.raw}`);
    }
    return 0;
  }
  if (flags.has('--dry-run')) {
    for (const edit of report.edits) {
      console.log(`edit  ${edit.span.file}:${edit.line}  ${edit.span.raw} -> ${edit.text}`);
    }
  }
  if (!flags.has('--check') && report.notes.length) {
    console.error("These strings in tests look like old testids but aren't passed to *ByTestId or");
    console.error('a testid variable; rename by hand the ones that are testids:');
    for (const note of report.notes) console.error(`note  ${note}`);
  }
  for (const warning of report.warnings) console.error(`warn  ${warning}`);
  if (flags.has('--check')) {
    for (const edit of report.edits) {
      console.error(`stale ${edit.span.file}:${edit.line}  ${edit.span.raw} (-> ${edit.text})`);
    }
    for (const violation of report.violations) console.error(`convention ${violation}`);
    const problems = report.edits.length + report.warnings.length + report.violations.length;
    if (problems) return 1;
    console.log(`ok: ${report.sources.length} app testids follow the convention`);
    return 0;
  }
  if (flags.has('--dry-run')) {
    console.log(`plan: ${summary}; ${report.violations.length} convention problems after it`);
    return 0;
  }
  for (const [file, edits] of byFile) writeFileSync(file, applyEdits(read(file), edits));
  console.log(`renamed ${summary}${report.warnings.length ? '; see the warnings above' : ''}`);
  return 0;
}

if (import.meta.main) process.exit(main(process.argv.slice(2)));
