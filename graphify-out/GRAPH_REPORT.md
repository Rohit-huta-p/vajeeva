# Graph Report - /Users/rohithutagonna/Documents/Rohit/recipe-app  (2026-08-18)

## Corpus Check
- Corpus is ~24,743 words - fits in a single context window. You may not need a graph.

## Summary
- 59 nodes · 73 edges · 8 communities detected
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.81)
- Token cost: 22,000 input · 5,800 output

## God Nodes (most connected - your core abstractions)
1. `Vajeeva Recipe Compendium (83 Recipes)` - 10 edges
2. `User Flows Vajeeva` - 8 edges
3. `Recipe Detail Screen` - 6 edges
4. `Design Brief Ayurvedic Vajikarana App` - 5 edges
5. `Offline Sync Strategy` - 5 edges
6. `Recipe Mongoose Model` - 5 edges
7. `Aromatic Powder Blend (Shared Sub-recipe)` - 4 edges
8. `Contraindication Flags (DM / OW / LI / SD)` - 4 edges
9. `Texture-First IA Decision` - 4 edges
10. `Hero Flow P6` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Contraindication Flags (DM / OW / LI / SD)` --semantically_similar_to--> `Recipe Mongoose Model`  [INFERRED] [semantically similar]
  content/vajeeva-recipes.md → docs/specs/2026-08-17-vajeeva-rn-design.md
- `Offline Sync Strategy` --semantically_similar_to--> `Offline Flow P43`  [INFERRED] [semantically similar]
  docs/specs/2026-08-17-vajeeva-rn-design.md → docs/User-Flows.md
- `Design Brief Ayurvedic Vajikarana App` --references--> `Vajeeva Recipe Compendium (83 Recipes)`  [EXTRACTED]
  docs/Design-Brief.md → content/vajeeva-recipes.md
- `Recipe Detail Design Spec` --references--> `Vajeeva Recipe Compendium (83 Recipes)`  [EXTRACTED]
  docs/specs/2026-08-17-recipe-detail-design.md → content/vajeeva-recipes.md
- `Recipe Content Model (16 Fields)` --semantically_similar_to--> `RecipeSchema (Zod)`  [INFERRED] [semantically similar]
  docs/Design-Brief.md → docs/superpowers/plans/2026-08-17-vajeeva-api.md

## Hyperedges (group relationships)
- **Safety Gate Pattern** — userflow_safety_p42, component_contraindication_card, vrecipes_contraindication_flags, screen_recipe_detail [EXTRACTED 0.93]
- **Shared Types System** — arch_shared_package, schema_recipe_zod, model_recipe, route_admin [EXTRACTED 0.95]
- **Sensitive Health Context UX Pattern** — actor_patient, principle_discretion, decision_anonymous_first, rationale_no_social_login [INFERRED 0.83]

## Communities

### Community 0 - "API Backend Layer"
Cohesion: 0.19
Nodes (14): @vajeeva/shared Package, requireAdmin Middleware, requireAuth Middleware, Recipe Mongoose Model, SavedRecipe Mongoose Model, User Mongoose Model, Rationale: Health Flags Inline, Admin CRUD Routes (+6 more)

### Community 1 - "User Roles and IA Decisions"
Cohesion: 0.22
Nodes (11): Admin / Editor (CMS Web), Clinician (Secondary User, Deferred from v1), Patient (Primary User), Anonymous-First Browsing Decision, Texture-First IA Decision, Design Brief Ayurvedic Vajikarana App, Design Principle: Discretion and Dignity, Rationale: No Social Login (+3 more)

### Community 2 - "Recipe Content and Sources"
Cohesion: 0.24
Nodes (10): Aromatic Powder Bottom Sheet Component, AYUSH Traditional Food Recipes, Bhojana Kutuhala (BK), ICMR-NIN Dietary Guidelines for Indians 2024, Ksemakutuhalam (KK), Aromatic Powder Blend (Shared Sub-recipe), Vajeeva Recipe Compendium (83 Recipes), Liquid Recipes (23) (+2 more)

### Community 3 - "UI Components and Layouts"
Cohesion: 0.22
Nodes (10): Ingredient Table Component, Source Citation Pill Component, Additive Scroll Layout, Tabbed + Pinned Cook Layout, Design Principle: Evidence-Anchored Credibility, Cook Mode Screen, Glossary Term Screen (D4), Home / Discovery Screen (+2 more)

### Community 4 - "Architecture and Sync Strategy"
Cohesion: 0.33
Nodes (6): Vajeeva API Implementation Plan, Monorepo Architecture, Offline Sync Strategy, Rationale: No CRDTs, React Native App Design Spec, WatermelonDB

### Community 5 - "Safety Gate"
Cohesion: 0.5
Nodes (4): Contraindication Card Component, Design Principle: Safety-First, Safety Flow P42, Contraindication Flags (DM / OW / LI / SD)

### Community 6 - "Design Spec and Tokens"
Cohesion: 0.67
Nodes (3): Design Tokens, Recipe Content Model (16 Fields), Recipe Detail Design Spec

### Community 7 - "Screen Index"
Cohesion: 1.0
Nodes (1): Vajeeva v1 Screen Index

## Knowledge Gaps
- **21 isolated node(s):** `Vajeeva v1 Screen Index`, `Vajeeva API Implementation Plan`, `Bhojana Kutuhala (BK)`, `Ksemakutuhalam (KK)`, `ICMR-NIN Dietary Guidelines for Indians 2024` (+16 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Screen Index`** (1 nodes): `Vajeeva v1 Screen Index`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Vajeeva Recipe Compendium (83 Recipes)` connect `Recipe Content and Sources` to `User Roles and IA Decisions`, `Safety Gate`, `Design Spec and Tokens`?**
  _High betweenness centrality (0.316) - this node is a cross-community bridge._
- **Why does `Contraindication Flags (DM / OW / LI / SD)` connect `Safety Gate` to `API Backend Layer`, `Recipe Content and Sources`?**
  _High betweenness centrality (0.280) - this node is a cross-community bridge._
- **Why does `User Flows Vajeeva` connect `User Roles and IA Decisions` to `UI Components and Layouts`, `Safety Gate`?**
  _High betweenness centrality (0.278) - this node is a cross-community bridge._
- **What connects `Vajeeva v1 Screen Index`, `Vajeeva API Implementation Plan`, `Bhojana Kutuhala (BK)` to the rest of the system?**
  _21 weakly-connected nodes found - possible documentation gaps or missing edges._