
def random_string
  (0...8).map{65.+(rand(25)).chr}.join
end

def get_browser(who)
  browser = @browser
  if who != "I"
    browser = @fw_browser[who]
  end
  return browser
end

Given /\"?(I|[^\"]*)\"? (?:am|is) on the index page/ do |who|
  puts who
  get_browser(who).goto 'http://localhost/osw-js/'
end

When /^\"?(I|[^\"]*)\"? enters? (?:a|the) (same|random|valid|text) (.*) into "([^\"]*)"$/ do |who, type, desc, name|
  puts "who = #{who}"
  puts "type = #{type}"
  puts "desc = #{desc}"
  puts "name = #{name}"
  value = ""
  if desc == "username"
    if type == "random"
      @username = random_string
    end
    value = @username
  elsif desc == "password"
    if type = "random"
      @password = random_string
    end
    value = @password
  elsif desc == "email address"
    if type == "same"
      value = @email_address
    elsif type = "value"
      value = random_string + '@' + random_string + '.' + random_string
    end
  end
  get_browser(who).text_field(:id, name).value = value
end

When /^\"?(I|[^\"]*)\"? clicks? "([^\"]*)"$/ do |who, what|
  get_browser(who).button(:id, what.downcase).click
  sleep 2
end

Then /^\"?(I|[^\"]*)\"? should see the text "([^\"]*)"$/ do |who, arg1|
  fail if not get_browser(who).text.include? arg1
end

When /^I enter a username containing "([^\"]*)" into "([^\"]*)"$/ do |arg1, arg2|
  username = random_string + arg1 + random_string
  puts "Entering #{username} into #{arg2}"
  @browser.text_field(:id, arg2).value = username
end

When /^I enter an invalid email address into "([^\"]*)"$/ do |arg1|
  @browser.text_field(:id, arg1).value = 'test@test@test.com'
end
