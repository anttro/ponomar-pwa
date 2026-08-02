# Enrichment Workflow for AI Agents

## Quick Start Guide

Run enrichment in safe mode first:
```bash
# Minei dry run
npx tsx scripts/enrich-lives.ts

# Minei write
npx tsx scripts/enrich-lives.ts --write

# Bulgakov dry run
npx tsx scripts/enrich-lives.ts --bulgakov

# Bulgakov write
npx tsx scripts/enrich-lives.ts --bulgakov --write
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

### Bulgakov-Specific Issues
- ⚠️ Bulgakov only covers Menaion (saints by calendar date), not Triodion/Pentecostarion
- ⚠️ Bulgakov is secondary source — only fills gaps, never overrides Minei
- ⚠️ Some Bulgakov entries are feast descriptions, not saint lives — may have no target CId

### Validation Skipping
- ⚠️ Don't skip `npx tsc --noEmit` — type errors indicate real problems
- ⚠️ Don't skip `npm run build` — build failures need investigation
- ⚠️ Don't skip data validation — run `validate-data.ts` after changes

## Decision Points for AI Agents

### When to Add MANUAL_FIXES
- When auto-matcher picks wrong saint (e.g., different homonym on same date)
- When target CId exists but is listed on wrong calendar date (bundle bug)
- When narrative maps to known CId but has empty life (can be enriched)
- When Bulgakov title contains distinctive substring not in Minei titles

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
- Verify substring uniqueness per date
- Check that target CIds exist and are empty
- Re-run dry run to verify improvement
- Check for potential new conflicts with existing fixes

### After Writing Changes
- Verify coverage increased appropriately
- Check that collision targets have correct chapter count
- Confirm only intended files were written
- Verify no unintended side effects on other files

### Before Committing
- Type check: `npx tsc --noEmit`
- Build verify: `npm run build`
- Run data validation: `npx tsx scripts/validate-data.ts`
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

### Bulgakov-Specific Issues
- **Problem**: Bulgakov entry has no matching CId
- **Solution**: Check if it's a feast day description (not a saint life)
- **Alternative**: Search lives-index.json for the saint's name
- **Check**: Verify the date has the correct CIds in the menaion bundle

## Verification Commands

### Coverage Tracking
```bash
python3 -c "
import json, glob, os
total=has=0
for fp in sorted(glob.glob('static/data/ru/lives/*.json') + glob.glob('static/data/ru/lives/misc/*.json')):
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
python3 -c "
import json, re
for fp in ['static/data/ru/lives/misc/4.json', 'static/data/ru/lives/misc/1.json']:
    data = json.load(open(fp))
    for cid in ['493', '1674', '257401']:
        if cid in data:
            text = data[cid]['life']['text']
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
- 868 Иаков Боровицкий moved from 05-22 to 10-23 (bundle mis-mapping correction)
- Сретение→373 added (02-02 Сказание about Presentation)
- Захарий Печерский→822 added (03-24 miracle story)
- Анна пророчица→2396 added (08-28 prophetess Anna)

### Current Unmatched Floor
- **Minei**: 27 entries remain unmatched (all narratives/homilies or already-filled targets)
- **Bulgakov**: 121 entries unmatched (no recoverable targets — saints already have lives or no CId)
- These are at the floor for both sources — no recoverable matches available

## File Routing Quick Reference

### Lives File Routing
- Files: `static/data/ru/lives/01.json` through `12.json` for month-prefixed CIds
- Files: `static/data/ru/lives/misc/0.json` through `9.json` for non-month-prefixed CIds
- Route: `bundleFileForCid(cid)` checks `/^(0[1-9]|1[0-2])\d+/.test(cid)`

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
- Update DATA_EN.md or DATA_RUS.md if schema changed
- Update coverage statistics in relevant documentation
- Add new manual fixes to enrichment documentation if needed

### Commit Sequence
```bash
# 1. Typecheck, build, validate all passing
npx tsc --noEmit && npm run build && npx tsx scripts/validate-data.ts

# 2. Stage all changes
git add scripts/enrich-lives.ts scripts/output/lives-match-report.json static/data/ru/lives/

# 3. Commit with description
git commit -m "enrich [N] more ru lives: [description]"
```

## Coverage Tracking

### Current Status
- Total CIds: 3046
- Lives with text: 1203 (enriched from Chetyi-Minei + Bulgakov)
- Unmatched Minei: 27 (floor: narratives, no-target, already-filled)
- Unmatched Bulgakov: 121 (floor: no recoverable targets)

### Sources
- **Chetyi-Minei**: 1190 lives, 64 manual fixes, 27 unmatched at floor
- **Bulgakov Desktop Book**: 13 lives, 9 manual fixes, 121 unmatched at floor
- **Total coverage**: 1203/3046 (39%)

### Progress Tracking
- Minei band: 94 → 30 → 27 (final floor)
- Bulgakov: 332 entries processed, 13 new lives, 121 unmatched
- Coverage: 1009→1130→1190→1203 (194 net increase)

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
python3 -c "
import json, re
m=json.load(open('scripts/output/minei.json'))
titles=[t['title'] for t in m['03-24']]
cnt=sum(1 for t in titles if 'воспоминание о чуде' in re.sub(r'\s+',' ',t).lower())
print(f'Count: {cnt}')
"
```

### Step 4: Apply and Verify
```bash
npx tsx scripts/enrich-lives.ts  # Check new counts
npx tsx scripts/validate-data.ts  # Validate all files
```