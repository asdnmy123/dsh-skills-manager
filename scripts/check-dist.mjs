import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

async function snapshot(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true }).catch(error => {
    if (error.code === 'ENOENT') throw new Error('缺少 lib/ 产物，请先运行 npm run build')
    throw error
  })
  const files = []
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(dir, entry.name)
    const name = `${prefix}${entry.name}`
    if (entry.isDirectory()) files.push(...await snapshot(path, `${name}/`))
    else if (entry.isFile()) files.push([name, createHash('sha256').update(await readFile(path)).digest('hex')])
    else throw new Error(`构建产物不是普通文件：${name}`)
  }
  return files
}

const npmCli = process.env.npm_execpath
if (!npmCli) throw new Error('请通过 npm run check:dist 运行产物检查')
const before = new Map(await snapshot('lib'))
await promisify(execFile)(process.execPath, [npmCli, 'run', 'build'], { maxBuffer: 1024 * 1024 })
const after = new Map(await snapshot('lib'))
const changed = [...new Set([...before.keys(), ...after.keys()])].filter(name => before.get(name) !== after.get(name))
if (changed.length) throw new Error(`构建产物过期或缺失，请提交重新构建后的文件：${changed.join(', ')}`)
console.log(`构建产物一致：${after.size} 个文件`)
