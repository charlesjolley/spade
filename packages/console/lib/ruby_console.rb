module Tiki
  
  class Console
    
    def log(*str)
      puts str*','
    end

    def error(*str)
      puts 'ERROR: '+str*','
    end

    def warn(*str)
      puts 'WARN: '+str*','
    end
    
  end

end

Tiki.current_context['$rubyConsole'] = Tiki::Console.new
  