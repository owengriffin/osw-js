Feature: Rooster
  In order to have friends
  As a registered user
  I want to be able to add contacts to my rooster

  Scenario: Adding a friend
    Given there is a user called "Dave"
    Given there is a user called "Mary"
    When "Dave" enters "Mary"'s JID into "add_contact_jid"
    And "Dave" clicks "add_contact_button"
    Then "Mary" should see the text "You have received a presence subscription request from: "
    And "Mary" should see "Dave"'s JID
    When "Mary" clicks Accept
    Then "Dave" should see "Mary" in his contact list
    And "Mary" should see "Dave" in her contact list
