# ===========================================================================
# Project:   Tiki
# Copyright: ©2009 Apple Inc.
# ===========================================================================

#######################################################
## CORE TIKI FRAMEWORK
##

config :spade, 
  :required       => [],
  :debug_required => [],
  #:test_dynamic_required => ['core-test'],
  :use_modules    => true,
  :use_package_info => false,
  :factory_format => :function, # string is not needed here
  :module_lib     => ['lib'],
  :combine_javascript => true # always improve load times
