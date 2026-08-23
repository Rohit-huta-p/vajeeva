# Graph Report - .  (2026-08-23)

## Corpus Check
- 171 files · ~111,915 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 297 nodes · 481 edges · 30 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `toListItem()` - 3 edges
2. `emit()` - 3 edges
3. `tryRefresh()` - 3 edges
4. `cap()` - 2 edges
5. `texLabel()` - 2 edges
6. `ln()` - 2 edges
7. `IconBack()` - 2 edges
8. `sc()` - 2 edges
9. `scaledSheet()` - 2 edges
10. `deriveFit()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (2): computeUsedIn(), seed()

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (4): api(), ApiError, setToken(), tryRefresh()

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (0): 

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (2): sc(), scaledSheet()

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (0): 

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (5): handleFiles(), uploadFile(), emit(), move(), set()

### Community 6 - "Community 6"
Cohesion: 0.17
Nodes (3): deriveFit(), sortImages(), toListItem()

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (2): cap(), texLabel()

### Community 8 - "Community 8"
Cohesion: 0.24
Nodes (2): IconBack(), ln()

### Community 9 - "Community 9"
Cohesion: 0.25
Nodes (0): 

### Community 10 - "Community 10"
Cohesion: 0.29
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 0.4
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 0.4
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 0.5
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 0.67
Nodes (2): issueRefreshToken(), signRefresh()

### Community 16 - "Community 16"
Cohesion: 0.67
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 17`** (2 nodes): `setup.ts`, `setup()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (2 nodes): `teardown.ts`, `teardown()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `recipe.schema.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `user.schema.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `savedRecipe.schema.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `jest.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `metro.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `babel.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `opening.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `onboarding.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `saved.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `theme.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._