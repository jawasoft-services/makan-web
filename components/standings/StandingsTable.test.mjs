import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const source = ts.transpileModule(readFileSync(new URL('./StandingsTable.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText

for (const locale of ['en', 'id']) test(`${locale}: standings dates hydrate identically with Node and Safari September abbreviations`, () => {
  for (const month of ['Sept', 'Sep']) {
    const exports = {}, options = []
    runInNewContext(source, { exports, Intl: { NumberFormat: Intl.NumberFormat,
      DateTimeFormat: class {
        constructor(_locale, config) { options.push(config) }
        format(date) { return `${month} ${date.getUTCFullYear()}` }
      },
    }, require: name => {
      if (name === 'next/link') return { default: 'a' }
      if (name === '@/i18n/paths') return { localizePath: (_locale, path) => path }
      if (name === './filter-standings') return { filterStandings: rows => rows.map((row, i) => ({ row, rank: i + 1 })) }
      if (name.endsWith('.module.css')) return { default: {} }
      return require(name)
    } })
    const row = { placeId: 'one', slug: 'one', name: 'One', eatRate: .8, eats: 8, yeets: 2, where: null, since: '2026-09-30T23:30:00.000Z' }
    const html = renderToStaticMarkup(createElement(exports.default, { rows: [row, { ...row, placeId: 'two', since: null }], locale, labels: {}, caption: 'Places' }))
    assert.match(html, />Sep 2026<\/td>/)
    assert.doesNotMatch(html, /Sept 2026/)
    assert.match(html, />—<\/td>/)
    assert.equal(options[0].timeZone, 'UTC', 'client timezone must not move a month-boundary timestamp')
  }
})
