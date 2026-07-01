# UI Components Specification

## Purpose

Reusable, stateless Tailwind CSS 4 component primitives shared across all pages.

## Requirements

| ID | Requirement | Strength |
|----|------------|----------|
| UC-1 | **Button**: MUST support `variant` (primary, secondary, danger, ghost), `size` (sm, md, lg), `loading` (shows spinner, disables), `disabled` | MUST |
| UC-2 | **Input**: MUST support `label`, `error` (message below), `iconLeft` (optional), `type` (text, email, password) | MUST |
| UC-3 | **Modal**: MUST render overlay backdrop, close button, title, `children`; MUST close on ESC and click-outside | MUST |
| UC-4 | **Table**: MUST accept generic columns config (key, header, render), optional sortable headers, loading skeleton, empty state message | MUST |
| UC-5 | **Pagination**: MUST show page numbers, prev/next buttons, "Page X of Y" text; buttons MUST disable at boundaries | MUST |
| UC-6 | **SearchBar**: MUST show text input with search icon, debounce `onChange` by 300ms, display clear button when value is set | MUST |

### Scenario 1: Button renders variant and size

- GIVEN a Button with `variant="primary"` and `size="lg"`
- WHEN rendered
- THEN the element has the correct Tailwind classes for primary variant and large size

### Scenario 2: Modal closes on ESC

- GIVEN an open Modal
- WHEN the user presses the Escape key
- THEN the modal's `onClose` callback is invoked

### Scenario 3: Modal closes on backdrop click

- GIVEN an open Modal
- WHEN the user clicks the overlay backdrop (not the modal content)
- THEN the modal's `onClose` callback is invoked

### Scenario 4: Table shows empty state

- GIVEN a Table with an empty `data` array
- WHEN rendered
- THEN the empty state message is displayed

### Scenario 5: Table loading skeleton

- GIVEN a Table with `loading={true}`
- WHEN rendered
- THEN skeleton placeholder rows are displayed instead of data

### Scenario 6: SearchBar debounces input

- GIVEN a SearchBar
- WHEN the user types "jo" then pauses 200ms then types "hn"
- THEN `onChange` is called once with "john" after the 300ms debounce

### Scenario 7: Pagination disables prev on page 1

- GIVEN Pagination with `currentPage={1}` and `totalPages={5}`
- WHEN rendered
- THEN the "Previous" button is disabled
