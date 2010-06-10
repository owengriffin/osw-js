
def random_string
  (0...8).map{65.+(rand(25)).chr}.join
end

Given 'I am on the index page' do
  @browser.goto 'http://localhost/osw-js/'
end

When /^I enter a random username into "([^\"]*)"$/ do |arg1|
  @username = random_string
  @browser.text_field(:id, arg1).value = @username
end

When /^I enter the same username into "([^\"]*)"$/ do |arg1|
  @browser.text_field(:id, arg1).value = @username
end

When /^I enter a random password into "([^\"]*)"$/ do |arg1|
  @password = random_string
  @browser.text_field(:id, arg1).value = @password
end

When /^I enter a valid email address into "([^\"]*)"$/ do |arg1|
  @email_address = random_string + '@' + random_string + '.' + random_string
  @browser.text_field(:id, arg1).value = @email_address
end

When /^I click "([^\"]*)"$/ do |arg1|
  @browser.button(:id, arg1.downcase).click
end

Then /^I should see the text "([^\"]*)"$/ do |arg1|
  fail if not @browser.text.include? arg1
end

When /^I enter a username containing "([^\"]*)" into "([^\"]*)"$/ do |arg1, arg2|
  @browser.text_field(:id, arg2).value = random_string + arg1 + random_string
end

When /^I enter an invalid email address into "([^\"]*)"$/ do |arg1|
  @browser.text_field(:id, arg1).value = 'test@test@test.com'
end
