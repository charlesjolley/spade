# ==========================================================================
# Project:   Spade - CommonJS Runtime
# Copyright: ©2010 Strobe Inc. All rights reserved.
# License:   Licened under MIT license (see LICENSE)
# ==========================================================================


module Spade
  
  class Console
    
    def debug(*args)
      puts "\033[35mDEBUG: #{args * ','}\033[m"
      nil
    end
    
    def info(*args)
      puts args * ','
      nil
    end

    def error(*args)
      puts "\033[31mERROR: #{args * ','}\033[m"
      nil
    end
    
    def warn(*args)
      puts "\033[33mWARN: #{args * ','}\033[m"
      nil
    end
    
    def log(*args)
      puts args * ','
      nil
    end
    
  end
  
end
