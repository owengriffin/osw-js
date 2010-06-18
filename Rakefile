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

task :default => ["naturaldocs:generate"]
