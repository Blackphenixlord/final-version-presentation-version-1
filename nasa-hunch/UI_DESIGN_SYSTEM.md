# Updated UI Color Scheme & Design System

All pages have been updated to match the new warehouse UI design language. Here's the complete reference guide.

## Color Palette

### Primary Colors

- **Primary Background**: `#0a0a0a` (Near black - main viewport)
- **Secondary Background**: `#1a1a1a` (Dark gray - panels, headers)
- **Tertiary Background**: `#2a2a2a` (Lighter gray - cards, inputs)

### Text Colors

- **Primary Text**: `#fff` (White - main content)
- **Secondary Text**: `#aaa` (Reduced opacity gray - labels, descriptions)
- **Tertiary Text**: `#999` (Further reduced - hints, metadata)

### Border & Divider Colors

- **Standard Border**: `#444` (Mid gray)
- **Subtle Border**: `rgba(255,255,255,0.1)` (Very light overlay)
- **Removed**: `rgba(255,255,255,0.12)` and darker variants

### Status & Semantic Colors

- **Success/Complete**: `#22c55e` (Green)
- **Active/In Progress**: `#3b82f6` (Blue)
- **Warning/Reserved**: `#f59e0b` (Amber)
- **Error/Discrepancy**: `#ef4444` (Red)
- **Special/Accent**: `#8b5cf6` (Purple) - Headers, labels

## Component Styling Standards

### Buttons

```tsx
// Primary (Blue - Default action)
style={{
  padding: "0.75rem 1.5rem",
  borderRadius: "8px",
  border: "none",
  background: "#3b82f6",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600,
}}

// Secondary (Gray - Neutral action)
style={{
  padding: "0.75rem 1.5rem",
  borderRadius: "8px",
  border: "1px solid #444",
  background: "transparent",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600,
}}

// Success (Green)
style={{
  padding: "0.75rem 1.5rem",
  borderRadius: "8px",
  border: "none",
  background: "#22c55e",
  color: "#000",  // Dark text on light background
  cursor: "pointer",
  fontWeight: 600,
}}

// Danger (Red)
style={{
  padding: "0.75rem 1.5rem",
  borderRadius: "8px",
  border: "none",
  background: "#ef4444",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600,
}}

// Small (0.5rem)
style={{
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  fontWeight: 600,
  fontSize: "0.8rem",
}}
```

### Input Fields

```tsx
style={{
  padding: "0.75rem",
  borderRadius: "8px",
  border: "1px solid #444",
  background: "#2a2a2a",
  color: "#fff",
  fontSize: "0.9rem",
}}

// With label
<label style={{ display: "grid", gap: "0.5rem" }}>
  <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#aaa" }}>
    Label
  </span>
  <input ... />
</label>
```

### Cards & Panels

```tsx
style={{
  background: "#2a2a2a",
  border: "1px solid #444",
  borderRadius: "8px",
  padding: "1rem",
  minHeight: "100px",
}}
```

### Headers

```tsx
style={{
  fontSize: "1.25rem",
  fontWeight: 600,
  color: "#8b5cf6",  // Purple accent
}}
```

### Labels

```tsx
style={{
  fontSize: "0.85rem",
  color: "#aaa",
  fontWeight: 600,
  textTransform: "uppercase",  // Optional
}}
```

### Borders & Dividers

```tsx
// Standard border
border: "1px solid #444";

// Top border divider
borderTop: "1px solid #333";

// Rounded border
borderRadius: "8px"; // Standard
borderRadius: "12px"; // Larger components
borderRadius: "6px"; // Smaller elements
```

## Layout Patterns

### Two-Column Layout

```tsx
style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}
```

### Sidebar Navigation

```tsx
style={{
  display: "grid",
  gridTemplateColumns: "160px 1fr",
  minHeight: "100vh",
}}
```

### Full-Screen Section

```tsx
style={{
  minHeight: "100vh",
  background: "#0a0a0a",
  padding: "1.5rem",
}}
```

## Typography

### Font Sizes

- **Title**: `1.25rem` - `1.8rem`
- **Heading**: `1.1rem` - `1.2rem`
- **Body**: `0.9rem` - `1rem`
- **Small**: `0.85rem`
- **Tiny**: `0.75rem`
- **Monospace (codes)**: `0.85rem` with `fontFamily: "monospace"`

### Font Weights

- **Bold/Headers**: `600`
- **Medium**: `500`
- **Normal**: Default
- **Input/Select**: Default (inherits body)

## Spacing

### Gaps Between Elements

- **Large**: `1.5rem` - Major sections
- **Medium**: `1rem` - Component groups
- **Small**: `0.75rem` - Related fields
- **Tiny**: `0.5rem` - Inline elements
- **Micro**: `0.25rem` - Typography

### Padding

- **Large**: `1.5rem` - Full panels
- **Medium**: `1rem` - Cards
- **Small**: `0.75rem` - Inputs/buttons
- **Tiny**: `0.5rem` - Compact elements

## Pages Updated

### 1. **CrewView.tsx**

- Background: `#0a0a0a` (full viewport)
- Header: `#1a1a1a` with `#8b5cf6` accent
- Accent color changed from `#8aff8a` to `#8b5cf6`
- Padding: `1.5rem`

### 2. **GroundView.tsx**

- Background: `#0a0a0a` with padding
- Header: `#1a1a1a` background
- Title color: `#8b5cf6`
- Border styling: `#333` instead of `rgba(255,255,255,0.1)`

### 3. **Login.tsx**

- Already had `#0a0a0a` background
- Updated card styling to match system

### 4. **Dashboard.tsx**

- KPI cards: `#2a2a2a` background
- Border: `#444`
- Labels: `#aaa` uppercase
- Height: `120px` (increased from `100px`)

### 5. **Inventory.tsx**

- Input styling: `#2a2a2a` background, `#444` border
- Table: `#2a2a2a` background with `#444` borders
- Header row: `#1a1a1a` background
- Modal: `#1a1a1a` background, `#444` border
- Buttons: Color-coded (OUT=red, IN=green, etc.)

### 6. **Warehouse Screens** (New)

- All screens follow the new design system
- Consistent spacing, colors, borders throughout
- Status indicators with semantic colors
- Modal dialogs with proper styling

## Migration Checklist

If creating new pages or components:

- [ ] Use `#0a0a0a` for main background
- [ ] Use `#1a1a1a` for panels/headers
- [ ] Use `#2a2a2a` for cards/inputs
- [ ] Use `#444` for borders
- [ ] Use `#aaa` for secondary text
- [ ] Use `#8b5cf6` for accent headings
- [ ] Use semantic colors (#22c55e, #3b82f6, #f59e0b, #ef4444)
- [ ] Padding: `0.75rem` standard
- [ ] Gap: `1rem` - `1.5rem`
- [ ] Border radius: `8px` standard, `12px` large
- [ ] Font weights: `600` for bold, `500` for medium

## Consistency Notes

- **No more**: `rgba(255,255,255,0.12)`, `rgba(255,255,255,0.18)`, `#000`, `#1f1f1f`, `#8aff8a`
- **Always use**: Explicit hex colors from the palette
- **Button sizing**: Consistent `0.75rem` padding with `1.5rem` horizontal
- **Input sizing**: Always match button height for alignment
- **Modal backgrounds**: `#1a1a1a` not `#111`
- **Opacity**: Use color variants, not rgba overlays where possible

## Testing

Navigate to each page to verify:

1. `/` or `/crew` - CrewView
2. `/ground` - GroundView
3. `/warehouse` - WarehouseView with 5 operation screens
4. Color consistency across all pages
5. Button and input alignment
6. Border styling uniformity
7. Typography hierarchy

All pages now follow a consistent, professional dark theme optimized for extended viewing and industrial/warehouse environments.
