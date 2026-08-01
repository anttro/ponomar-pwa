# Enrichment Workflow for AI Agents

## Quick Start Guide

Run enrichment in safe mode first:
```bash
# Dry run to see matches
npx tsx scripts/enrich-lives.ts

# Write changes when confident
npx tsx scripts/enrich-lates.ts --write
```

## Common Enrichment Mistakes

### Auto-Matching Pitfalls
- ⚠️ Don't ignore low scores when a clear match exists
- ⚠️ Don't skip review phase entirely — need to examine unmatched entries carefully
- ⚠️ Don't assume auto means "correct" — scores ≥0.6 can still be wrong-saint
- ⚠️ Don't overlook `already-filled` status — some matches hit CIds already filled

### Manual Fixes Errors
- ⚠️ Don't create substrings that match multiple source titles on same date
- ⚠️ Don't use substrings with spaces that appear in multiple contexts
- ⚠️ Don't forget about OCR artifacts in source titles (Latin `a`, `[1]` markers)
- ⚠️ Don't mismatch case forms: account for case differences in substrings

### Collision Issues
- ⚠️ Don't expect first chapter to have a heading (this is by design)
- ⚠️ Don't count chapters by counting `<b>` tags alone (verify by checking content)
- ⚠️ Don't append to CIds that already have life.text without checking collision behavior
- ⚠️ Don't assume all multi-source CIds follow same pattern

### Validation Skipping
- ⚠️ Don't skip `npx tsx scripts/validate-data.ts` — it catches real errors
- ⚠️ Don't skip `npx tsc --noEmit` — type errors indicate real problems
- ⚠️ Don't skip `npm run build` — build failures need investigation
- ⚠️ Don't assume "all files valid" without actually running it

## Decision Points for AI Agents

### When to Add MANUAL_FIXES
- When score is 0.35-0.6 and you can identify the correct target
- When source title contains distinctive substring not in other titles on same date
- When auto-matcher picks wrong saint (e.g., different homonym on same date)
- When target CId exists but is listed on wrong calendar date (bundle bug)
- When narrative maps to known CId but has empty life (can be enriched)

### When to Leave Unmatched
- When source is a narrative or homily without saint association
- When no appropriate CId exists in the bundle for that saint
- When target CId already has life (no data improvement possible)
- When cross-date narratives have no clear target CId

### When to Use `--month` Flag
- When working on enrichment for a specific period only
- When testing changes without affecting entire dataset
- When troubleshooting issues in a particular month

## Quality Checkpoints

### After Manual Fixes Addition
- Verify substring uniqueness per date (use verification script)
- Check that target CIds exist and are empty
- Re-run dry run to verify improvement
- Check for potential new conflicts with existing fixes

### After Writing Changes
- Verify coverage increased appropriately
- Check that collision targets have correct chapter count
- Confirm only intended files were written
- Verify no unintended side effects on other files

### Before Committing
- Run full validation: `npx tsx scripts/validate-data.ts`
- Type check: `npx tsc --noEmit`
- Build verify: `npm run build`
- Check git status to confirm intended files staged

## Troubleshooting Common Issues

### Unexpected Unmatched Entries
**Problem**: Good match exists but score < 0.35
- **Solution**: Add MANUAL_FIX with distinctive substring
- **Check**: Verify target CId exists and is empty
- **Alternative**: Check if bundle has correct CIds on that date

### No Auto Matches on Date
**Problem**: All entries on a date show unmatched
- **Solution**: Check menaion-bundle.json for correct CIds on that date
- **Alternative**: May be narrative without target CId → leave unmatched

### Target Already Filled
**Problem**: Manual fix shows `already-filled` in report
- **Solution**: Fix targeting or remove fix (no data change)
- **Check**: Verify CId already has life.text (no improvement possible)

### Wrong Match Applied
**Problem**: Good score applied to wrong CId
- **Solution**: Add MANUAL_FIX with more distinctive substring
- **Verify**: Check score distribution for potential collisions

### Collision Issues
- ⚠️ **First chapter unheaded**: This is expected behavior by design
- ⚠️ **Expected behavior**: First source writes without heading, subsequent sources append
- **Check**: Verify total chapters match expected count for CId

### Strange JSON Syntax Errors
- **Problem**: Parse errors in data files after modification
- **Solution**: Check JSON syntax, fix trailing commas, quote issues
- **Verify**: Run `validate-data.ts` to get specific error location

### Build Size Changes
- **Problem**: Unexpected file size increases/decreases
- **Solution**: Check for malformed content, duplicate data, formatting changes
- **Check**: Compare before/after file sizes in git diff

## Verification Commands

### Coverage Tracking
```bash
# Check coverage statistics
python3 -c "
import json, glob, os
total=has=0
for fp in glob.glob('static/data/ru/lives/*.json'):
    data=json.load(open(fp))
    for cid,entry in data.items():
        total+=1
        if isinstance(entry.get('life'), dict) and entry.get('life',{}).get('text'):
            has+=1
print(f'Coverage: {has}/{total} ({has*100//total}%) lives with text')
"
```

### Collision Chapter Count Check
```bash
# Check collision targets have correct chapter counts
python3 -c "
import json, re
misc = json.load(open('static/data/ru/lives/misc.json'))
for cid in ['493', '1674', '257401']:  # Known collision targets
    text = misc[cid]['life']['text']
    headings = re.findall(r'<b>([^<]+)</b>', text)
    print(f'{cid}: {len(headings)} chapters')
"
```

### Find Specific Pattern in Data
```bash
npx tsx scripts/tools/search-texts.ts "Захарии" --lang cu --type menaion
```

### Get Statistics by Language
```bash
npx tsx scripts/tools/stats.ts --lang ru
```

## Recent Context Updates

### Known Fixed Issues
- 868 Иаков Боровицký moved from 05-22 to 10-23 (bundle mis-mapping correction)
- Сретение→373 added (02-02 Сказание about Presentation)
- Захарий Печерский→822 added (03-24 miracle story)
- Анна пророчица→2396 added (08-28 prophetess Anna)

### Current Unmatched Floor
- 27 entries remain unmatched (all narratives/homilies or already-filled targets)
- These are at the floor for Chetyi-Minei source — no recoverable matches available

## File Routing Quick Reference

### Lives File Routing
- Files: `static/data/ru/lives/01.json` through `12.json` for month-prefixed CIds
- File: `misc.json` for non-month-prefixed CIds
- Route: `bundleFileForCid(cid: string):` checks `/^(0[1-9]|1[0-2])\d+/.test(cid)`

### Bundle File Organization
- Main bundle: `static/data/cu/menaion-bundle.json` (authoritative calendar)
- Language overrides: `{lang}-menaion-bundle.json`
- Format: Date keys (MM-DD) with arrays of CId objects

## Next Steps After Completing Enrichment

### Quality Assurance
- Verify collision targets have correct chapter counts
- Check that file sizes are reasonable after writing
- Confirm coverage increased as expected

### Documentation Updates
- Update DATA_FORMAT.md or DATA_RUS.md if schema changed
- Update coverage statistics in relevant documentation
- Add new manual fixes to enrichment documentation if needed

### Commit Sequence
```bash
# 1. Validate, typecheck, build all passing
npx tsx scripts/validate-data.ts && npx tsc --noEmit && npm run build

# 2. Stage all changes
git add scripts/enrich-lives.ts scripts/output/lives-match-report.json static/data/ru/lives/

# 3. Commit with description
git commit -m "enrich [N] more ru lives: [description]"
```

## Coverage Tracking

### Current Status
- Total CIds: 3046
- Lives with text: 1190 (enriched from Chetyi-Minei)
- Unmatched minei chapters: 27 (floor: narratives, no-target, already-filled)
- Files validated: 274 files (all passing)

### Recent Enrichment Work
- Baseline: 1009 lives with text (from prior work)
- Latest commits added 181 lives (121 + 57 + 3)
- Manual fixes added: 214 total in enrich-lives.ts
- Bundle corrections applied: 868 date fix

### Progress Tracking
- Review band: 127 entries resolved, 0 remaining
- Unmatched band: 94 → 30 → 27 (final floor)
- Coverage: 1009→1130→1190 lives (181 net increase)

## Example Workflow for Adding Manual Fixes

### Step 1: Identify Problematic Match
```
Date: 03-24
Source: "Воспоминание о чуде в Печерском monastery" → score 0.12
Candidate: 722 (Прп. Евстратий Печерский, LIFE) - wrong saint
Target: 822 (Прп. Захарий Печерский, EMPTY) - correct saint
```

### Step 2: Create Fix
```typescript
'03-24|воспоминание о чуде': '822'
```

### Step 3: Verify Uniqueness
```bash
# Check if substring is unique on date 03-24
python3 -c "
import json, re
m=json.load(open('scripts/output/minei.json'))
titles=[t['title'] for t in m['03-24']]
cnt=sum(1 for t in titles if 'воспоминание о чуде' in re.sub(r'\s+',' ',t['title']).lower())
print(f'Count: {cnt}')
"
```

### Step 4: Apply and Verify
```bash
npx tsx scripts/enrich-lives.ts  # Check new counts
npx tsx scripts/validate-data.ts  # Validate all files
```