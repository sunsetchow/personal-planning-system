# Orbit Design System

## Overview

This document defines the visual design standards for the Orbit Personal Planning System. All pages and components must adhere to these guidelines to ensure a consistent, professional user experience.

---

## Color Palette

### Primary Colors

| Color | Hex/Tailwind | Usage |
|-------|--------------|-------|
| **Indigo Primary** | `indigo-600` (#4F46E5) | Primary buttons, links, focus states, brand elements |
| **Indigo Hover** | `indigo-700` (#4338CA) | Primary button hover states |
| **Indigo Light** | `indigo-100` (#E0E7FF) | Icon backgrounds, subtle highlights |
| **Indigo Focus** | `indigo-500` (#6366F1) | Focus ring color |

### Neutral Colors

| Color | Hex/Tailwind | Usage |
|-------|--------------|-------|
| **Gray 900** | `gray-900` (#111827) | Primary text, headings |
| **Gray 700** | `gray-700` (#374151) | Secondary text, labels |
| **Gray 600** | `gray-600` (#4B5563) | Tertiary text, placeholders |
| **Gray 500** | `gray-500` (#6B7280) | Disabled text, subtle content |
| **Gray 100** | `gray-100` (#F3F4F6) | Card borders, dividers |
| **Gray 50** | `gray-50` (#F9FAFB) | Secondary backgrounds, hover states |
| **White** | `white` (#FFFFFF) | Card backgrounds, primary surfaces |

### Semantic Colors

| Color | Hex/Tailwind | Usage |
|-------|--------------|-------|
| **Green 600** | `green-600` (#16A34A) | Success states, positive indicators |
| **Green 100** | `green-100` (#DCFCE7) | Success backgrounds |
| **Red 600** | `red-600` (#DC2626) | Danger buttons, error states |
| **Red 700** | `red-700` (#B91C1C) | Danger button hover |
| **Red 500** | `red-500` (#EF4444) | Error focus ring |
| **Red 50** | `red-50` (#FEF2F2) | Error backgrounds |
| **Red 200** | `red-200` (#FECACA) | Error borders |
| **Blue 600** | `blue-600` (#2563EB) | Information, energy indicators |
| **Orange 500** | `orange-500` (#F97316) | Warnings, low mood indicators |
| **Yellow 600** | `yellow-600` (#CA8A04) | At-risk status |

---

## Typography

### Font Family
- **Primary**: System font stack (default Tailwind)
- **Fallback**: sans-serif

### Font Sizes

| Element | Tailwind Class | Size | Usage |
|---------|----------------|------|-------|
| **Page Title** | `text-2xl` | 24px | Main page headings (h1, h2) |
| **Section Heading** | `text-lg` | 18px | Section titles (h3) |
| **Card Heading** | `text-base` | 16px | Card titles, important labels |
| **Body Text** | `text-sm` | 14px | Primary body text, form inputs |
| **Small Text** | `text-xs` | 12px | Secondary info, badges, timestamps |

### Font Weights

| Element | Tailwind Class | Weight | Usage |
|---------|----------------|--------|-------|
| **Headings** | `font-bold` | 700 | Page titles, section headings |
| **Card Titles** | `font-semibold` | 600 | Card headers, emphasized text |
| **Medium** | `font-medium` | 500 | Button text, links, labels |
| **Regular** | (default) | 400 | Body text, descriptions |

### Text Colors

| Element | Tailwind Class | Usage |
|---------|----------------|-------|
| **Primary Text** | `text-gray-900` | Main headings, important content |
| **Secondary Text** | `text-gray-600` or `text-gray-700` | Body text, labels |
| **Tertiary Text** | `text-gray-500` | Descriptions, help text |
| **Link Text** | `text-indigo-600` | Interactive links |
| **Error Text** | `text-red-600` or `text-red-700` | Error messages |
| **Success Text** | `text-green-600` | Success messages |

---

## Spacing

### Standard Spacing Scale

| Size | Tailwind | Value | Usage |
|------|----------|-------|-------|
| **Extra Small** | `space-y-2` / `gap-2` | 8px | Tight groupings, form field groups |
| **Small** | `space-y-3` / `gap-3` | 12px | List items, related elements |
| **Medium** | `space-y-4` / `gap-4` | 16px | Form sections, card internal spacing |
| **Large** | `space-y-6` / `gap-6` | 24px | Main page sections, card spacing |

### Padding Standards

| Element | Tailwind Class | Value | Usage |
|---------|----------------|-------|-------|
| **Cards** | `p-6` | 24px | Standard card padding |
| **Large Cards** | `p-12` | 48px | Empty states, feature cards |
| **Small Cards** | `p-4` | 16px | Compact cards, list items |
| **Buttons** | `px-4 py-2` | 16px/8px | Default button padding (medium) |
| **Small Buttons** | `px-3 py-1.5` | 12px/6px | Small button size |

### Margin Standards

| Element | Tailwind Class | Value | Usage |
|---------|----------------|-------|-------|
| **Page Content** | `max-w-6xl mx-auto` or `max-w-4xl mx-auto` | - | Center main content |
| **Detail Pages** | `max-w-3xl mx-auto` | - | Detail/form pages |
| **Bottom Spacing** | `mb-6` | 24px | Section bottom margins |

---

## Buttons

### Button Variants

#### Primary Button
```tsx
<ButtonNew variant="primary">
  <Icon className="h-4 w-4 mr-2" /> Button Text
</ButtonNew>
```
- **Background**: `bg-indigo-600`
- **Text**: `text-white`
- **Hover**: `hover:bg-indigo-700`
- **Shadow**: `shadow-sm`
- **Focus Ring**: `focus:ring-indigo-500`
- **Usage**: Primary actions (Create, Save, Submit)

#### Secondary Button
```tsx
<ButtonNew variant="secondary">
  <Icon className="h-4 w-4 mr-2" /> Button Text
</ButtonNew>
```
- **Background**: `bg-white`
- **Text**: `text-gray-700`
- **Border**: `border border-gray-300`
- **Hover**: `hover:bg-gray-50`
- **Shadow**: `shadow-sm`
- **Usage**: Secondary actions (Cancel, Back)

#### Danger Button
```tsx
<ButtonNew variant="danger">
  <Icon className="h-4 w-4 mr-2" /> Delete
</ButtonNew>
```
- **Background**: `bg-red-600`
- **Text**: `text-white`
- **Hover**: `hover:bg-red-700`
- **Shadow**: `shadow-sm`
- **Usage**: Destructive actions (Delete, Remove)

#### Ghost Button
```tsx
<ButtonNew variant="ghost">
  <Icon className="h-4 w-4 mr-2" /> Button Text
</ButtonNew>
```
- **Background**: None
- **Text**: `text-gray-600`
- **Hover**: `hover:bg-gray-100`
- **Usage**: Subtle actions, toolbar buttons

### Button Sizes

| Size | Class | Padding | Font Size | Usage |
|------|-------|---------|-----------|-------|
| **Small** | `size="sm"` | `px-3 py-1.5` | `text-xs` | Compact spaces, inline actions |
| **Medium** | `size="md"` (default) | `px-4 py-2` | `text-sm` | Standard buttons |
| **Large** | `size="lg"` | `px-6 py-3` | `text-base` | Prominent CTAs |

### Button with Icons

- **Icon Size**: `h-4 w-4`
- **Icon Spacing**: `mr-2` (icon before text) or `ml-2` (icon after text)

```tsx
<ButtonNew>
  <Plus className="h-4 w-4 mr-2" /> Create New
</ButtonNew>
```

---

## Cards

### Standard Card
```tsx
<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
  {/* Card content */}
</div>
```

**Properties:**
- **Background**: `bg-white`
- **Padding**: `p-6` (24px)
- **Border Radius**: `rounded-xl` (12px)
- **Shadow**: `shadow-sm`
- **Border**: `border border-gray-100`

### Empty State Card
```tsx
<div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100">
  <div className="text-center max-w-md mx-auto">
    <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
      <Icon className="h-8 w-8 text-indigo-600" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Title</h3>
    <p className="text-gray-600 mb-6">Description</p>
    <ButtonNew>Call to Action</ButtonNew>
  </div>
</div>
```

**Properties:**
- **Padding**: `p-12` (48px)
- **Icon Container**: `bg-indigo-100 w-16 h-16 rounded-full`
- **Icon Size**: `h-8 w-8 text-indigo-600`

### List Item Card
```tsx
<div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
  {/* Item content */}
</div>
```

**Properties:**
- **Background**: `bg-gray-50`
- **Padding**: `p-4` (16px)
- **Border Radius**: `rounded-lg` (8px)
- **Border**: `border border-gray-200`

---

## Forms

### Input Fields

```tsx
<Input
  type="text"
  placeholder="Enter text"
  className="text-gray-700"
/>
```

**Standard Input Properties:**
- **Border**: `border border-gray-300`
- **Rounded**: `rounded-md`
- **Padding**: `px-3 py-2`
- **Font Size**: `text-sm`
- **Text Color**: `text-gray-700`
- **Focus**: `focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`

### Textarea

```tsx
<Textarea
  rows={4}
  placeholder="Enter description"
  className="text-gray-700"
/>
```

**Properties:** Same as Input, with configurable rows

### Labels

```tsx
<Label htmlFor="field-id" className="text-base font-semibold text-gray-900">
  Field Label
</Label>
```

**Properties:**
- **Font Size**: `text-sm` (forms) or `text-base` (emphasis)
- **Font Weight**: `font-semibold` or `font-medium`
- **Text Color**: `text-gray-900` or `text-gray-700`

### Error Messages

```tsx
<div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
  {error}
</div>
```

**Properties:**
- **Background**: `bg-red-50`
- **Text**: `text-red-700 text-sm`
- **Border**: `border border-red-200`
- **Padding**: `p-4` or `p-3`
- **Rounded**: `rounded-lg`

---

## Progress Indicators

### Progress Bar

```tsx
<Progress value={75} />
```

**Visual Properties:**
- **Background**: `bg-gray-100` (track)
- **Fill**: `bg-indigo-600` (incomplete) or `bg-green-500` (complete at 100%)
- **Height**: `h-2`
- **Rounded**: `rounded-full`
- **Transition**: `transition-all duration-500`

### Loading Spinner

```tsx
<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
<p className="mt-4 text-gray-600">Loading...</p>
```

**Properties:**
- **Size**: `h-8 w-8` (large) or `h-4 w-4` (small)
- **Border**: `border-4` (large) or `border-2` (small)
- **Color**: `border-indigo-600`
- **Animation**: `animate-spin`

---

## Icons

### Icon Library
- **Source**: Lucide React
- **Import**: `import { IconName } from 'lucide-react';`

### Icon Sizes

| Usage | Tailwind Class | Size |
|-------|----------------|------|
| **Large Icons** | `h-12 w-12` | 48px (empty states) |
| **Medium Icons** | `h-8 w-8` | 32px (icon containers) |
| **Default Icons** | `h-5 w-5` | 20px (inline, headers) |
| **Small Icons** | `h-4 w-4` | 16px (buttons, labels) |
| **Tiny Icons** | `h-3 w-3` | 12px (badges, inline text) |

### Icon Colors

- **Primary**: `text-indigo-600`
- **Success**: `text-green-600`
- **Danger**: `text-red-600`
- **Info**: `text-blue-600`
- **Warning**: `text-orange-500`
- **Neutral**: `text-gray-400` or `text-gray-600`

### Icon with Text

```tsx
<div className="flex items-center gap-2">
  <Icon className="h-4 w-4 text-indigo-600" />
  <span>Text content</span>
</div>
```

---

## Layout

### Page Layout

All dashboard pages must use `DashboardLayout`:

```tsx
import { DashboardLayout } from '@/components/DashboardLayout';

export default function Page() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Page content */}
      </div>
    </DashboardLayout>
  );
}
```

### Content Width

| Page Type | Max Width | Usage |
|-----------|-----------|-------|
| **Dashboard/List** | `max-w-6xl mx-auto` | Main dashboard, lists |
| **Detail Page** | `max-w-3xl mx-auto` | Single item details, forms |
| **Wide Page** | `max-w-4xl mx-auto` | OKR details with tables |

### Section Spacing

```tsx
<div className="space-y-6">
  {/* Sections with 24px spacing */}
</div>
```

---

## Interactive States

### Hover States

| Element | Hover Class | Effect |
|---------|-------------|--------|
| **Cards** | `hover:shadow-md` | Subtle shadow increase |
| **Links** | `hover:bg-gray-50` | Background highlight |
| **Primary Button** | `hover:bg-indigo-700` | Darker background |
| **Danger Button** | `hover:bg-red-700` | Darker background |

### Focus States

All interactive elements must have visible focus states:

```tsx
className="focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
```

**Properties:**
- **Ring Size**: `focus:ring-2`
- **Ring Color**: `focus:ring-indigo-500` (default) or semantic colors
- **Ring Offset**: `focus:ring-offset-2`
- **Outline**: `focus:outline-none` (remove default)

### Active/Selected States

```tsx
className="bg-indigo-50 border-indigo-200"
```

---

## Badges & Status Indicators

### Status Badge

```tsx
<span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-50 text-green-600">
  ON TRACK
</span>
```

### Status Colors

| Status | Background | Text | Usage |
|--------|------------|------|-------|
| **On Track** | `bg-green-50` | `text-green-600` | Positive status |
| **At Risk** | `bg-yellow-50` | `text-yellow-600` | Warning status |
| **Behind** | `bg-red-50` | `text-red-600` | Negative status |
| **Completed** | `bg-blue-50` | `text-blue-600` | Finished status |
| **Default** | `bg-gray-50` | `text-gray-600` | Neutral status |

---

## Shadows

### Shadow Scale

| Shadow | Tailwind Class | Usage |
|--------|----------------|-------|
| **Small** | `shadow-sm` | Cards, buttons |
| **Medium** | `shadow-md` | Elevated cards on hover |
| **None** | `shadow-none` | Flat elements |

---

## Border Radius

### Radius Scale

| Size | Tailwind Class | Value | Usage |
|------|----------------|-------|-------|
| **Extra Large** | `rounded-xl` | 12px | Main cards |
| **Large** | `rounded-lg` | 8px | Secondary cards, inputs |
| **Medium** | `rounded-md` | 6px | Small elements |
| **Full** | `rounded-full` | 9999px | Icons, badges, avatars |

---

## Animations & Transitions

### Standard Transitions

```tsx
className="transition-colors duration-200"
className="transition-all duration-200"
```

### Hover Transitions

```tsx
className="hover:bg-gray-50 transition-colors"
```

### Progress Animations

```tsx
className="transition-all duration-500" // For progress bars
```

### Fade In Animation

```tsx
className="animate-fade-in"
```

---

## Accessibility

### Requirements

1. **Color Contrast**: All text must meet WCAG AA standards (4.5:1 for normal text)
2. **Focus Indicators**: All interactive elements must have visible focus states
3. **Keyboard Navigation**: All interactive elements accessible via keyboard
4. **ARIA Labels**: Use appropriate ARIA attributes for screen readers
5. **Alt Text**: All images must have descriptive alt text

---

## Components Reference

### Standard Button

```tsx
import { ButtonNew } from '@/components/ui/button-new';

<ButtonNew variant="primary" size="md">
  <Icon className="h-4 w-4 mr-2" />
  Button Text
</ButtonNew>
```

### Card Pattern

```tsx
<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-gray-900">Card Title</h3>
    <Icon className="h-5 w-5 text-indigo-600" />
  </div>
  {/* Card content */}
</div>
```

### Empty State Pattern

```tsx
<div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100">
  <div className="text-center max-w-md mx-auto">
    <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
      <Icon className="h-8 w-8 text-indigo-600" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Empty State Title</h3>
    <p className="text-gray-600 mb-6">Description of empty state</p>
    <ButtonNew onClick={handleAction}>
      <Plus className="h-4 w-4 mr-2" /> Primary Action
    </ButtonNew>
  </div>
</div>
```

### Loading State Pattern

```tsx
<DashboardLayout>
  <div className="flex justify-center items-center py-12">
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
</DashboardLayout>
```

---

## Quick Reference Checklist

When creating a new page or component, ensure:

- [ ] Uses `DashboardLayout` wrapper
- [ ] Cards use `bg-white p-6 rounded-xl shadow-sm border border-gray-100`
- [ ] Spacing uses `space-y-6` for main sections
- [ ] Headings use `text-2xl font-bold text-gray-900`
- [ ] Descriptions use `text-gray-600` or `text-gray-500`
- [ ] Buttons use `ButtonNew` component with appropriate variant
- [ ] Icons are `h-4 w-4` in buttons, `h-5 w-5` in headers
- [ ] Loading states use indigo spinner: `border-indigo-600 border-r-transparent`
- [ ] Error messages use `bg-red-50 text-red-700 border-red-200`
- [ ] All interactive elements have focus states
- [ ] Content is properly centered with `max-w-*xl mx-auto`

---

## Version History

- **v1.0** - Initial design system documentation (November 2025)

---

For questions or suggestions about this design system, please contact the development team.
