Feature: Registration
  In order to access the system
  As an anonymous yser
  I want to be able to register on the system

  Scenario: Basic registration
    Given I am on the index page
    When I enter a random username into "register_username"
    And I enter a random password into "register_password"
    And I enter a valid email address into "register_email"
    When I click "Register"
    Then I should see the text "Registration successful"

  Scenario: Invalid jid
    Given I am on the index page
    When I enter a username containing "@" into "register_username"
    And I enter a random password into "register_password"
    And I enter a valid email address into "register_email"
    When I click "Register"
    Then I should see the text "Registration failed: 400 - jid-malformed"

  Scenario: Invalid email address
    Given I am on the index page
    When I enter a random username into "register_username"
    And I enter a random password into "register_password"
    And I enter an invalid email address into "register_email"
    When I click "Register"
    Then I should see the text "Please enter a valid email address"
    
  
