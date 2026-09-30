import * as React from 'react'
import * as ReactDom from 'react-dom'
import * as ReactDomClient from 'react-dom/client'
import * as JsxRuntime from 'react/jsx-runtime'
import * as Cordis from '@deepseek-ai/cordis'
import * as Slots from '@deepseek-ai/dsh-client-ui-slots'

const modules: Record<string, any> = {
  react: React, 'react-dom': ReactDom, 'react-dom/client': ReactDomClient,
  'react/jsx-runtime': JsxRuntime, '@deepseek-ai/cordis': Cordis, '@deepseek-ai/dsh-client-ui-slots': Slots,
}
const browser = window as any
browser.__ModuleLoader__ = { load({ id, factory }: any) {
  modules[id] = factory((name: string) => {
    if (!modules[name]) throw new Error(`Missing preview module: ${name}`)
    return modules[name]
  })
} }
browser.startPreview = async () => {
  const ctx = new Cordis.Context()
  await ctx.plugin(modules['@deepseek-ai/dsh-client-connection'])
  await ctx.plugin(modules['@deepseek-ai/dsh-client-ui-renderer'])
  const workspaces = { items: [], state: 'idle', phase: 'ready', error: null }
  await ctx.plugin({ name: 'preview-frame', inject: ['slots'], apply(ctx: any) {
    const binding = { key: undefined, props: {}, hooks: {}, keyedHooks: {} }
    const source = { getSnapshot: () => binding, subscribe: () => () => {} }
    ctx.slots.installScope('session', { current: source, bindingSource: () => source })
    ctx.slots.provideRoot({ hooks: { workspaces: { getSnapshot: () => workspaces, subscribe: () => () => {} } } })
    ctx.slots.register({ name: 'root', children: { main: { kind: 'keyed', scope: 'root' }, 'sidebar.panellist': { kind: 'list', scope: 'root' } } }, ({ renderSlot }: any) => <div style={{ height: '100vh' }}>{renderSlot('main', {}, { entryKey: 'dsh-skills-manager' })}</div>)
  } })
  await ctx.plugin(modules['dsh-skills-manager'])
  ctx.uiRenderer.mount(document.getElementById('app')!)
}
