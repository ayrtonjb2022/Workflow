# OpenSpec — CrmErp

This directory holds the SDD (Spec-Driven Development) artifacts for the CrmErp project.

## Structure

```
openspec/
├── config.yaml          <- Project config, rules, testing capabilities
├── README.md            <- This file
├── specs/               <- Main specs (source of truth per domain)
│   └── {domain}/
│       └── spec.md
└── changes/             <- Active change folders
    ├── archive/         <- Completed changes (audit trail)
    └── {change-name}/
        ├── state.yaml        <- DAG state
        ├── proposal.md       <- Change proposal
        ├── specs/{domain}/   <- Delta specs
        ├── design.md         <- Technical design
        ├── tasks.md          <- Task breakdown
        └── verify-report.md  <- Verification results
```

## Workflow

1. **sdd-explore** — Explore ideas before committing
2. **sdd-propose** — Propose a change with intent, scope, approach
3. **sdd-spec** — Write delta specs with requirements & scenarios
4. **sdd-design** — Technical design & architecture
5. **sdd-tasks** — Break into implementation tasks
6. **sdd-apply** — Implement tasks
7. **sdd-verify** — Verify implementation matches specs
8. **sdd-archive** — Archive completed change, merge deltas

## Conventions

- Requirements use RFC 2119 keywords (MUST, SHALL, SHOULD, MAY)
- Scenarios use Given/When/Then format
- Multi-tenant considerations MUST be documented per change
- All changes go through the full SDD lifecycle
