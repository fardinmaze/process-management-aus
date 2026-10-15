// Layout spike check: node tests/layout-spike.mjs
import { layout, metrics } from '../src/layout/layout.js'
import { SAMPLES } from '../src/layout/samples.js'

for (const [key, s] of Object.entries(SAMPLES)) {
  for (const allowLoops of [true, false]) {
    const res = layout(s.items, null, { allowLoops })
    const m = metrics(res)
    console.log(`${key.padEnd(11)} loops ${allowLoops ? 'on ' : 'off'}`, JSON.stringify(m), res.warnings.length ? `warnings: ${res.warnings.length}` : '')
  }
}
