import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import process from 'node:process'

const projectRoot = process.cwd()
const sourceRoots = ['app', 'components']
const sourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx'])
const solidSaffronTokens = new Set(['bg-brand-orange', 'bg-[#FF9932]'])
const forbiddenTextPattern =
  /^text-(?:brand-(?:night|ink|muted|dim)|black)(?:\/.+)?$/

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await sourceFiles(path)))
    else if (sourceExtensions.has(extname(entry.name))) files.push(path)
  }

  return files
}

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length
}

const failures = []

for (const sourceRoot of sourceRoots) {
  for (const file of await sourceFiles(join(projectRoot, sourceRoot))) {
    const source = await readFile(file, 'utf8')
    const literalPattern = /"([^"\n]*)"|'([^'\n]*)'|`([^`\n]*)`/g

    for (const match of source.matchAll(literalPattern)) {
      const literal = match[1] ?? match[2] ?? match[3] ?? ''
      const tokens = literal.split(/\s+/)
      const hasSolidSaffron = tokens.some((token) => solidSaffronTokens.has(token))
      const forbiddenText = tokens.find((token) => forbiddenTextPattern.test(token))
      const removedOrangeInkToken = tokens.find((token) => token.includes('brand-orange-ink'))

      if (hasSolidSaffron && forbiddenText) {
        failures.push(
          `${relative(projectRoot, file)}:${lineNumber(source, match.index)} ` +
            `places ${forbiddenText} directly on solid saffron`,
        )
      }

      if (removedOrangeInkToken) {
        failures.push(
          `${relative(projectRoot, file)}:${lineNumber(source, match.index)} ` +
            `uses removed colour token ${removedOrangeInkToken}; use brand-orange`,
        )
      }
    }
  }
}

const manifestPath =
  process.env.LOCKED_SURFACES ?? 'docs/founder-decisions.locked-surfaces.json'

let lockedSurfaceChecks
try {
  const manifestSource = await readFile(join(projectRoot, manifestPath), 'utf8')
  lockedSurfaceChecks = JSON.parse(manifestSource)
} catch (error) {
  console.error(
    `FD-001 failed — could not read or parse the locked-surface manifest at ` +
      `${manifestPath}: ${error.message}`,
  )
  process.exit(1)
}

if (!Array.isArray(lockedSurfaceChecks) || lockedSurfaceChecks.length === 0) {
  console.error(
    `FD-001 failed — the locked-surface manifest at ${manifestPath} must be a ` +
      `non-empty array of checks.`,
  )
  process.exit(1)
}

for (const check of lockedSurfaceChecks) {
  let source
  try {
    source = await readFile(join(projectRoot, check.file), 'utf8')
  } catch {
    failures.push(
      `${check.file} is declared in the locked-surface manifest but does not exist. ` +
        `If it was renamed, update ${manifestPath} in the same commit.`,
    )
    continue
  }
  for (const required of check.required) {
    if (!source.includes(required)) {
      failures.push(`${check.file} must preserve the founder colour contract: ${required}`)
    }
  }
}

if (failures.length > 0) {
  console.error('FD-001 failed — white text on saffron is a locked founder decision.\n')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('FD-001 passed — solid saffron surfaces preserve the founder colour contract.')
