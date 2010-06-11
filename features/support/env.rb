begin require 'rspec/expectations'; rescue LoadError; require 'spec/expectations'; end

if ENV['FIREWATIR']

  
else
  case RUBY_PLATFORM
  when /darwin/
    require 'safariwatir'
    Browser = Watir::Safari
  when /win32|mingw/
    require 'watir'
    Browser = Watir::IE
  when /java/
    puts "Using Celerity"
    require 'celerity'
    Browser = Celerity::Browser
  else
     begin
       puts "Using firewatir"
       require 'firewatir'
       Browser = FireWatir::Firefox
     rescue LoadError => ex
       puts ex
       raise "Unable to load Firewaitr"
    end
    #require 'watir-webdriver'
    #Browser = Watir::Browser.new(:firefox)
  end
end

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
