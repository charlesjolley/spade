# ==========================================================================
# Project:   Spade - CommonJS Runtime
# Copyright: ©2010 Strobe Inc. All rights reserved.
# License:   Licened under MIT license (see LICENSE)
# ==========================================================================

require 'optparse'
require 'ostruct'

module Spade
  module CLI
    def self.run(exename = 'spade', rootdir = nil, args = [])    
      rootdir = Spade.discover_root(rootdir) unless rootdir.nil?
        
      options = OpenStruct.new
      options.libs = []
      options.libdirs = []
      parser = OptionParser.new
      parser.banner = "Usage: #{exename} [options]"
      parser.on("-r", "--require FILE", "load and execute FILE as JavaScript source") {|r| options.libs << r}
      parser.on("-i", "--interactive", "interactive mode") {options.interactive = true}
      parser.on("-e", "--execute JAVASCRIPT", String, "evaluate JAVASCRIPT and exit") {|src| options.execute = src}
      parser.on("--selftest", "check that therubyracer is functioning properly") {options.selftest = true}
      parser.on_tail("-v", "--version", "Show version and exit") {options.version_info = true}
      parser.on_tail("-h", "--help", "Show this message") do
        puts parser
        exit
      end
      begin
        extra_files = parser.parse!(args.dup)
      rescue OptionParser::InvalidOption => e
        puts "#{exename}: #{e.message}"
        exit(1)
      end
      
      if options.version_info
        puts "The Ruby Racer #{V8::VERSION} w/ Spade"
        puts "V8 Version 2.3.3"
        exit
      elsif options.selftest
        self.test        
      end
      
      Context.new(:rootdir => rootdir, :with => Shell.new) do |cxt|
        for libfile in options.libs do
          load(cxt,libfile)
        end        

        if options.interactive
          repl(cxt, exename)
        elsif options.execute
          cxt.eval(options.execute, '<execute>')
        elsif extra_files.size>0
          extra_files.each { |path| load(cxt, path) }
        else
          begin
            first_line = $stdin.readline
            unless first_line =~ /^\#\!/ # allow for poundhash
              cxt.eval(first_line, '<stdin>')
            else
              cxt.eval($stdin, '<stdin>')
            end
            
          rescue Interrupt => e
            puts; exit
          end
        end
      end
    end

    def self.load(cxt, libfile)
      begin
        content = File.readlines(libfile)
        content.shift if (content.first||'' =~ /^\#\!/)
        cxt.eval(content*'')
        #cxt.load(libfile)
      rescue V8::JSError => e
        puts e.message
        puts e.backtrace(:javascript)
      rescue StandardError => e
        puts e
      end
    end
    
    def self.test
      begin
        require 'rubygems'
        require 'rspec'
        ARGV.clear
        ARGV << File.dirname(__FILE__) + '/../../spec/'
        ::RSpec::Core::Runner.autorun
        exit(0)
      rescue LoadError => e
        puts "selftest requires rspec to be installed (gem install rspec)"
        exit(1)
      end
      
    end

    def self.repl(cxt, exename)
      require 'readline'
      puts "help() for help. quit() to quit."
      puts "The Ruby Racer #{V8::VERSION} with Spade"
      puts "Vroom Vroom!"      
      trap("SIGINT") do
        puts "^C"
      end        
      loop do
        line = Readline.readline("#{exename}> ", true)
        begin
          result = cxt.eval(line, '<shell>')
          puts(result) unless result.nil?                
        rescue V8::JSError => e
          puts e.message
          puts e.backtrace(:javascript)
        rescue StandardError => e
          puts e
          puts e.backtrace.join("\n")
        end
      end          
    end            
    
    class Shell
      def to_s
        "[object Shell]"
      end

      def print(string)
        puts string
      end

      def exit(status = 0)
        Kernel.exit(status)
      end
          
      alias_method :quit, :exit
      
      def help(*args)
        <<-HELP
    print(msg)
      print msg to STDOUT    
        
    exit(status = 0)
      exit the shell
      also: quit()
          
    evalrb(source)
      evaluate some ruby source
    HELP
      end
    end
  end
end
