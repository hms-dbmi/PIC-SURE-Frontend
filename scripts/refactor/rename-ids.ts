// Renames DOM ids in the app and everything that reads them, from a reviewable mapping file, and
// checks that the app's ids follow the `{area}-{entity}-{action}` convention. Same engine, mapping
// syntax, flags and rebase recipe as rename-testids.ts (read its header), with this script and
// scripts/refactor/ids.map:
//   node scripts/refactor/rename-ids.ts scripts/refactor/ids.map [--dry-run | --check | --list]
//
// Where ids are set: the `id`, `for`, `aria-labelledby`/`-describedby`/`-controls`/`-owns`/
// `-activedescendant`/`-errormessage` and `popovertarget` attributes in .svelte markup, on
// elements and components alike, and string literals in variables named like `panelId`.
// Where they're read: `#id` and `[id="…"]`/`[for="…"]` selectors inside any string, .json file
// (the tour) or CSS (.css files and <style> blocks), and the argument of `getElementById(…)`.
// A prefix selector (`tr[id^="ExplorerTable-row-"]`) follows a rule whose last part is a hole.
// A value may start with the component's own id (`{id}-row-{index}`, `{uid}-checkbox`): name
// the prop or variable `id`, `uid` or `…Id`.
import { areas, main, testids, type Kind } from './rename-testids.ts';

const idValue = /^\$?\{\s*(?:id|uid|\w+Id)\s*\}$/;

export const ids: Kind = {
  noun: 'id',
  script: 'scripts/refactor/rename-ids.ts',
  scanFile: /\.(?:[cm]?[jt]s|svelte|json|css)$/,
  skip: new Set([...testids.skip, 'tests/unit/renameIdsScript.test.ts']),
  attribute:
    /(?<=\s)(?:id|for|aria-(?:labelledby|describedby|controls|owns|activedescendant|errormessage)|popovertarget)=/g,
  // Object keys named `id` are mostly data (a uuid, a workflow key), so only markup sets ids.
  key: /(?!)/,
  variable: /^\w+Id$/,
  call: /^getElementById$/,
  callLabel: 'getElementById',
  // `#id` (not an HTML entity like `&#160;`), or an attribute selector on `id` or `for`.
  selector:
    /(?<!&)#(?<bare>(?:[A-Za-z]|\$\{[^}]*\})(?:[\w-]|\\:|\$\{[^}]*\})*)|\[(?:id|for)(?<op>[\^$*~|]?)=\s*(?<q>\\?["'])(?<value>.*?)\k<q>/g,
  styles: true,
  list: true,
  prop: idValue,
  propName: /(?:^|\.)(?:id|uid|\w+Id)$/,
};

export { areas };

if (import.meta.main) process.exit(main(process.argv.slice(2), ids));
