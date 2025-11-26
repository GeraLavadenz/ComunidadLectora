# TODO: Fix Linting Issues in CreaCapitulos.tsx

- [x] Remove unused variables: 'storyTitle', 'aiResult', 'data' (from insert), and unused function 'openAISidePanel'
- [x] Remove the unused 'ChipEditor' component entirely
- [x] Replace 'any' types with proper TypeScript types:
  - [x] In loadMeta reduce: Type 'c' as { chapter_number?: number }
  - [x] In catch block: Type 'err' as unknown
