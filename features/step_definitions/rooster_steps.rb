

Given /^there is a user called \"(.*)\"$/ do |who|
  if not @browser_instance.has_key? who
    steps %Q{
Given "#{who}" is on the index page
When "#{who}" enters a random username into "register_username"
And "#{who}" enters a random password into "register_password"
When "#{who}" clicks "Register"
Then "#{who}" should see the text "Registration successful"
}
  end
end

When /^\"?(I|[^\"]*)\"? enters \"?(I|[^\"]*)\"?\'?s? JID into \"([^\"]*)\"$/ do |who0, who1, where|
  puts who1
  puts "Entering #{@jid[who1]}"
  get_browser(who0).text_field(:id, where).value = @jid[who1]
end
