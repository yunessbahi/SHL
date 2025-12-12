# Analytics Configuration Refactoring Plan

## Current State Analysis

### Current Implementation in PageClient.tsx

- **Location**: Lines 1195-1955
- **Structure**: Card component containing Accordion with 5 filter sections
- **Filter Sections**:
  1. Time Period (lines 1209-1247)
  2. Metrics (lines 1251-1276)
  3. Dimensions (lines 1278-1304)
  4. Context Filters (lines 1307-1600)
  5. Drilldown Filters (lines 1603-1930)

### State Management in PageClient.tsx

- `selectedPeriod` (line 233): State for time period selection
- `selectedMetrics` (line 224): State for selected metrics
- `selectedDimensions` (line 228): State for selected dimensions
- `filters` (line 234): State for all filter values
- `availableDimensions` (line 235): State for available dimension options
- `filterOptions` (line 246): Memoized computed filter options

### Required Props for AnalyticsFiltersSheet

Based on the existing AnalyticsFiltersSheet component, the following props are needed:

- `filters`: Current filter state
- `setFilters`: Function to update filters
- `selectedPeriod`: Current selected time period
- `setSelectedPeriod`: Function to update time period
- `selectedMetrics`: Array of selected metrics
- `setSelectedMetrics`: Function to update metrics
- `selectedDimensions`: Array of selected dimensions
- `setSelectedDimensions`: Function to update dimensions
- `availableDimensions`: Array of available dimension options
- `filterOptions`: Record of filter options for each dimension
- `TIME_PERIODS`: Array of time period options
- `METRICS`: Array of metric options
- `DIMENSIONS`: Array of dimension options

## Refactoring Plan

### Step 1: Update PageClient.tsx

**Remove**: Lines 1195-1955 (entire Card-based Analytics Configuration section)
**Add**: AnalyticsFiltersSheet component with proper props

### Step 2: Replace Card with SheetTrigger

**Current**: Card component with CardHeader and CardContent
**New**: AnalyticsFiltersSheet component that includes its own SheetTrigger button

### Step 3: Preserve All Functionality

- All filter state management remains unchanged
- All filter logic and computations remain in PageClient.tsx
- Only the UI presentation layer moves to the sheet component

### Step 4: UI Changes

**Before**:

```jsx
<Card className="col-span-2">
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-popover-foreground">
      <Filter className="w-5 h-5" />
      Analytics Configuration
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-6">{/* All accordion filters */}</CardContent>
</Card>
```

**After**:

```jsx
<AnalyticsFiltersSheet
  filters={filters}
  setFilters={setFilters}
  selectedPeriod={selectedPeriod}
  setSelectedPeriod={setSelectedPeriod}
  selectedMetrics={selectedMetrics}
  setSelectedMetrics={setSelectedMetrics}
  selectedDimensions={selectedDimensions}
  setSelectedDimensions={setSelectedDimensions}
  availableDimensions={availableDimensions}
  filterOptions={filterOptions}
  TIME_PERIODS={TIME_PERIODS}
  METRICS={METRICS}
  DIMENSIONS={DIMENSIONS}
/>
```

## Implementation Steps

### Phase 1: Preparation

1. Verify AnalyticsFiltersSheet component is properly imported (line 88)
2. Ensure all required state variables are available in PageClient.tsx
3. Confirm all required constants (TIME_PERIODS, METRICS, DIMENSIONS) are defined

### Phase 2: Replacement

1. Locate the Card component at lines 1195-1955
2. Replace it with AnalyticsFiltersSheet component
3. Pass all required props to maintain functionality

### Phase 3: Testing

1. Verify sheet opens/closes properly
2. Confirm all filters work as expected
3. Ensure filter state is preserved when sheet is closed
4. Test that all existing functionality remains intact

## Benefits of This Approach

1. **Cleaner UI**: Sheet pattern provides better user experience
2. **Consistent Design**: Follows the sheet component pattern from the example
3. **Preserved Functionality**: All existing filter logic remains unchanged
4. **Maintainable Code**: Separation of concerns between UI and logic
5. **Better UX**: Sheet can be opened/closed without losing filter state

## Risk Assessment

**Low Risk**: This refactoring is primarily a UI change. The core filter logic and state management remain in PageClient.tsx, ensuring no functional changes to the analytics system.

## Verification Checklist

- [ ] All filter sections are present in the sheet
- [ ] All state management is preserved
- [ ] Filter logic remains unchanged
- [ ] UI styling matches the sheet pattern
- [ ] Sheet can be opened/closed properly
- [ ] Filter state persists when sheet is closed
- [ ] All existing functionality works as before
