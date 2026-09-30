import { build } from 'esbuild'
import { writeFile } from 'node:fs/promises'

const result = await build({ entryPoints: ['src/client/index.tsx'], bundle: true, write: false, format: 'cjs', platform: 'browser', target: 'es2022', external: ['react', 'react/jsx-runtime'], legalComments: 'none' })
const code = result.outputFiles[0].text
await writeFile('lib/client.js', `globalThis.__ModuleLoader__.load({id: 'dsh-skills-manager', factory(require) {\nvar module = { exports: {} }; var exports = module.exports;\n${code}\nreturn module.exports;\n}});\n`)
