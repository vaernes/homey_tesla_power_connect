# Gemini AI Instructions

## Project Rules

1. **Do NOT update `.homeychangelog.json`.**
   - The changelog is manually managed or updated only upon explicit request.
   - Do not automatically increment versions or add entries during routine refactors.

2. **Use Static Constants.**
   - All string literals (capabilities, settings, debug keys, units, logs) must be defined in `lib/constants.ts`.
   - Avoid hardcoding strings in `device.ts` or `driver.ts`.

3. **Memory Optimization.**
   - Prioritize memory efficiency.
   - Avoid unnecessary object creation in polling loops.
   - Use pre-computed values where possible (e.g., API URLs, Regex).
