Feature: Reusable DataTable - Default Cell Renderers
  As a user
  I want consistent default renderers for common value types
  So that data is readable and accessible by default

  Background:
    Given the Reusable DataTable is rendered with sample data and type metadata per column

  @renderer-date-number
  Scenario: Date and number formatting
    Then date values should show in locale date format
    And numbers should include thousands separators

  @renderer-currency-percent
  Scenario: Currency and percent formatting
    Then currency values should display with currency symbol and 2 decimals
    And percent values should display as 0-100% with 1-2 decimals

  @renderer-badge-status
  Scenario: Badge/status renderer
    Then status values should show as colored badges according to status mapping

  @renderer-link-avatar
  Scenario: Link and avatar+name renderers
    Then link values should render as anchor tags with target="_blank"
    And avatar+name values should render with an image or initials and the display name

  @renderer-nested-count
  Scenario: Nested counts renderer
    Then nested arrays should render as a count with an affordance to open the modal for details

  @renderer-voice-audio
  Scenario: Voice/Audio renderer basic controls
    Given the column "Call Preview" uses the audio renderer
    When I click Play on the first row
    Then the audio should start playing and the button should switch to Pause
    And the progress indicator should advance
    When I click Pause
    Then playback should pause and the button should switch to Play

  @renderer-voice-speed-mute
  Scenario: Voice/Audio speed and mute controls
    Given the audio renderer exposes Speed and Mute controls
    When I set speed to 1.5x
    Then playback speed should increase to 1.5x
    When I toggle Mute on
    Then audio output should be muted
    When I toggle Mute off
    Then audio output should resume

  @renderer-voice-waveform
  Scenario: Voice/Audio waveform visualization
    Given the audio renderer displays a waveform or level meter
    When audio is playing
    Then the waveform should animate to reflect audio levels

  @renderer-voice-a11y
  Scenario: Voice/Audio accessibility and keyboard controls
    Given I focus the audio renderer using keyboard
    When I press Space
    Then playback should toggle between play and pause
    And controls should have accessible names and ARIA attributes

  @renderer-voice-error
  Scenario: Voice/Audio error fallback when source fails
    Given the audio source fails to load
    Then an error state should be displayed with a retry action
    And the table cell should not crash and should remain navigable
