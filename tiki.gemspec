# -*- encoding: utf-8 -*-
lib = File.expand_path('../lib/', __FILE__)
$:.unshift lib unless $:.include?(lib)
 
Gem::Specification.new do |s|
  s.name        = "tiki"
  s.version     = "0.8.0"
  s.platform    = Gem::Platform::RUBY
  s.authors     = ["Charles Jolley"]
  s.email       = ["charles@sproutcore.com"]
  s.homepage    = "http://github.com/sproutcore/tiki"
  s.summary     = "Unified JavaScript runner for browser and command line"
  s.description = "..."
 
  s.required_rubygems_version = ">= 1.3.6"
  #s.rubyforge_project         = "tiki"
 
  #s.add_development_dependency "rspec"
 
  s.files        = Dir.glob("{bin,lib,packages}/**/*") + %w(README.md)
  s.executables  = ['tiki']
  s.require_path = 'lib'
end
