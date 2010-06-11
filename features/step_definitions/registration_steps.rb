

When /^\"?(I|[^\"]*)\"? enters? (?:a|the) (same|random|valid|text) (.*) into "([^\"]*)"$/ do |who, type, desc, name|
  value = ""
  if desc == "username"
    if type == "random"
      @username = random_string
    end
    value = @username
    @jid[who] = value
  elsif desc == "password"
    if type == "random"
      @password = random_string
    end
    value = @password
  elsif desc == "email address"
    if type == "same"
      value = @email_address
    elsif type == "value"
      value = random_string + '@' + random_string + '.' + random_string
    end
  end
  puts "#{who} is entering '#{value}' into #{name}"
  get_browser(who).text_field(:id, name).value = value
end


When /^\"?(I|[^\"]*)\"? enter a username containing "([^\"]*)" into "([^\"]*)"$/ do |who, what, where|
  username = random_string + what + random_string
  get_browser(who).text_field(:id, where).value = username
end

When /^\"?(I|[^\"]*)\"? enter an invalid email address into "([^\"]*)"$/ do |who, where|
  get_browser(who).text_field(:id, where).value = 'test@test@test.com'
end
