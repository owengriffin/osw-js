Given /^there is a user called "([^\"]*)"$/ do |arg1|
  if not @fw_browser.has_key? arg1
    @fw_port_count = @fw_port_count + 1
    @fw_browser[arg1] = FireWatir::Firefox.new(:port => @fw_port_count)
    @browser = @fw_browser[arg1] 
    steps %Q{
Given "#{arg1}" is on the index page
When "#{arg1}" enters a random username into "register_username"
And "#{arg1}" enters a random password into "register_password"
When "#{arg1}" clicks "Register"
Then "#{arg1}" should see the text "Registration successful"
}
  else
    @browser = @fw_browser[arg1]
  end
end
