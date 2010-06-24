# -*- coding: utf-8 -*-
begin
  namespace :naturaldocs do
    task :generate do
      sh %{mkdir -p docs/.nd && naturaldocs -i . -o html docs -p docs/.nd} do |ok, res|
        if ok
          puts "Documents generated successfully in docs."
        else
          puts "Couldn’t generate documentation, have you installed naturaldocs? (sudo apt-get install naturaldocs)."
        end
      end
    end
  end
end

begin 
  namespace :jslint do
    task :install do
      if not File.exists? "vendor/rhino.jar"
        sh %{wget -q -O vendor/rhino.zip ftp://ftp.mozilla.org/pub/mozilla.org/js/rhino1_7R2.zip}
        sh %{unzip vendor/rhino.zip rhino1_7R2/js.jar}
        sh %{mv rhino1_7R2/js.jar vendor/rhino.jar}
        sh %{rm -rf rhino1_7R2}
        sh %{rm -rf rhino.zip}
      end
      if not File.exists? "vendor/jslint.js"
        sh %{wget -q -O vendor/jslint.js http://www.jslint.com/rhino/jslint.js}
      end
    end
  
    desc "Check the JavaScript source with JSLint - exit with status 1 if any of the files fail."
    task :jslint => ["jslint:install"] do
      failed_files = []
      classpath = File.join("vendor", "rhino.jar")
      jslint_path = File.join("vendor", "jslint.js")
      Dir['src/**/*.js'].each do |fname|
        puts "Running JSLint on #{fname}"
        cmd = "java -cp #{classpath} org.mozilla.javascript.tools.shell.Main #{jslint_path} #{fname}"
        results = %x{#{cmd}}
        unless results =~ /^jslint: No problems found in/
          puts "#{fname}:"
          puts results
          failed_files << fname
        end
      end
      if failed_files.size > 0
        exit 1
      end
    end
  end
end

task :default => ["naturaldocs:generate", "jslint:jslint"]
