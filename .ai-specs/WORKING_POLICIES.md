# Working Policies for AI Agents

## Data Modification Rules

### Never Overwrite Existing Content
- **CRITICAL**: Never overwrite existing `life.text` fields in lives entries
- Enrichment pipeline only fills empty entries
- If a target already has content, classify as `already-filled` and skip
- **Bulgakov is secondary source**: fills gaps only, never overrides Minei content

### File Modification Permissions
- **Allowed**: Adding new life.text to empty entries
- **Allowed**: Adding manual fixes to `enrich-lives.ts` MANUAL_FIXES
- **Allowed**: Correcting menaion-bundle.json for CId date corrections
- **Forbidden**: Modifying existing life.text content
- **Forbidden**: Deleting or renaming CIds without proper validation
- **Forbidden**: Changing JSON structure without updating related code

## Validation Requirements

### Pre-Commit Checklist
All changes must pass all three checks:

```bash
# 1. Type safety
npx tsc --noEmit
# Expected: No TypeScript errors

# 2. Build verification
npm run build
# Expected: Successful build with reasonable bundle sizes

# 3. Data validation
npx tsx scripts/validate-data.ts
# Expected: "All files valid!" or specific error count
```

### When to Stop
- Stop immediately if any validation fails
- Fix errors before proceeding
- Address TypeScript compilation issues
- Check build output for unexpected size changes

## Commit Message Standards

### Format Conventions

**Enrichment commits**:
```
enrich [N] more ru lives: [brief description]
```

**Bundle fix commits**:
```
fix bundle: move [saint] from [date1] to [date2]
```

**Script updates**:
```
update [script name]: [brief description]
```

**General guidance**:
- Be specific about what changed
- Reference specific CIds or dates when applicable
- Keep messages concise but descriptive

## File Change Guidelines

### Static Data Files
- **Tracked**: `static/data/` directory (all JSON files tracked)
- **Not tracked**: `scripts/output/minei.json`, `scripts/output/bulgakov.json`
- **Validate**: Always run typecheck and build after data changes

### Script Files
- Maintain existing code patterns
- Use existing helper functions when available
- Update documentation in relevant markdown files

### Output Files
- Generated files (`dist/`, `scripts/output/`) should not be committed
- Only commit source code and data files

## Code Quality Standards

### TypeScript Requirements
- Maintain strict typing
- Follow existing code conventions
- Add type annotations where appropriate
- Use proper error handling

### Data Structure Integrity
- Maintain CId naming conventions
- Preserve JSON structure consistency
- Ensure required fields are present (`name.nominative` in lives entries)

## Error Handling Protocols

### When Validation Fails
1. Review error messages carefully
2. Identify root cause (JSON syntax, missing fields, type issues)
3. Fix the underlying problem
4. Re-run validation until it passes
5. Then proceed to type checking

### When TypeScript Fails
1. Check for type mismatches in modified code
2. Verify imports and exports
3. Ensure all dependencies are properly declared
4. Fix type errors
5. Re-run tsc --noEmit

### When Build Fails
1. Check console output for specific errors
2. Verify data file integrity
3. Check for import/export issues
4. Resolve build errors before proceeding

## Documentation Requirements

### When Modifying Data Schemas
- Update relevant documentation files (DATA_EN.md, DATA_RUS.md)
- Note any breaking changes or invariants
- Update project README if structural changes

### When Adding New Scripts
- Document the script's purpose and usage
- Add NPM script entry if needed
- Update project documentation as appropriate

## Common Operational Pitfalls

### Data Modification Risks
- ⚠️ **Don't accidentally overwrite existing life.text** — Always check before writing
- ⚠️ **Don't skip validation** — Always validate before committing
- ⚠️ **Don't ignore build errors** — Build failures indicate real problems
- ⚠️ **Don't commit generated files** — Avoid committing dist/ or output files

### Code Change Risks
- ⚠️ **Don't break existing patterns** — Follow established code conventions
- ⚠️ **Don't duplicate logic** — Use existing helper functions
- ⚠️ **Don't ignore type safety** — Maintain TypeScript strict typing
- ⚠️ **Don't make undocumented changes** — Update relevant documentation

### Commit Risks
- ⚠️ **Don't commit without validation** — Ensure all checks pass
- ⚠️ **Don't write vague commit messages** — Be specific about what changed
- ⚠️ **Don't assume `static/data/` is excluded** — It's tracked, commit your changes

## Workflow for New Enrichment Work

### Before Starting
1. Review existing MANUAL_FIXES in `enrich-lives.ts`
2. Understand the current coverage status
3. Identify which source (Minei or Bulgakov) and dates you're targeting

### During Work
1. Use dry runs first: `npx tsx scripts/enrich-lives.ts`
2. Review the match report carefully
3. Add MANUAL_FIXES only for problematic matches
4. Re-run dry run until satisfied with results
5. Only use `--write` when confident

### After Completion
1. Verify file sizes are reasonable
2. Check that collision appends are correct
3. Run full validation suite
4. Commit with descriptive message

## Quality Assurance Standards

### Coverage Tracking
- Monitor coverage statistics: `1203/3046 lives with text`
- Track unmatched counts: 27 Minei + 121 Bulgakov (floor)
- Report changes in coverage when adding MANUAL_FIXES

### Content Verification
- For collision targets, verify chapter counts
- Check that first chapter being unheaded is expected behavior
- Verify that life.text contains expected content for known CIds

### Consistency Checks
- Ensure similar fixes follow the same pattern
- Maintain consistency with existing MANUAL_FIXES format
- Keep naming conventions consistent across all entries

## Quick Reference for Common Operations

### Adding a MANUAL_FIX
```typescript
const MANUAL_FIXES: Record<string, string> = {
  'MM-DD|distinctive-substring': 'CId',
};
```
- Key format: `${date}|${substring}` → CId
- Substring must be unique within that date
- CId must be empty for the fix to have effect

### Running Enrichment
```bash
# Minei dry run
npx tsx scripts/enrich-lives.ts

# Minei write
npx tsx scripts/enrich-lives.ts --write

# Bulgakov dry run
npx tsx scripts/enrich-lives.ts --bulgakov

# Bulgakov write
npx tsx scripts/enrich-lives.ts --bulgakov --write

# Single month
npx tsx scripts/enrich-lives.ts --month 01
npx tsx scripts/enrich-lives.ts --write --month 01
```

### Validating Data
```bash
# Main validator
npx tsx scripts/validate-data.ts

# Period-specific validators
npx tsx scripts/validate-menaion.ts
npx tsx scripts/validate-triodion.ts
```

### Quick Coverage Check
```bash
python3 -c "
import json,glob,os
total=has=0
for fp in sorted(glob.glob('static/data/ru/lives/*.json') + glob.glob('static/data/ru/lives/misc/*.json')):
    data=json.load(open(fp))
    for cid,entry in data.items():
        total+=1
        if isinstance(entry.get('life'),dict) and entry.get('life',{}).get('text'):
            has+=1
print(f'Coverage: {has}/{total} ({has*100//total}%) lives with text')
"
```