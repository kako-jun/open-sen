# DESIGN.md — open-sen (Project Registry)

## 1. Visual Theme

A project registry with dual themes: a cyberpunk neon dark theme (default) and a clean Koshien light theme. The dark theme features glass morphism panels, neon glow effects, and scanline overlays — a futuristic command center for managing projects. The light theme strips away the effects for a professional, clean presentation.

## 2. Color Palette

### Dark Theme (Cyberpunk)

| Token | Value | Usage |
|---|---|---|
| `accent` | `#b8ff57` | Neon green — primary accent, highlights, glow source |
| `pink` | `#ff6b9d` | Secondary accent, alerts, featured badges |
| `bg-card` | `rgba(8,12,22,0.55)` | Glass card backgrounds |
| `border-accent` | `rgba(184,255,87,0.2)` | Card borders, divider lines |
| `bg-body` | `#0a0e17` | Page background |
| `text-primary` | `#ffffff` | Headings, primary text |
| `text-secondary` | `rgba(255,255,255,0.7)` | Body text, descriptions |

### Light Theme (Koshien)

| Token | Value | Usage |
|---|---|---|
| `accent` | `#16a34a` | Green — primary accent |
| `pink` | `#dc2626` | Red — alerts, featured badges |
| `bg-card` | `#ffffff` | Card backgrounds |
| `border-accent` | `rgba(22,163,74,0.2)` | Card borders |
| `bg-body` | `#f8fafc` | Page background |
| `text-primary` | `#1a1a2e` | Headings |
| `text-secondary` | `#4a5568` | Body text |

### Platform Badge Colors

| Platform | Color |
|---|---|
| GitHub | `#333333` |
| Zenn | `#3ea8ff` |
| Crates.io | `#e6522c` |
| npm | `#cb3837` |
| PyPI | `#3775a9` |

## 3. Typography

| Role | Font | Size | Weight |
|---|---|---|---|
| Headings (h1–h3) | `Orbitron` (Google Fonts) | 24–36px | 700–900 |
| Body | System sans-serif stack | 14–16px | 400 |
| Code/stats | Monospace stack | 13px | 400 |
| Badges | System sans-serif | 11px | 600 |

Orbitron is used only for headings to deliver the cyberpunk aesthetic without impacting readability of body text. In light theme, Orbitron may be replaced with a standard sans-serif.

## 4. Component Stylings

### Glass Morphism Cards (Dark)
- Background: `rgba(8,12,22,0.55)`
- Border: 1px solid `rgba(184,255,87,0.2)`
- `backdrop-filter: blur(12px)`
- Border-radius: 12px

### Neon Text Glow (Dark)
- `text-shadow: 0 0 10px rgba(184,255,87,0.5), 0 0 20px rgba(184,255,87,0.3)`
- Applied to headings and key stats

### Scanline Overlay (Dark)
- Pseudo-element with repeating-linear-gradient
- 2px transparent / 2px rgba(0,0,0,0.05) pattern
- `pointer-events: none`, covers entire viewport

### Platform Badges
- Pill-shaped (border-radius: 999px)
- Background: platform color
- Text: white, 11px, semi-bold
- Padding: 2px 8px

### Recharts (Dark)
- Stroke: cyan with glow filter
- Grid lines: `rgba(255,255,255,0.05)`
- Tooltip: glass morphism bg

### Banner
- Shimmer animation: `6s linear infinite`
- Gradient sweep across the banner surface

## 5. Layout Principles

- Max-width: `1280px`, centered
- Project grid: `display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`
- Gap: 24px between cards
- Page sections stacked vertically with 48px spacing
- Sidebar filters on wide screens, collapsible on narrow

## 6. Depth & Elevation

| Level | Treatment | Usage |
|---|---|---|
| Background | Flat dark / light | Page body |
| Cards | Glass blur + border glow | Project cards |
| Floating | Stronger blur + shadow | Dropdowns, tooltips |
| Modal | Full overlay + centered card | Detail views |

In dark theme, depth is conveyed through blur intensity and glow brightness rather than shadows. In light theme, standard box-shadows are used.

## 7. Do's and Don'ts

**Do:**
- Use `backdrop-filter: blur()` for glass morphism in dark theme
- Apply neon glow sparingly — headings and key metrics only
- Use Orbitron for headings, system fonts for body
- Keep scanline overlay at very low opacity (0.05)
- Match platform badge colors exactly to official brand colors

**Don't:**
- Apply glass morphism or glow effects in the light theme
- Use neon green (#b8ff57) as a background color — it is accent/glow only
- Make the scanline overlay interactive or visible enough to impair reading
- Mix dark theme and light theme tokens
- Exceed 1280px content width

## 8. Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| > 1280px | Max-width container, centered, multi-column grid |
| 900–1280px | Grid auto-fills at minmax(300px, 1fr) |
| 600–900px | 1–2 column grid, filters collapse |
| < 600px | Single column, stacked cards, hamburger nav |

- Banner shimmer animation runs on all sizes
- Glass blur may be reduced on mobile for performance
- Scanline overlay is hidden on screens < 600px

## 9. Agent Prompt Guide

When adding new features or components:

- **Dark theme cards**: `rgba(8,12,22,0.55)` bg, `backdrop-filter: blur(12px)`, `rgba(184,255,87,0.2)` border
- **Light theme cards**: `#ffffff` bg, subtle shadow, `rgba(22,163,74,0.2)` border
- **Primary accent (dark)**: `#b8ff57` — use for links, active states, neon glow
- **Primary accent (light)**: `#16a34a` — standard green, no glow
- **Secondary accent**: `#ff6b9d` (dark) / `#dc2626` (light) — alerts, featured items
- **Headings**: Always Orbitron in dark theme
- **Grid items**: Always use `minmax(300px, 1fr)` pattern
- **New badges**: Pill shape, white text on brand color background
- **Animations**: Keep shimmer at 6s cycle; avoid adding heavy animations that compound with existing effects
