/**
 * Preflight for publishing this bundle.
 *
 * Checks the things the plugin market and DSH itself will check, plus the
 * packaging rules that are easy to get wrong: the manifest shape, the patch
 * matching the package name, every declared detail document existing, the
 * artwork rules, and no leftover placeholder. It runs from `prepublishOnly`,
 * so a half-configured package cannot reach npm.
 *
 * Usage: node publish-check.mjs
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))

/** Placeholders that must be replaced before publishing. */
const PLACEHOLDERS = ['YOUR-GITHUB-OWNER', 'REPLACE-ME', '@dsh-local/']

/** Categories the market accepts. */
const CATEGORIES = [
  'agi', 'ui', 'usage', 'theme', 'model', 'identity', 'session', 'memory', 'tools', 'wsl',
  'browser', 'vision', 'voice', 'docs', 'skill', 'workflow', 'git', 'notify', 'dev', 'security',
  'remote', 'market', 'fun',
]

let failures = 0
let warnings = 0

function check(label, ok, detail) {
  if (!ok) failures += 1
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + label + (detail === undefined ? '' : ' — ' + detail))
}

function warn(label, detail) {
  warnings += 1
  console.log('  warn ' + label + (detail === undefined ? '' : ' — ' + detail))
}

function readText(rel) {
  return readFileSync(join(root, rel), 'utf8')
}

function sizeOf(rel) {
  try {
    return statSync(join(root, rel)).size
  } catch (error) {
    return -1
  }
}

/* ------------------------------------------------------------- manifest -- */

console.log('\n--- package.json ---')
const manifest = JSON.parse(readText('package.json'))
check('name is publishable', /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(manifest.name), manifest.name)
check('not private', manifest.private !== true)
check('dsh.bundle.patch declared', typeof manifest.dsh?.bundle?.patch === 'string', manifest.dsh?.bundle?.patch)
check('type is module', manifest.type === 'module')
check('exports ./locale/*.json', typeof manifest.exports?.['./locale/*.json'] === 'string')
check('exports ./icon', typeof manifest.exports?.['./icon'] === 'string')
check('repository present (npm -> repo link)', typeof manifest.repository?.url === 'string',
  typeof manifest.repository === 'string' ? manifest.repository : manifest.repository?.url)
for (const entry of ['index.js', 'client.js', 'cordis.patch.yml', 'locale/*.json', 'docs', 'icon.svg']) {
  check('files[] covers ' + entry, Array.isArray(manifest.files) && manifest.files.includes(entry))
}
if (manifest.license === undefined) {
  warn('no license field', 'choose one before publishing; npm warns without it')
}

/* ---------------------------------------------------------------- patch -- */

console.log('\n--- cordis.patch.yml ---')
const patchPath = manifest.dsh?.bundle?.patch
check('patch file exists', typeof patchPath === 'string' && sizeOf(patchPath) > 0, patchPath)
if (typeof patchPath === 'string' && sizeOf(patchPath) > 0) {
  const patch = readText(patchPath)
  check('patch inserts a row', patch.includes('insert:'))
  check('patch names this package', patch.includes(manifest.name), manifest.name)
  const ids = [...patch.matchAll(/id:\s*'?([^'\s]+)'?/g)].map((match) => match[1])
  check('patch row id is a plain slug (no uuid)', ids.length > 0 && ids.every((id) => !/^@|:/.test(id)), ids.join(','))
}

/* -------------------------------------------------------------- locales -- */

console.log('\n--- locale ---')
for (const locale of ['en', 'zh']) {
  const rel = join('locale', locale + '.json')
  if (sizeOf(rel) < 0) {
    check('locale/' + locale + '.json exists', false)
    continue
  }
  const parsed = JSON.parse(readText(rel))
  check(locale + ': meta.title', typeof parsed.meta?.title === 'string' && parsed.meta.title !== '')
  check(locale + ': meta.description', typeof parsed.meta?.description === 'string'
    && parsed.meta.description.length > 80, String(parsed.meta?.description?.length))
  const detail = parsed.meta?.detail
  if (detail === undefined) {
    warn(locale + ': no meta.detail', 'the detail page falls back to the package README')
    continue
  }
  check(locale + ': detail path is relative and markdown', !detail.startsWith('/') && /\.md$/.test(detail), detail)
  if (sizeOf(detail) < 0) {
    check(locale + ': declared detail document exists', false, detail)
    continue
  }
  const lines = readText(detail).split('\n').filter((line) => line.trim() !== '')
  check(locale + ': detail document is exactly one image line', lines.length === 1, lines.length + ' lines')
  const image = /!\[[^\]]+\]\(([^)]+)\)/.exec(lines[0] ?? '')
  check(locale + ': that line is an image with alt text', image !== null && image[1].length > 0)
  if (image !== null) {
    const imagePath = join(dirname(detail), image[1])
    check(locale + ': the image sits beside the document', sizeOf(imagePath) > 0, imagePath)
    const svg = sizeOf(imagePath) > 0 ? readText(imagePath) : ''
    const forbidden = ['<script', '<style', '<image', '<foreignObject', '<text', 'animate', 'xlink:href']
    const found = forbidden.filter((token) => svg.includes(token))
    check(locale + ': the image stays self-contained', found.length === 0, found.join(','))
    check(locale + ': the image is 640x300', svg.includes('width="640"') && svg.includes('height="300"'))
  }
}

/* ------------------------------------------------------------- artwork -- */

console.log('\n--- artwork ---')
const iconRel = 'icon.svg'
if (sizeOf(iconRel) < 0) {
  check('icon.svg exists', false)
} else {
  const icon = readText(iconRel)
  check('icon.svg is under 256 KiB', sizeOf(iconRel) <= 256 * 1024, sizeOf(iconRel) + ' bytes')
  check('icon.svg declares a 36 unit canvas', icon.includes('viewBox="0 0 36 36"'))
  const forbidden = ['<script', '<style', '<image', '<foreignObject', '<text']
  check('icon.svg has no fonts, scripts or embedded images',
    forbidden.every((token) => !icon.includes(token)))
  // The icon must not draw its own tile: a rect covering the whole canvas.
  const tiling = [...icon.matchAll(/<rect\b[^>]*>/g)].some((match) => {
    const attrs = match[0]
    return /x="0(\.0)?"/.test(attrs) && /y="0(\.0)?"/.test(attrs)
      && /width="36(\.0)?"/.test(attrs) && /height="36(\.0)?"/.test(attrs)
  })
  check('icon.svg draws no background tile', tiling === false)
}

const pngRel = join('assets', 'icon-180.png')
if (sizeOf(pngRel) < 0) {
  check('assets/icon-180.png exists (the market rejects SVG tiles)', false)
} else {
  const bytes = readFileSync(join(root, pngRel))
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  check('is a real PNG', signature.every((byte, index) => bytes[index] === byte))
  check('IHDR chunk first', bytes.subarray(12, 16).toString('ascii') === 'IHDR')
  const width = bytes.readUInt32BE(16)
  const height = bytes.readUInt32BE(20)
  check('is square and at least 96px', width === height && width >= 96, width + 'x' + height)
}

/* -------------------------------------------------------- market entry -- */

console.log('\n--- market entry ---')
const entries = []
try {
  for (const name of readdirSync(join(root, 'market-entry'))) {
    if (name.endsWith('.yml')) entries.push(join('market-entry', name))
  }
} catch (error) {
  entries.length = 0
}
check('one market entry file exists', entries.length === 1, entries.join(','))
if (entries.length === 1) {
  const entry = readText(entries[0])
  const url = /^url:\s*(\S+)/m.exec(entry)?.[1]
  const name = /^name:\s*(\S+)/m.exec(entry)?.[1]
  const category = /^category:\s*(\S+)/m.exec(entry)?.[1]
  const description = /^description:\s*\n\s+en:/m.test(entry)
  check('entry has url', typeof url === 'string' && url.startsWith('https://github.com/'), String(url))
  check('entry has name', typeof name === 'string' && name.includes('/'), String(name))
  check('entry has a valid category', CATEGORIES.includes(String(category)), String(category))
  const entryFile = basename(entries[0])
  const owner = typeof url === 'string' ? url.split('/').filter(Boolean).slice(-2)[0] ?? '' : ''
  check('entry has description.en', description)
  check('filename matches <owner>__<repo>.yml',
    /^[A-Za-z0-9._-]+__[A-Za-z0-9._-]+\.yml$/.test(entryFile), entryFile)
  const en = /^\s+en:\s*(.+)$/m.exec(entry)?.[1]?.trim() ?? ''
  check('description.en ends with a period', /[.。]$/.test(en.replace(/^['"]|['"]$/g, '')), en.slice(-24))
  const quoted = /^['"]/.test(en)
  check('description.en is quoted when it contains ": "',
    !en.includes(': ') || quoted,
    en.includes(': ') ? (quoted ? 'quoted' : 'contains ": " but is NOT quoted') : 'no ": " to escape')
  check('entry filename starts with the repo owner', entryFile.startsWith(owner + '__'), owner + ' vs ' + entryFile)
}

/* --------------------------------------------------------- placeholders -- */

console.log('\n--- placeholders ---')
const shipped = ['package.json', 'README.md', 'locale/en.json', 'locale/zh.json', ...entries, 'cordis.patch.yml']
for (const rel of shipped) {
  if (sizeOf(rel) < 0) continue
  const text = readText(rel)
  const found = PLACEHOLDERS.filter((token) => text.includes(token))
  check('no placeholder left in ' + rel, found.length === 0, found.join(','))
}

/* --------------------------------------------------------------- syntax -- */

console.log('\n--- syntax ---')
for (const rel of ['index.js', 'client.js', 'publish-check.mjs']) {
  let ok = false
  try {
    // `ignore` rather than `pipe`: capturing a child's output is blocked in some
    // sandboxes, and the exit code is all this check needs.
    execFileSync(process.execPath, ['--check', join(root, rel)], { stdio: 'ignore' })
    ok = true
  } catch (error) {
    // The exit code carries the verdict; run the command by hand for details.
  }
  check(rel + ' parses', ok, ok ? undefined : 'run: node --check ' + rel)
}

console.log('\n' + (failures === 0
  ? `PUBLISH CHECKS PASSED${warnings === 0 ? '' : ` with ${warnings} warning(s)`}`
  : `${failures} PUBLISH CHECK(S) FAILED`))
process.exit(failures === 0 ? 0 : 1)
