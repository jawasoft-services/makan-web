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

const milestone = progress => {
  const { step, days, state } = story(progress)
  return { step, days, state }
}
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} differs from ${expected}`)

test('story endpoints retain first meal, qualification, unpublished title and published order', () => {
  assert.deepEqual([0, 1, 2, 3].map(milestone), [
    { step: 'save', days: 1, state: 'regulars' },
    { step: 'qualify', days: 2, state: 'qualify' },
    { step: 'lead', days: 8, state: 'holder' },
    { step: 'share', days: 8, state: 'order' },
  ])
  assert.deepEqual(story(-100), story(0))
  assert.deepEqual(story(100), story(3))
  for (const value of [NaN, Infinity, -Infinity]) assert.deepEqual(story(value), story(0))
  assert.equal(story(0).progress, 0)
  assert.equal(story(3).progress, 3)
})

test('the second meal lands before its count changes, then the camera moves to the table', () => {
  assert.equal(story(.05).mealLanding, 0)
  near(story(.3).mealLanding, .5)
  assert.equal(story(.3).days, 1)
  assert.equal(story(.55 - 1e-6).days, 1)
  assert.equal(story(.55).mealLanding, 1)
  assert.equal(story(.55).days, 2)
  assert.equal(story(.55).dayProgress, 2)
  assert.equal(story(.7).camera, 0)
  near(story(.85).camera, .5)
  assert.equal(story(.85).days, 2)
  assert.equal(story(1).camera, 1)
})

test('the active instruction follows meal arrival, the lead sequence and editor opening in either direction', () => {
  const samples = [[0, 'save'], [.55 - 1e-6, 'save'], [.55, 'qualify'], [1.5 - 1e-6, 'qualify'], [1.5, 'lead'], [2.08 - 1e-6, 'lead'], [2.08, 'share'], [2.2, 'share'], [3, 'share']]
  for (const [progress, step] of [...samples, ...[...samples].reverse()]) assert.equal(story(progress).step, step)
  assert.deepEqual(milestone(2.2), { step: 'share', days: 8, state: 'holder' }, 'opening the editor selects sharing before publication')
})

test('continuous profile movement does not round a partial day into the title', () => {
  assert.deepEqual(milestone(.5), { step: 'save', days: 1, state: 'regulars' })
  assert.deepEqual(milestone(1.5), { step: 'lead', days: 5, state: 'qualify' })
  assert.equal(story(1 + 5 / 6).days, 7)
  near(story(1 + 5.5 / 6).dayProgress, 7.5)
  assert.deepEqual(milestone(1 + 5.5 / 6), { step: 'lead', days: 7, state: 'qualify' })
  assert.deepEqual(milestone(2 - 1e-6), { step: 'lead', days: 7, state: 'qualify' })
  assert.equal(story(2).dayProgress, 8)
  assert.equal(story(1 - Number.EPSILON).days, 2)
  assert.equal(story(2 - Number.EPSILON).days, 8, 'absorb endpoint floating-point noise')
})

test('opening, typing, private preview and publication are separate scroll beats', () => {
  assert.equal(story(2.08).editorOpen, 0)
  near(story(2.14).editorOpen, .5)
  assert.equal(story(2.2).editorOpen, 1)
  assert.equal(story(2.22).typedText, '')
  assert.equal(story(2.37).typedText, 'Harissa')
  assert.equal(story(2.52).typedText, 'Harissa prawns')
  assert.equal(story(2.57).preview, false)
  assert.equal(story(2.58).preview, true)
  assert.equal(story(2.58).state, 'holder', 'a private preview is not a published order')
  assert.equal(story(2.7).publishProgress, 0)
  near(story(2.74).publishProgress, .5)
  assert.equal(story(2.78).publishProgress, 1)
  assert.equal(story(2.8).editorOpen, 1)
  assert.equal(story(2.83).publication, 0)
  assert.equal(story(2.83).state, 'holder')
  near(story(2.89).publication, .5)
  assert.equal(story(2.89).state, 'order')
  assert.equal(story(2.94).editorOpen, 0)
  assert.equal(story(2.95).publication, 1)
})

test('every day and partial frame freezes and reverses without history or accumulated motion', () => {
  const positions = Array.from({ length: 601 }, (_, index) => index / 200)
  const forward = positions.map(story)
  assert.deepEqual([...new Set(forward.map(frame => frame.days))], [1, 2, 3, 4, 5, 6, 7, 8])
  assert.deepEqual([...positions].reverse().map(story).reverse(), forward)
  for (const position of [.3, .85, 1.27, 1.92, 2.14, 2.37, 2.74, 2.89]) {
    const stopped = story(position)
    for (const elsewhere of [3, 0, 1, 2]) {
      story(elsewhere)
      assert.deepEqual(story(position), stopped)
    }
  }
  assert.equal(story(2).state, 'holder')
  assert.deepEqual(milestone(1 + 5 / 6), { step: 'lead', days: 7, state: 'qualify' })
})

test('all animated channels stay bounded throughout the story', () => {
  for (let index = 0; index <= 600; index++) {
    const frame = story(index / 200)
    for (const channel of ['mealLanding', 'camera', 'editorOpen', 'publishProgress', 'publication']) {
      assert.ok(frame[channel] >= 0 && frame[channel] <= 1, `${channel} out of bounds at ${frame.progress}`)
    }
    assert.ok(frame.dayProgress >= 1 && frame.dayProgress <= 8)
    assert.ok('Harissa prawns'.startsWith(frame.typedText))
    assert.ok(Number.isInteger(frame.days))
  }
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
  const at = line => milestone(progressAtLine(centers, line))
  assert.deepEqual(at(800), { step: 'lead', days: 7, state: 'qualify' })
  assert.deepEqual(at(850), { step: 'lead', days: 7, state: 'qualify' })
  assert.deepEqual(at(900), { step: 'lead', days: 8, state: 'holder' })
  assert.deepEqual(at(1050), { step: 'share', days: 8, state: 'holder' }, 'typing is not yet publication')
  assert.deepEqual(at(1200), { step: 'share', days: 8, state: 'order' })
  assert.deepEqual(at(800), { step: 'lead', days: 7, state: 'qualify' })
})
