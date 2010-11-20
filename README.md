`===========================================================================
 Project:   Tiki - CommonJS Microkernel
 Copyright: ©2010 Strobe Inc.
 ===========================================================================`

Tiki is a package-aware module microkernel for both the browser and the 
command line.  It is a very simple loader that is < 4K when built (around 1K 
gzipped).  

# CommonJS Support

Tiki implements support for the CommonJS Modules 1.1 specification with a few
optional modifications:

    *   Globals.  Tiki permits modules to add objects to the global namespace.
        Depending on the Sandbox you use the globals can be isolated within
        a single set of module instances.
        
    *   Packages.  Tiki allows you to break modules into separate bundles of 
        modules called 'packages'.  Packages are namespaced so you can work
        with a set of modules within a single package as well as importing 
        modules across packages.
        
    *   String Modules.  You can register module body as a string that will
        be eval'd on demand the first time the module is requested.  This is 
        an important performance enhancement for mobile devices.
        
# Using Tiki

The easiest way to use Tiki is as part of the abbot build tools.  You can also
simply load the tiki.js file in the lib directory in your HTML file.  Once 
loaded, additional files you load should register modules and packages for 
your code to use.

To register a module you should use the registration API:

    tiki.register('module/name', function() { ... });
    
You can now require a module using:

    exports = tiki.require('module/name');
    
Within modules, you will be passed a private require function to use instead.

In addition to modules, you can register packages with the same methods:

    tiki.register('package', { ... });
    
The second param should be a JSON hash that contains any relevant keys about
the package.  Tiki knows how to look at the mappings hash to map symbolic 
package names to actual packages.

You can also lazy load packages but registering externs:

    tiki.extern({ 'package-name': 'URL' });
    
You can now async load packages and Tiki will automatically load the package
from the URL.

