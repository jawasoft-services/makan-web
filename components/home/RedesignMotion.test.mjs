import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('./RedesignMotion.tsx', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
} }).outputText

// Run the component's real effect and event handlers. The commit deliberately
// replaces className, matching the React update that previously erased flags.
function harness(componentName, initiallyHidden = false) {
  const node = { dataset: {}, className: '' }
  const slots = []
  const effects = []
  const listeners = new Map()
  let cursor = 0
  let mounted = false
  let observer
  let tree
  const document = {
    hidden: initiallyHidden,
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name, callback) => { if (listeners.get(name) === callback) listeners.delete(name) },
  }
  const hooks = {
    useRef() { const index = cursor++; return slots[index] ??= { current: node } },
    useState(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = initial
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value }]
    },
    useEffect(effect) { if (!mounted) effects.push(effect) },
  }
  const jsx = (type, props) => ({ type, props })
  const compiledModule = { exports: {} }
  vm.runInNewContext(compiled, {
    exports: compiledModule.exports, module: compiledModule, document,
    require(name) {
      if (name === 'react') return hooks
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx }
      throw new Error(`Unexpected dependency ${name}`)
    },
    IntersectionObserver: class {
      constructor(callback) { observer = { callback, disconnected: false } }
      observe(target) { assert.equal(target, node) }
      disconnect() { observer.disconnected = true }
    },
  })
  const render = () => {
    cursor = 0
    tree = compiledModule.exports[componentName]({ children: 'Content', label: 'Reviews', pauseLabel: 'Pause', resumeLabel: 'Resume' })
    node.className = tree.props.className
  }
  const findButton = element => {
    if (!element || typeof element !== 'object') return undefined
    if (element.type === 'button') return element
    return [element.props?.children].flat().map(findButton).find(Boolean)
  }
  render()
  assert.deepEqual(node.dataset, {}, 'server render must not enable autoplay')
  const cleanup = effects[0]()
  mounted = true
  return {
    node,
    hasButton() { return !!findButton(tree) },
    click() { findButton(tree).props.onClick(); render(); return findButton(tree).props['aria-pressed'] },
    visible(value) { observer.callback([{ isIntersecting: value }]) },
    hidden(value) { document.hidden = value; listeners.get('visibilitychange')() },
    cleanup() { cleanup(); assert.equal(observer.disconnected, true); assert.equal(listeners.size, 0) },
  }
}

for (const name of ['HomeHero', 'ReviewsRail']) {
  test(`${name}: retains visibility tracking and cleans up motion state`, () => {
    const app = harness(name, true)
    assert.equal(app.node.dataset.documentHidden, 'true', 'initial hidden document is paused immediately')
    app.hidden(false)
    app.visible(true)
    const flags = { ...app.node.dataset }
    if (name === 'HomeHero') {
      assert.equal(app.click(), true)
      assert.deepEqual(app.node.dataset, flags)
      assert.equal(app.click(), false)
      assert.deepEqual(app.node.dataset, flags)
    } else {
      assert.equal(app.hasButton(), false, 'reviews have no pause button')
    }
    assert.equal(app.node.dataset.motionReady, 'true')
    app.visible(false)
    assert.equal(name === 'HomeHero' ? app.node.dataset.offscreen : app.node.dataset.inView, name === 'HomeHero' ? 'true' : 'false')
    app.hidden(true)
    assert.equal(app.node.dataset.documentHidden, 'true')
    app.cleanup()
    assert.deepEqual(app.node.dataset, {})
  })
}
