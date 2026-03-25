---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T01: Merge M005 code + install archiver

1. Merge branch milestone/M005 into milestone/M006 worktree\n2. Verify key files exist: ModelForm.tsx, IAGenerationSection.tsx, generated_visuals routes, ai/ service\n3. npm install archiver @types/archiver\n4. Verify tsc --noEmit still passes after merge + install

## Inputs

- `milestone/M005 branch`

## Expected Output

- `package.json with archiver dependency`
- `Full M005 codebase available in worktree`

## Verification

git log --oneline -3 shows M005 commits; ls src/app/admin/\(protected\)/produits/ModelForm.tsx confirms presence; npm ls archiver shows installed; npx tsc --noEmit passes
