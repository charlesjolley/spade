This is a simple demo web app the shows how to use spade in web pages and 
unit testing from CLI and web.

# Quick Start

_**Note:** these instructions assume you have not added any of the spade or 
core-test bins to your path.  If you have then you can just use the spade or 
cot commands directly._

To test the web app, first you need to run spade-update to do one-time setup.
This will link up all the necessary packages and create a spade-boot.js which
is needed by the app to load:

    ../../bin/spade update

Anytime you add a new package dependency to the web app, you will need to run
this command again for it to load in the browser.
    
To view the web app, you need to load your files through a server.
This will get around some security restrictions on the file:// protocol in
Chrome and Webkit.  You could technically use any web server you like.  
However, spade comes with a simple one built in for quick testing.  To start
the server:

    ../../bin/spade preview
    
Now you can view the web app by visiting [http://localhost:4020/index.html]
in your web browser.

# Running Unit Tests

You can run the unit tests from the command line using the core-test cot 
command:

    ../../packages/core-test/bin/cot
    
If you want to see detailed reports use the --verbose flag:

    ../../packages/core-test/bin/cot --verbose
    
You can also run specific unit tests:

    ../../packages/core-test/bin/cot ./tests/qunit-example-test.js
    
To run unit tests in the browser, you will need to first run a one-time setup 
with core-test:

    ../../packages/core-test/bin/cot update
    
This will create a file called tests/ct-runner.js that is used to bootstrap 
the tests in the browser.  Anytime you add a new unit test file you need to
run this command again.

To view in the browser, you will need a web server again.  spade preview is 
the easiest way to do this:

    ../../bin/spade preview
    
Now you can load the tests by visiting [http://localhost:4020/tests.html]

Note that the unit tests included in this demo use different personalities 
on CoreTest.  This shows how you can use CoreTest to mix and match your 
outputs.

# Additional Notes

In general, spade leaves it up to you to create your own HTML files for web-
based projects.  The only requirement is that you need to load the spade-boot
script at the top of the file.  You should also include a data-require 
attribute which names the initial module you want to load when the HTML page
is finished loading.

For regular web apps, this is usually the default index module for the app
itself.  For testing, you would instead load the ~tests/ct-runner module.  In
both cases your app itself loads which means all the assets you care about are
present.

For unit testing, note that normally only files ending in '-test' or '-spec'
or '\_test' or '\_spec' are automatically run.  To run all files in the tests
directory use the --all option on cot.

Finally, note that current core-test does not know how to load its own 
stylesheets.  This means the tests will load unstyled.
