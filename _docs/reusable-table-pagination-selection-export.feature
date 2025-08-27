Feature: Reusable DataTable - Pagination, Selection, and Export
  As a user
  I want to paginate and select rows and export them
  So that I can manage large datasets efficiently

  Background:
    Given the Reusable DataTable is rendered with 100+ rows

  @pagination
  Scenario: Navigate pages
    Given I am on page 1
    When I click Next Page
    Then I should see page 2 is active
    When I click Previous Page
    Then I should see page 1 is active again

  @page-size
  Scenario: Change page size
    When I change the page size to 50
    Then 50 rows should be visible on the page

  @row-selection
  Scenario: Select all on current page
    When I click the header checkbox
    Then all rows on the current page should be selected

  @row-selection
  Scenario: Select individual rows
    When I click the row checkbox for row 2
    Then only row 2 should be selected

  @export
  Scenario: Export selected rows to CSV/Excel
    Given at least one row is selected
    When I click Export
    Then a file should download containing only the selected rows

  @pagination-jump
  Scenario: Jump to specific page
    Given I am on page 1
    When I enter "5" in the Jump to Page input and confirm
    Then I should see page 5 is active

  @pagination-server
  Scenario: Server-side pagination with preserved filters and sort
    Given server-side pagination is enabled
    And filters and sort are applied
    When I navigate to page 3
    Then the table should request page 3 with the same filters and sort parameters
    And the resulting rows should reflect those parameters

  @selection-across-pages
  Scenario: Select rows across pages
    Given I select 2 rows on page 1
    And I navigate to page 2
    And I select 3 rows on page 2
    Then the selection count should be 5
    When I click "Clear Selection"
    Then no rows should be selected across all pages

  @export-modes
  Scenario Outline: Export current page, selected rows, or all rows
    Given the Export menu is open
    When I choose <mode>
    Then the downloaded file should contain <rows>

    Examples:
      | mode           | rows                     |
      | Current Page   | only rows on active page |
      | Selected Rows  | only selected rows       |
      | All Rows       | all rows in dataset      |

  @export-columns
  Scenario: Export respects column visibility and order
    Given I hide the column "Emails" and reorder columns
    When I export Current Page
    Then the downloaded file should exclude "Emails" and match the visible column order
