# Common UI Components

This directory contains reusable UI components that are used throughout the ISEE AI Tutor application.

## Components

### Button
A versatile button component with multiple variants, sizes, and states.

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean - shows loading spinner and disables button
- `disabled`: boolean - disables the button

**Usage:**
```tsx
import { Button } from '@/components/common';

<Button variant="primary" size="md" loading={isSubmitting}>
  Submit
</Button>
```

### Input
A form input component with label, validation styling, and error messages.

**Props:**
- `label`: string - input label
- `error`: string - error message to display
- `helperText`: string - helper text below input
- `required`: boolean - shows required indicator

**Usage:**
```tsx
import { Input } from '@/components/common';

<Input 
  label="Email" 
  type="email" 
  required
  error={errors.email}
  helperText="Enter your email address"
/>
```

### Card
A flexible card component with sub-components for structured content.

**Sub-components:**
- `CardHeader` - Header section
- `CardTitle` - Title text
- `CardDescription` - Description text
- `CardContent` - Main content area
- `CardFooter` - Footer section

**Props:**
- `variant`: 'default' | 'outlined' | 'elevated'
- `padding`: 'none' | 'sm' | 'md' | 'lg'

**Usage:**
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common';

<Card variant="elevated">
  <CardHeader>
    <CardTitle>Practice Session</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Your content here</p>
  </CardContent>
</Card>
```

### LoadingSpinner
Loading indicators for async operations with multiple variants.

**Components:**
- `LoadingSpinner` - Basic spinner with optional text
- `LoadingOverlay` - Full-screen loading overlay
- `LoadingContent` - Inline loading state for content areas

**Props:**
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `variant`: 'primary' | 'secondary' | 'white'
- `text`: string - optional loading text
- `centered`: boolean - center the spinner

**Usage:**
```tsx
import { LoadingSpinner, LoadingOverlay, LoadingContent } from '@/components/common';

<LoadingSpinner size="md" text="Loading..." />
<LoadingOverlay text="Saving progress..." />
<LoadingContent text="Loading practice problems..." />
```

## Design System

All components follow the design system defined in `tailwind.config.js`:

- **Primary Colors**: Blue palette for main actions and branding
- **Secondary Colors**: Gray palette for secondary elements
- **Typography**: Inter font family for consistent text rendering
- **Spacing**: Consistent spacing scale using Tailwind utilities
- **Accessibility**: Focus states, proper contrast ratios, and semantic HTML

## Testing

Each component includes comprehensive tests covering:
- Default rendering
- All variants and props
- User interactions
- Accessibility requirements

Run tests with:
```bash
npm test
```

## Development

When adding new common components:

1. Create the component file in this directory
2. Export it from `index.ts`
3. Add comprehensive tests
4. Update this README
5. Consider accessibility and responsive design
6. Follow the existing naming conventions and patterns