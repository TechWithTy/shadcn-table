Feature: Reusable DataTable - Sorting and Filtering
  As a user
  I want to sort and filter data in the reusable table
  So that I can quickly find the rows I need

  Background:
    Given the Reusable DataTable is rendered with sample data
    And the table shows columns: "List", "Upload Date", "Records", "Phone", "Emails", "Socials"

  @sorting
  Scenario: Sort ascending by a numeric column
    When I click the column header "Records"
    Then the rows should be sorted ascending by "Records"
    When I click the column header "Records" again
    Then the rows should be sorted descending by "Records"

  @sorting
  Scenario: Sort by a text column
    When I click the column header "List"
    Then the rows should be sorted ascending by "List"

  @global-filter
  Scenario: Global text search filters visible rows
    Given I focus the search input
    When I type "Austin"
    Then only rows containing "Austin" in any searchable column are visible

  @column-filter
  Scenario Outline: Apply column filter for a select option
    Given I open the Filters panel
    When I set the "Upload Date" filter to <range>
    Then only rows within <range> are visible

    Examples:
      | range         |
      | Last 7 Days   |
      | Last 30 Days  |
      | Last 90 Days  |

  @number-range
  Scenario Outline: Filter by number range on Records
    Given I open the Filters panel
    When I set the Records range to <min> - <max>
    Then only rows with Records between <min> and <max> are visible

    Examples:
      | min | max  |
      | 0   | 500  |
      | 501 | 1000 |
      | 1001| 10000|

  @sorting-multi
  Scenario: Multi-column sorting with shift-click
    Given the column "Records" is sorted ascending
    When I hold Shift and click the column header "Upload Date"
    Then the rows should be sorted by "Records" ascending then by "Upload Date" ascending

  @column-visibility
  Scenario: Toggle column visibility from the Columns menu
    Given the Columns menu is open
    When I hide the column "Emails"
    Then the "Emails" column should not be visible
    When I show the column "Emails" again
    Then the "Emails" column should be visible

  @filters-clear
  Scenario: Clear all filters
    Given filters are applied on "Upload Date" and "Records"
    When I click "Clear Filters"
    Then no filters should be active
    And all rows should be visible according to the current search

  @filters-presets
  Scenario: Save and apply a filter preset
    Given I have set filters: Upload Date = "Last 30 Days" and Records = "500-1000"
    When I save this as a preset named "Recent Mid Records"
    And I clear all filters
    And I apply the preset "Recent Mid Records"
    Then the filters should match the saved values
    And the visible rows should be filtered accordingly


  # Implementation Notes
  # - Header dropdowns (Asc/Desc/Reset/Hide):
  #   Use `DataTableColumnHeader` as the column header renderer.
  #   File: `external/shadcn-table/src/components/data-table/data-table-column-header.tsx`
  #   Example usage in app columns:
  #   - `components/tables/lead-list-tables/columns.tsx`
  #     header: ({ column }) => (<DataTableColumnHeader column={column} title="List" />)
  #   Example usage in demo:
  #   - `app/test-external/dynamic-table-test/page.tsx`
  #
  # - Enable sorting and column visibility on the table instance:
  #   Add state and models in the table component:
  #   - import { getSortedRowModel, type SortingState, type VisibilityState } from "@tanstack/react-table"
  #   - state: { sorting, columnVisibility }
  #   - onSortingChange: setSorting
  #   - onColumnVisibilityChange: setColumnVisibility
  #   - getSortedRowModel: getSortedRowModel()
  #   Implemented here:
  #   - `components/tables/lead-list-tables/lead-list-data-table.tsx`
  #
  # - Filtering (global input shown in demo):
  #   Demo page performs client-side search over visible fields:
  #   - `app/test-external/dynamic-table-test/page.tsx`
  #     Maintains `query` state and filters rows via useMemo before passing to useReactTable.
  #
  # - DataTable wrapper and toolbar:
  #   - `external/shadcn-table/src/components/data-table/data-table.tsx`
  #     Renders headers via TanStack `flexRender` (dropdown trigger is provided by the header renderer above).
  #   - `external/shadcn-table/src/components/data-table/data-table-toolbar.tsx`
  #     Hosts search input and view controls used by the demo.
