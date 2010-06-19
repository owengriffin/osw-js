begin require 'rspec/expectations'; rescue LoadError; require 'spec/expectations'; end


require 'watir-webdriver'
Browser = Watir::Browser 

# "before all"
browser_instance = {}
browser_port_count = 6429
jid = {}

Before do
  @browser_instance = browser_instance
  @browser_port_count = browser_port_count
  @jid = {}
end

# "after all"
at_exit do
  browser_instance.keys.each do |key|
    browser_instance[key].close
  end
end
