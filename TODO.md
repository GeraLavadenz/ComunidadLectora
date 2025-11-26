# TODO List for Fixing TypeScript 'any' Types in Writing Pages

## Objective
Replace all explicit 'any' types in the following files with appropriate TypeScript interfaces and types to resolve ESLint no-explicit-any errors and ensure type safety:
- src/modules/escritura/pages/capitulos.tsx
- src/modules/escritura/pages/CreaCapitulos.tsx
- src/modules/escritura/pages/editarCapitulo.tsx
- src/components/header/components/GenreMenu.tsx

## Steps

### Step 1 - capitulos.tsx
- Replace state `story` from `any|null` to a proper interface `Story` with needed properties.
- Replace all `any` in function parameters, API data, and event handlers with correct types.
- Refactor casts like `(hookParams as any).id` with safe type guards or typed hooks.
- Replace `suggestionAbortRef` from number|null with proper type.
- Improve typing on Supabase API responses.

### Step 2 - CreaCapitulos.tsx
- Replace `any` in error catch blocks with `unknown` and proper error handling.
- Refactor `ChipEditor` component props from `any` to a generic or specific typed interface.
- Add typing for event handlers instead of `any`.
- Tighten types for state variables.

### Step 3 - editarCapitulo.tsx
- Replace `any` in catch blocks with `unknown`.
- Confirm `ChapterRow` type fully represents chapter entity.
- Add types for event handlers where unspecified.
- Validate all API responses strictly typed.

### Step 4 - GenreMenu.tsx
- Replace mapping callback param `row: any` with a typed TagRow or equivalent interface.
- Add explicit error type instead of `any`.
- Verify state variable typings.

## Post-edit steps
- Run build / lint to confirm no errors.
- Conduct basic manual UI test to verify no runtime issues.
- Provide summary of changes and commit.

---

I will proceed with these changes in the above order carefully to avoid breaking behavior or removing functionality.
