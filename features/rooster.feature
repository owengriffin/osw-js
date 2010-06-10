Feature: Rooster
  In order to have friends
  As a registered user
  I want to be able to add contacts to my rooster

  Scenario: Adding a friend
    Given there is a user called "dave"
    Given there is a user called "mary"
    When "dave" enters "mary" into "add_friend"
    Then "mary" should see the text "dave wants to add you as a friend"
