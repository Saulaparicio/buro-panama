# Design System Master File (Proton Workspace)

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** BURÓ Panamá (Coworking Management Dashboard)
**Generated:** 2026-05-27
**Category:** Luxury/Premium Coworking Brand (Proton Workspace Design)

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary (Blue) | `#3d4ad8` | `--primary` |
| Primary Container | `#5865f2` | `--primary-container` |
| Secondary (Gold/Yellow) | `#7b5800` | `--secondary` |
| Secondary Container | `#ffbb00` | `--secondary-container` |
| Tertiary (Emerald) | `#006a48` | `--tertiary` |
| Tertiary Container | `#00865c` | `--tertiary-container` |
| Background / Surface | `#fbf8ff` | `--surface` |
| On-Surface (Text) | `#1a1b23` | `--on-surface` |
| Outline | `#767686` | `--outline` |
| Outline Variant | `#c6c5d7` | `--outline-variant` |
| Error | `#ba1a1a` | `--error` |

**Color Notes:** Premium Coworking Palette: Professional Blue, energetic Gold/Yellow accents, and Emerald green for availability/confirmations. A soft background reduces visual strain.

### Typography

- **Heading Font:** Manrope
- **Body Font:** Manrope
- **Label Font:** Manrope
- **Mood:** modern, professional, high-density, precise, clean

**CSS Variable Usage:**
```css
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');
font-family: 'Manrope', sans-serif;
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-base` | `4px` | Base unit spacing |
| `--space-gutter` | `24px` / `1.5rem` | Layout gutter |
| `--space-margin-mobile` | `16px` / `1rem` | Mobile screen margin |
| `--space-margin-desktop` | `40px` / `2.5rem` | Desktop screen margin |
| `--sidebar-width` | `280px` | Side menu expanded width |
| `--collapsed-sidebar` | `80px` | Side menu collapsed width |

### Rounding (Border Radius)

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `0.25rem` / `4px` | Small items (badges, tags) |
| `--radius-md` | `0.75rem` / `12px` | Medium items (buttons, inputs) |
| `--radius-lg` | `1rem` / `16px` | Standard items (cards, modals) |
| `--radius-xl` | `1.5rem` / `24px` | Large wrappers, panels |
| `--radius-full` | `9999px` | Pill buttons, circular avatars |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--primary);
  color: white;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--primary-container);
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--secondary);
  border: 2px solid var(--secondary-container);
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: 0px 8px 30px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  background-color: white;
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  transition: all 200ms ease;
}

.input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(92, 101, 242, 0.15);
  outline: none;
}
```

---

## Style Guidelines

**Style:** Modern SaaS + Premium Editorial layout.
**Keywords:** Clean, high contrast, soft shadows, rounded surfaces, micro-interactions, responsive grids.

### Do's and Don'ts

#### Do
- ✅ Maintain generous padding inside containers to let data "breathe".
- ✅ Use soft colored background tints (Emerald for Success, Gold/Yellow for warnings/secondary highlights).
- ✅ Ensure all clickable elements have `cursor: pointer`.

#### Don't
- ❌ Do NOT use pure black (#000000) for text; use `--on-surface` (`#1a1b23`).
- ❌ Do NOT use harsh 1px borders unless using soft tokens like `--outline-variant`.
