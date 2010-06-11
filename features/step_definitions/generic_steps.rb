

def random_string
  (0...8).map{65.+(rand(25)).chr}.join
end

def get_browser(who)
  if not @browser_instance.has_key? who
    @browser_instance[who] = Browser.new({:log_level => :all, :javascript_exceptions => true, :resynchronize => true, :viewer => "127.0.0.1:#{@browser_port_count}"})
    @browser_port_count = @browser_port_count + 1
  end
  return @browser_instance[who]
end

Given /\"?(I|[^\"]*)\"? (?:am|is) on the index page/ do |who|
  get_browser(who).goto 'http://localhost/osw-js/'
end

When /^\"?(I|[^\"]*)\"? clicks? "([^\"]*)"$/ do |who, what|
  get_browser(who).button(:id, what.downcase).click
  get_browser(who).wait
end

Then /^\"?(I|[^\"]*)\"? should see the text "([^\"]*)"$/ do |who, what|
  if not get_browser(who).text.include? what
    fail get_browser(who).text
  end
end
