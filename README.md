`===========================================================================
 Project:   Spade - CommonJS Microkernel
 Copyright: ©2010 Strobe Inc.
 ===========================================================================`

Spade makes it easy to share and run JavaScript in both the browser and on the
command line.

# Quick Start

## From the Command Line

Let's write a simple 'hello-world' script.  Create a new file called 'main.js'
and put in the following:

    require('console');
    console.log('Hello World');
  
Now run this from the command line:

    spade main.js
  
This will run the main.js file.  The package you loaded ('console') is a 
built-in package included with spade.

Now we want to run this in the browser.  To run in the browser, you need to 
make a JavaScript _package_.  A package is simply a folder containing your 
JavaScript structured in a way that the module system can understand.  All
shared libraries that you load (such as 'console') are also packages.

## From the Browser

To make the hello-world app package, create a folder called 'hello-world'.  
Inside of that, create a folder called 'lib' and put your main.js in there.
You should also create index.html and package.json files.  The folder 
structure should look like this:

    /hello-world
      index.html
      package.json
      /lib
        main.js <-- your previous main.js file

Your index.html should contain the following:

    <html>
      <head>
        <script src="spade-boot.js" spade-require="main"></script>
      </head>
      <body>
      </body>
    </html>
    
This index.html file will simply load a boot script that we are about to 
generate.

The package.json should list at minimum the app name and dependencies:

    {
      "name": "hello-world",
      "version": "0.0.1",
      "dependencies": {
        "console": "1.0.0"
      }
    }
    
Next, we need to setup this package so it includes any dependencies.  To do 
this, use the `spade update` command:

    spade update
    
This will create a new, hidden '.spade' directory with info along with a new
file called spade-boot.js.  This contains the bootstrap needed to get your 
modules loading in the browser.

Finally, to load in the browser, you will need to access your files through a server.  You could use Apache or Rails, but spade comes with a built-in preview as well (which currently is just a static file server).  Start the 
preview server with:

    spade preview
    
Then visit http://localhost:4020/index.html

If you open the JavaScript console you should see `Hello World` printed out.

Note that you can still run main.js from the command line:

    spade lib/main.js

## From the Console

Now that you have a package setup you can also easily use the interactive
console that comes with spade.  When you drop into the console you can load
modules from your project onto the command line.

    spade console
    
From within the console, load your main hello-world module to see it log:

    require('hello-world/main');
    
You should see it log 'Hello World'.

# Defining Packages

In addition to creating packages as apps, as we did above.  You can also 
define shared package libraries.  

TODO: Finish this...

## Ruby Modules

Drop a ruby file into a package and then you can require it.  The Ruby should
set the Spade.exports to a new instance of a class to make it into the exports
for the class.  

Note that Ruby modules only work when code is run from the command line.

