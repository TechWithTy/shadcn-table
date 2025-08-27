Feature: Reusable DataTable - Modal Nested List View
  As a user
  I want to open a modal to view nested list objects for a row
  So that I can inspect related data without leaving the table

  Background:
    Given the Reusable DataTable is rendered with rows that contain nested lists under the "Socials" and "Leads" fields

  @modal
  Scenario: Open modal from row action
    When I click the "View Details" action on the first row
    Then a modal should open
    And the modal should display a list of nested items

  @modal-virtualization
  Scenario: Virtualized long nested list
    Given the nested list contains 200+ items
    When I scroll the modal list
    Then items should render smoothly without performance issues

  @modal-actions
  Scenario: Per-item actions inside modal
    When I click "Open Link" for a nested item with a URL
    Then the link should open in a new tab
    When I click "Copy" for a value
    Then the value should be copied to the clipboard

  @modal-item-details
  Scenario: Open modal focused on the clicked item's details
    Given the first row has a "Leads" list with multiple entries
    When I click the "View Details" action for the second lead
    Then the modal should open to the Details view for that lead
    And default fields (e.g., Name, Status, Created At) should display populated values
    And the list sidebar should highlight the second lead as active

  @modal-item-nav
  Scenario: Navigate to next and previous items from details view
    Given the modal is open on the Details view for item 2 of 5
    When I click Next
    Then the Details view should show item 3 of 5
    And Previous should be enabled
    When I click Previous
    Then the Details view should show item 2 of 5

  @modal-item-nav-boundaries
  Scenario: Next/Previous disabled at list boundaries
    Given the modal is open on the Details view for the first item (1 of 5)
    Then Previous should be disabled
    And Next should be enabled
    When I click Next until the last item (5 of 5)
    Then Next should be disabled
    And Previous should be enabled

  @modal-close
  Scenario: Close modal
    When I click the modal close button
    Then the modal should close

  @modal-search
  Scenario: Search within modal nested items
    Given the modal is open and contains nested items with names and tags
    When I type "email" into the modal search input
    Then only nested items matching "email" should be visible

  @modal-pagination
  Scenario: Paginate nested items in modal (non-virtualized mode)
    Given the modal shows 25 items per page
    When I click Next Page
    Then the next 25 items should be shown

  @modal-voice-items
  Scenario: Voice/Audio preview inside modal items
    Given some nested items include an audio preview control
    When I click Play on an item's audio
    Then the audio should play and show progress within the modal
    When I adjust volume to 50%
    Then playback volume should update accordingly

  @modal-bulk-actions
  Scenario: Bulk actions for selected nested items
    Given I select multiple nested items in the modal
    When I click "Bulk Copy"
    Then a combined value should be copied to the clipboard
    When I click "Download JSON"
    Then a JSON file for selected items should download

  @modal-keyboard-a11y
  Scenario: Keyboard navigation and accessibility in modal list
    Given the modal has focus trap and labeled controls
    When I navigate items using ArrowDown and ArrowUp
    Then focus should move between items without leaving the modal
    When I press Escape
    Then the modal should close


  # Implementation Notes
  # - Where to place modal components:
  #   Place reusable dialogs under your table feature folder, e.g.,
  #   `components/tables/<table>/utils/YourDetailsDialog.tsx`.
  #   Example import style used already:
  #   - `components/tables/lead-list-tables/columns.tsx` imports `./utils/skipLeadsList`.
  #
  # - Triggering modal from a cell:
  #   In the column `cell`, render a button that sets local state to open the dialog
  #   and passes the row's nested data:
  #     cell: ({ row }) => (<YourDetailsDialogTrigger data={row.original.socials} />)
  #   Wrap trigger + dialog in a small component colocated with the table or under `utils/`.
  #
  # - Dialog/UI building blocks (shadcn/ui):
  #   Use your existing UI primitives under `external/shadcn-table/src/components/ui/*`
  #   (e.g., `dialog`, `button`, `input`, `scroll-area`, `separator`, `badge`).
  #
  # - Virtualization for long lists:
  #   For 200+ items, prefer `@tanstack/react-virtual` or `react-virtualized` inside the dialog
  #   list container. Keep the container height fixed and overflow auto for smooth scroll.
  #
  # - Per-item actions inside modal:
  #   Implement actions (Open Link, Copy, Download JSON) as buttons with handlers.
  #   Use utilities like `navigator.clipboard.writeText` and app download helpers.
  #   You can place shared helpers under `lib/_utils/` (e.g., `files/` for downloads).
  #
  # - Focus management and a11y:
  #   Ensure the dialog component traps focus, labels headings/controls, and binds Esc to close.
  #   Provide keyboard navigation on the list (ArrowUp/ArrowDown) via roving tabindex or listbox
  #   semantics (`role="listbox"`, `role="option"`).
  #
  # - Rendering pipeline reference:
  #   Headers/cells are rendered by `external/shadcn-table/src/components/data-table/data-table.tsx`
  #   using TanStack `flexRender`. Your modal trigger lives in a column's `cell` so it renders
  #   inline with the row.
