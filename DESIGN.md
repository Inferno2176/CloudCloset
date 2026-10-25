# CloudCloset — Design System Specification

> **Source of Truth:** Directly derived and verified from Google Stitch Projects:
> - **Desktop Editorial Project:** `projects/13853298386129573106` (*Remix of CloudCloset Fashion E-Commerce*)
> - **Product Detail and Shopping Bag Project:** `projects/13060954031119756744` (*CloudCloset Fashion E-Commerce Platform*)

---

## 1. Brand & Aesthetic Vision

CloudCloset embodies **Warm Architectural Editorial Minimalism** for a luxury contemporary apparel atelier. The digital flagship acts as an unadorned gallery vitrine.

### Core Visual Principles
- **Museum-Grade Restraint:** Matte ivory and warm off-white canvas surfaces mimic heavy untreated archival paper (`#FAF9F6`), punctuated by deep mineral ink (`#111111`) and earthy dried olive (`#5B614E`) accents.
- **Architectonic Framing:** Structural hairline borders (`1px solid #E8E6E1`) and generous editorial white space replace noisy heavy drop shadows.
- **Sharp Right Angles:** Border radius is strictly `0px` for buttons, cards, image containers, input fields, and panels, evoking tailored fabric pattern cuts and print lookbooks.
- **Typographic Cadence:** Pair romantic display serifs (*Playfair Display*) with neutral, utilitarian sans-serifs (*Inter*).
- **Tactile E-Commerce Luxury:** High-resolution 3:4 portrait product photography, uppercase tracked micro-labels, Indian Rupee (`₹ INR`) currency formatting, and express delivery pincode validation.

---

## 2. Color Palette & Design Tokens

### Core Design Tokens & CSS Variables
```css
:root {
  --color-canvas: #FAF9F6;
  --color-ink: #111111;
  --color-accent: #5B614E;
  --color-terracotta: #8C6239;
  --color-border: #E8E6E1;
  --font-serif: 'Playfair Display', Georgia, serif;
  --font-sans: 'Inter', system-ui, sans-serif;
}
```

### Complete Color Palette
| Token | Hex Value | Semantic Role |
| :--- | :--- | :--- |
| `canvas` / `surface` | `#FAF9F6` | Primary background canvas (warm off-white/ivory) |
| `surface-container-lowest` | `#FFFFFF` | Input fields, active cards, dropdown containers |
| `surface-container-low` | `#F4F3F1` | Secondary backgrounds, subtle badges |
| `surface-container` | `#EFEEEB` | Image placeholder backplates, filter groups |
| `surface-container-high` | `#E9E8E5` | Active pills, ticker bands, table headers |
| `surface-variant` / `hairline` | `#E8E6E1` | Primary structural borders and hairline dividers |
| `ink` / `primary` | `#111111` | Primary ink for headlines, titles, active CTAs |
| `on-primary` | `#FFFFFF` | Text on dark buttons and banners |
| `on-surface` | `#1A1C1A` | Core body text |
| `on-surface-variant` | `#444748` | Secondary copy, descriptions, breadcrumbs |
| `accent` / `secondary` | `#5B614E` | Dried Olive — verified badges, curated drops |
| `secondary-container` | `#DCE2CA` | Soft sage highlight container |
| `on-secondary-container` | `#5F6552` | Sage text and icon tone |
| `terracotta` / `tertiary` | `#8C6239` | Terracotta Earth — archive exclusivity tags |
| `outline` | `#747878` | Placeholder text, secondary icons |
| `error` | `#BA1A1A` | Form errors, low stock warnings |

---

## 3. Typography Hierarchy

### Font Families
- **Editorial Headings & Wordmark:** `Playfair Display` (serif, weights: 400, 500, 600)
- **Body, UI Controls, Forms, Micro-labels:** `Inter` (sans-serif, weights: 400, 500, 600, 700)
- **Iconography:** `Material Symbols Outlined`

### Typographic Scales
| Style Name | Font Family | Size | Tracking | Weight | Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-lg` | Playfair Display | `4.5rem` (72px) | `-0.02em` | 400 | Sentence |
| `display-md` | Playfair Display | `3.25rem` (52px) | `-0.015em`| 400 | Sentence |
| `headline-lg` | Playfair Display | `2.25rem` (36px) | `-0.01em` | 500 | Title |
| `headline-sm` | Playfair Display | `1.5rem` (24px) | `0em` | 500 | Title |
| `body-lg` | Inter | `1.0625rem` (17px) | `0em` | 400 | Regular |
| `body-md` | Inter | `0.9375rem` (15px) | `0.01em` | 400 | Regular |
| `body-sm` | Inter | `0.8125rem` (13px) | `0.015em`| 400 | Regular |
| `label-caps` | Inter | `0.6875rem` (11px) | `0.12em` | 600 | Uppercase |
| `label-md` | Inter | `0.8125rem` (13px) | `0.02em` | 500 | Sentence/Upper |

---

## 4. Reusable Component Conventions

### 1. Buttons
- **Primary CTA (`btn-primary`):** Solid `#111111` fill, `#FAF9F6` text, sharp 0px border radius, uppercase tracked font (`label-caps`). Shifts to `#5B614E` on hover.
- **Secondary Ghost (`btn-ghost`):** Transparent fill, 1px solid `#111111`, inverts to `#111111` on hover.
- **Tertiary Accent:** Transparent with bottom 1px solid border.

### 2. Product Cards
- **Aspect Ratio:** Fixed `3:4` portrait ratio with smooth `105%` scale-up on hover.
- **Badges:** Framed in `#FAF9F6` with 0px radius at top-left.
- **Wishlist Toggle:** Discreet top-right circular button with `Material Symbols Outlined` favorite icon.

### 3. Inputs & Forms
- **Text Inputs:** Transparent or `#F4F3F1` background, 1px solid `#E8E6E1` hairline border, sharp 0px corners, active focus darkens to 1px `#111111`.

### 4. Interactive Modules
- **Pincode Delivery Estimator:** Validates Indian PIN codes (e.g. 400001, 110001) and calculates estimated express arrival.
- **Voucher Engine:** Applies promotional vouchers (`STYLE10`, `CLOUD10`) with live savings calculation.
- **Tax Engine:** Automatically computes 12% GST on apparel and unlocks free express shipping for totals >= ₹1,999.
