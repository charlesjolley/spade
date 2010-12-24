# Ivory - A node/commonjs runtime

This package implements the node.js/commonjs APIs for performing local 
operations.  It currently runs only from the spade CLI but it can also be 
adapted to run in the node.js and browser environments as well.

## Usage

You can use the API just like the node.js format:

    var fs = require('ivory/fs');
    
You can also import the entire API into a global context.

    require('ivory/fs');
    $fs.open(..);
    
