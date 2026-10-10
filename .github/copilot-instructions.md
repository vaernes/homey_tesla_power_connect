# Project Guidelines

## Project Rules

- Do not update `.homeychangelog.json` unless explicitly requested. It is manually managed; do not increment versions or add routine-refactor entries.
- Define all string literals for capabilities, settings, debug keys, units, and logs in `lib/constants.ts`. Do not hardcode them in `device.ts` or `driver.ts`.
- Prioritize memory efficiency. Avoid unnecessary object creation in polling loops and pre-compute values such as API URLs and regular expressions where possible.
