import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

// Execute the actual pure helper with no provider or browser dependencies.
const exports = {}
const source = readFileSync(new URL('./maitred-story.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
runInNewContext(code, { exports })
const { storyAtProgress, progressAtLine } = exports
const story = progress => ({ ...storyAtProgress(progress) })

test('story endpoints retain first meal, qualification, unpublished title and published order', () => {
  assert.deepEqual([0, 1, 2, 3].map(story), [
    { step: 'save', days: 1, state: 'regulars' },
    { step: 'qualify', days: 2, state: 'qualify' },
    { step: 'lead', days: 8, state: 'holder' },
    { step: 'share', days: 8, state: 'order' },
  ])
  assert.deepEqual(story(-100), story(0))
  assert.deepEqual(story(100), story(3))
  for (const value of [NaN, Infinity, -Infinity]) assert.deepEqual(story(value), story(0))
})

test('nearest labels do not award qualification or the title before their whole-day counts', () => {
  assert.deepEqual(story(.5), { step: 'qualify', days: 1, state: 'regulars' })
  assert.deepEqual(story(1.5), { step: 'lead', days: 5, state: 'qualify' })
  assert.equal(story(1 + 5 / 6).days, 7)
  assert.deepEqual(story(1 + 5.5 / 6), { step: 'lead', days: 7, state: 'qualify' }, '7.5 days must not round into a title')
  assert.deepEqual(story(2 - 1e-6), { step: 'lead', days: 7, state: 'qualify' })
  assert.deepEqual(story(2.49), { step: 'lead', days: 8, state: 'holder' })
  assert.deepEqual(story(2.5), { step: 'share', days: 8, state: 'order' })
  assert.equal(story(1 - Number.EPSILON).days, 2, 'absorb endpoint floating-point noise')
  assert.equal(story(2 - Number.EPSILON).days, 8)
})

test('every day is represented and reversing scroll rewinds the same state without incumbent hysteresis', () => {
  const days = new Set(Array.from({ length: 301 }, (_, index) => story(index / 100).days))
  assert.deepEqual([...days], [1, 2, 3, 4, 5, 6, 7, 8])
  const positions = [0, 1, 1 + 1 / 6, 1 + 2 / 6, 1.5, 1 + 4 / 6, 1 + 5 / 6, 2, 3]
  const forward = positions.map(story)
  assert.deepEqual([...positions].reverse().map(story).reverse(), forward)
  assert.equal(story(2).state, 'holder')
  assert.deepEqual(story(1 + 5 / 6), { step: 'lead', days: 7, state: 'qualify' }, 'rewinding to seven is the pre-transfer story')
})

test('measured centers support uneven spacing, all endpoints, reverse travel and negative viewport positions', () => {
  const centers = [100, 300, 700, 1000]
  const lines = [-10, 100, 200, 300, 500, 700, 850, 1000, 2000]
  const expected = [0, 0, .5, 1, 1.5, 2, 2.5, 3, 3]
  assert.deepEqual(lines.map(line => progressAtLine(centers, line)), expected)
  assert.deepEqual([...lines].reverse().map(line => progressAtLine(centers, line)).reverse(), expected)
  assert.deepEqual(centers, [100, 300, 700, 1000], 'measurements are never mutated')
  assert.equal(progressAtLine([-600, -300, 0, 300], -150), 1.5)
})

test('incomplete, nonfinite or nonascending measurements fall back to the first step', () => {
  for (const centers of [[], [100], [100, 200, 300], [100, 200, 300, 400, 500], [100, 100, 300, 400], [100, 300, 200, 400], [100, NaN, 300, 400], [100, 200, 300, Infinity]]) {
    assert.equal(progressAtLine(centers, 250), 0)
  }
  for (const line of [NaN, Infinity, -Infinity]) assert.equal(progressAtLine([100, 200, 300, 400], line), 0)
})

test('scroll interpolation preserves the seven-day tie until the lead center and separates publication', () => {
  const centers = [100, 300, 900, 1200]
  const at = line => story(progressAtLine(centers, line))
  assert.deepEqual(at(800), { step: 'lead', days: 7, state: 'qualify' })
  assert.deepEqual(at(850), { step: 'lead', days: 7, state: 'qualify' })
  assert.deepEqual(at(900), { step: 'lead', days: 8, state: 'holder' })
  assert.deepEqual(at(1050), { step: 'share', days: 8, state: 'order' })
  assert.deepEqual(at(800), { step: 'lead', days: 7, state: 'qualify' })
})
