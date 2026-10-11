# Process Maps

Collaborative process-mapping platform (working title). Owners initiate a map, split it into sections, allocate sections to contributors, and take it through two approval gates before it is published to a read-only viewer.

- Full documentation: [`DOCUMENTATION.md`](DOCUMENTATION.md)
- Product definition: [`MVP_SPEC.md`](MVP_SPEC.md)
- Working rules: [`CLAUDE.md`](CLAUDE.md)
- Current status: [`PROGRESS.md`](PROGRESS.md)

## Stack

Vue 3, Vue Flow, Tailwind. There is no backend in this repo yet: `src/mock/server.js` is an in-browser stand-in for the Django `process/` API (state machines, permission checks, approval chain, search) that persists to localStorage. `src/api/index.js` is the single place to switch to real HTTP calls.

`legacy/src-smicee-extract/` holds the frontend extracted from the SMICEE ERP, kept for reference when porting the approval-chain UI. It is not built.

## Run

    npm install
    npm run dev        # http://localhost:3000, sign in with a demo account (password: demo)
    npm run build
    npm test           # runs the spec's demo scenario and permission checks against the API layer

Demo accounts: `admin@demo.test`, `owner@demo.test`, `hr.contrib@demo.test`, `it.contrib@demo.test`, `approver@demo.test`, `viewer@demo.test`. Use "Reset demo data" in the sidebar for a clean start.
