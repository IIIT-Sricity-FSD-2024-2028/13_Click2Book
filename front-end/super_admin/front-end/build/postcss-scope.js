/**
 * PostCSS plugin: scopes a stylesheet to one wrapper class.
 *
 * The original Click2Book front-end was a set of independent HTML pages, so
 * every page's CSS assumed it owned `body`, `:root` and generic class names
 * like `.sidebar`. In a single-page React app all of that CSS is loaded at
 * once, so each file opts in with a directive comment on its first line:
 *
 *     /* @scope-to .pg-customer-lost-found *\/
 *
 * and every selector is prefixed with that class. `html`, `body` and `:root`
 * are rewritten to the wrapper itself (the page's root <div> plays the role
 * of <body>), and `*` also matches the wrapper.
 *
 * `@keyframes` names are global too, and several pages define different
 * animations under the same name (`float`, `fadeUp`). Keyframes declared in a
 * page stylesheet (scope `.pg-*`) are therefore renamed to `<name>--<scope>`
 * and that file's `animation` declarations are updated to match. Shared
 * portal stylesheets (`.css-*`) keep their names so the pages that import
 * them can still reference their animations.
 */
const ROOT_TOKEN = /^(?:html|body|:root)(?=$|[\s.#:[>+~])/;

function scopeSelector(selector, scope) {
  const sel = selector.trim();
  if (!sel || sel.startsWith(scope)) return sel;
  if (sel === '*') return `${scope}, ${scope} *`;
  if (!ROOT_TOKEN.test(sel)) return `${scope} ${sel}`;

  // Strip leading html/body/:root tokens: `html body .x` -> `.x`.
  let rest = sel;
  let descendant = false;
  while (ROOT_TOKEN.test(rest)) {
    rest = rest.replace(ROOT_TOKEN, '');
    descendant = /^\s/.test(rest);
    rest = rest.trimStart();
  }
  if (!rest) return scope;
  // `body .x` / `body > .x` stay descendants; `body.x` becomes a compound.
  return descendant ? `${scope} ${rest}` : scope + rest;
}

function insideKeyframes(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (p.type === 'atrule' && /keyframes$/i.test(p.name)) return true;
  }
  return false;
}

function renamePageKeyframes(root, suffix) {
  const renamed = new Map();
  root.walkAtRules(/keyframes$/i, (at) => {
    const name = at.params.trim();
    renamed.set(name, `${name}--${suffix}`);
    at.params = renamed.get(name);
  });
  if (!renamed.size) return;
  root.walkDecls(/^animation(-name)?$/i, (decl) => {
    decl.value = decl.value.replace(/[\w-]+/g, (tok) => renamed.get(tok) || tok);
  });
}

export default function scopePlugin() {
  return {
    postcssPlugin: 'c2b-scope',
    Once(root) {
      let scope = null;
      root.walkComments((c) => {
        const m = c.text.match(/^@scope-to\s+(\S+)/);
        if (m && !scope) {
          scope = m[1];
          c.remove();
        }
      });
      if (!scope) return;
      root.walkRules((rule) => {
        if (insideKeyframes(rule)) return;
        rule.selectors = rule.selectors.map((s) => scopeSelector(s, scope));
      });
      if (scope.startsWith('.pg-')) renamePageKeyframes(root, scope.slice(1));
    },
  };
}
scopePlugin.postcss = true;
