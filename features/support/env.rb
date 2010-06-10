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
browser = Browser.new
fw_browser = {}
fw_port_count = 10000

Before do
  @fw_browser = {}
  @fw_port_count = fw_port_count
  @browser = browser
end

# "after all"
at_exit do
  browser.close
end
