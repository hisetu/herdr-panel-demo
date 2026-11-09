import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const tree = JSON.parse(await readFile(new URL('layouts/demo-right-panel.json', root), 'utf8'));
function find(node, id) {
  if (node.id === id) return node;
  for (const child of node.children ?? []) { const result = find(child, id); if (result) return result; }
  return null;
}
async function loadMod(name, currentLayout = structuredClone(tree), focus = null, stored = {}, paneData = null) {
  const calls = [], elements = new Map(), texts = [];
  const builder = () => {
    const node = {};
    const proxy = new Proxy(node, { get(target, key) { return (...args) => {
      if (key === 'id') elements.set(args[0], node);
      if (key === 'on_click') node.click = args[0];
      if (key === 'child' && typeof args[0] === 'string') texts.push(args[0]);
      if (key === 'when' && args[0]) args[1](proxy);
      return proxy;
    }; } });
    return proxy;
  };
  const storage = new Map([['panels', JSON.stringify(stored)]]);
  const context = vm.createContext({localStorage: {getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value)}});
  const module = new vm.SourceTextModule(await readFile(new URL(`mods/${name}/main.js`, root), 'utf8'), {context});
  const exports = {
    'gpui-kit': { View: class {}, div: builder, svg: builder, image: builder },
    'gpui-base': { h_flex: builder, v_flex: builder },
    herdr: {
      theme: () => ({}), layout: () => currentLayout, panes: () => paneData ? [paneData] : [],
      props: () => ({pane: paneData?.pane}), home: () => '/Users/demo',
      run: (command, args) => calls.push(JSON.parse(JSON.stringify({command, args}))),
      focused: () => focus, shared: () => ['files', 'changes'], settings: () => ({zoom: 1}),
      window: () => ({platform: 'macos', titlebar: 'none', fullscreen: false}), openOverlay: () => {},
      spaces: () => focus ? [{id:'s1', active:true, name:'Demo Space', machine:null, tabs:[{id:'tab1', name:'Demo Tab', active:true}]}] : [],
    },
  };
  await module.link(specifier => {
    const values = exports[specifier];
    assert.ok(values, `Unexpected import: ${specifier}`);
    return new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, {context});
  });
  await module.evaluate();
  const instance = new module.namespace.default();
  instance.init?.();
  instance.render();
  return {calls, elements, texts, storage};
}
const focus = {space:'s1', tab:'tab1', cwd:'/work/project', terminal:'t42'};

test('Demo shares the Files/Changes stack; no extra toolbar or right panel', () => {
  const ids = [];
  function visit(node) { ids.push(node.id); (node.children ?? []).forEach(visit); }
  visit(tree);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(find(tree, 'demo-right-panel'), null);
  assert.equal(find(tree, 'demo-toolbar'), null);
  assert.equal(find(tree, 'tabs').content.mod, 'demo-tabs');
  assert.deepEqual(find(tree, 'panel-body').children.map(n => n.id), ['files','changes','demo-inspector']);
  assert.equal(find(tree, 'panel').hidden, true);
});

test('Files, Changes and Demo buttons render together', async () => {
  const mod = await loadMod('demo-tabs');
  for (const id of ['panel-files','panel-changes','panel-demo-inspector']) assert.ok(mod.elements.has(id));
});

test('Demo selects its stack child and opens the existing panel', async () => {
  const mod = await loadMod('demo-tabs');
  mod.elements.get('panel-demo-inspector').click();
  assert.deepEqual(mod.calls, [
    {command:'layout.select', args:{stack:'panel-body',child:'demo-inspector'}},
    {command:'layout.show',args:{id:'panel'}},
  ]);
});

test('clicking active Demo closes the shared panel', async () => {
  const layout = structuredClone(tree);
  find(layout, 'panel').hidden = false;
  find(layout, 'panel-body').active = 'demo-inspector';
  const mod = await loadMod('demo-tabs', layout);
  mod.elements.get('panel-demo-inspector').click();
  assert.deepEqual(mod.calls, [{command:'layout.hide',args:{id:'panel'}}]);
});

test('Files and Changes still select their own panel', async () => {
  for (const child of ['files', 'changes']) {
    const mod = await loadMod('demo-tabs');
    mod.elements.get(`panel-${child}`).click();
    assert.deepEqual(mod.calls, [
      {command:'layout.select',args:{stack:'panel-body',child}},
      {command:'layout.show',args:{id:'panel'}},
    ]);
  }
});

test('per-space restore accepts Demo even though global workspace.panels only contains Files/Changes', async () => {
  const mod = await loadMod('demo-tabs', structuredClone(tree), focus, {s1:'demo-inspector'});
  assert.deepEqual(mod.calls, [
    {command:'layout.select',args:{stack:'panel-body',child:'demo-inspector'}},
    {command:'layout.show',args:{id:'panel'}},
  ]);
});

test('inspector handles missing context and closes the existing panel', async () => {
  const mod = await loadMod('demo-inspector');
  assert.ok(mod.texts.includes('—'));
  mod.elements.get('demo-close-panel').click();
  assert.deepEqual(mod.calls,[{command:'layout.hide',args:{id:'panel'}}]);
});

test('pane header shows local and full remote terminal addresses', async () => {
  for (const terminal of ['t3w', 'amd3600/t9']) {
    const mod = await loadMod('demo-pane', tree, null, {}, {
      pane: 'p42', terminal, title: 'Shell', cwd: '/work/project',
      program: {name:'zsh', shell:true}, status:null,
    });
    assert.ok(mod.elements.has('terminal-id-p42'));
    assert.ok(mod.texts.includes(terminal));
    assert.deepEqual(mod.calls, []);
  }
});

test('mod pane has no fake terminal address', async () => {
  const mod = await loadMod('demo-pane', tree, null, {}, {
    pane:'p42', terminal:null, title:'A mod', cwd:null, program:null, status:null,
  });
  assert.equal(mod.elements.has('terminal-id-p42'), false);
  assert.ok(mod.texts.includes('A mod'));
});

test('pane header handles a missing pane', async () => {
  const mod = await loadMod('demo-pane');
  assert.equal(mod.texts.length, 0);
  assert.deepEqual(mod.calls, []);
});

test('inspector renders current space, tab, directory and terminal', async () => {
  const mod = await loadMod('demo-inspector', tree, focus);
  for (const text of ['Demo Space','Demo Tab','This computer','/work/project','t42']) assert.ok(mod.texts.includes(text), text);
  assert.deepEqual(mod.calls, []);
});
