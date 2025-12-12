# Analytics Configuration Refactoring - Visual Diagram

## Current Architecture

```mermaid
graph TD
    A[PageClient.tsx] --> B[Card Component]
    B --> C[CardHeader: Analytics Configuration]
    B --> D[CardContent]
    D --> E[Accordion]
    E --> F1[Time Period Filter]
    E --> F2[Metrics Filter]
    E --> F3[Dimensions Filter]
    E --> F4[Context Filters]
    E --> F5[Drilldown Filters]
```

## Proposed Architecture

```mermaid
graph TD
    A[PageClient.tsx] --> B[AnalyticsFiltersSheet]
    B --> C[SheetTrigger Button]
    B --> D[SheetContent]
    D --> E[SheetHeader: Analytics Configuration]
    D --> F[Accordion]
    F --> G1[Time Period Filter]
    F --> G2[Metrics Filter]
    F --> G3[Dimensions Filter]
    F --> G4[Context Filters]
    F --> G5[Drilldown Filters]
```

## Data Flow Comparison

### Current Data Flow

```mermaid
graph LR
    State[State Management] -->|props| CardComponent
    CardComponent -->|user interaction| State
    CardComponent -->|filter changes| API
```

### New Data Flow

```mermaid
graph LR
    State[State Management] -->|props| AnalyticsFiltersSheet
    AnalyticsFiltersSheet -->|user interaction| State
    AnalyticsFiltersSheet -->|filter changes| API
```

## UI Layout Changes

### Before (Card-based)

```
┌─────────────────────────────────┐
│ Analytics Configuration          │
├─────────────────────────────────┤
│ ▼ Time Period                     │
│ ▼ Metrics                        │
│ ▼ Dimensions                     │
│ ▼ Context Filters                │
│ ▼ Drilldown Filters              │
└─────────────────────────────────┘
```

### After (Sheet-based)

```
[Analytics Filters Button]  ← Click to open sheet

┌─────────────────────────────────┐
│ Analytics Configuration          │
├─────────────────────────────────┤
│ ▼ Time Period                     │
│ ▼ Metrics                        │
│ ▼ Dimensions                     │
│ ▼ Context Filters                │
│ ▼ Drilldown Filters              │
└─────────────────────────────────┘
```

## Implementation Checklist

```mermaid
gantt
    title Refactoring Timeline
    dateFormat  YYYY-MM-DD
    section Analysis
    Analyze current structure       :done,    des1, 2025-12-04, 1d
    Review sheet component           :done,    des2, after des1, 1d
    section Planning
    Create refactoring plan         :active,  des3, after des2, 1d
    Identify state management        :active,  des4, after des3, 1d
    section Implementation
    Replace Card with Sheet          :         des5, after des4, 1d
    Test functionality              :         des6, after des5, 1d
    section Verification
    Verify all filters work         :         des7, after des6, 1d
    Confirm state preservation       :         des8, after des7, 1d
```

## Key Benefits

1. **Improved User Experience**: Sheet pattern is more intuitive for filter management
2. **Consistent UI Pattern**: Follows established sheet component design
3. **Preserved Functionality**: All existing logic remains unchanged
4. **Better Space Utilization**: Sheet can be closed when not needed
5. **Mobile-Friendly**: Sheet pattern works better on smaller screens

## Risk Mitigation

- **Low Risk**: Only UI layer changes, core logic remains
- **Backward Compatible**: All existing state management preserved
- **Testable**: Easy to verify all filters work as before
- **Reversible**: Can easily revert to Card-based approach if needed
