var profile = {
    
    basePath: "..",
    
    releaseDir: "./prod",
    
    action: "release",
    
    cssOptimize: "comments",
    
    mini: true,
    
    optimize: "closure",
    
    layerOptimize: "closure",
    
    stripConsole: "all",
    
    /*
    layers: {
        // you should use well-crafted layers in your build!  
    },
    */
    
    packages: [
    
        {
            name: "scrollorama",
            location: "./scrollorama"
        },
        
        {
            name: "dojo",
            location: "./dojo/dojo"
        }
        
        // don't build these packages until we need them
        /*
        {
            name: "dijit",
            location: "./dojo/dijit"
        },
        {
            name: "dojox",
            location: "./dojo/dojox"
        }
        */
    ],
    
    resourceTags: {
        amd: function (filename, mid) {
            return /\.js$/.test(filename);
        }
    }
};

// turn off INFO and TRACE output for the Closure Compiler
Packages.com.google.javascript.jscomp.Compiler.setLoggingLevel(Packages.java.util.logging.Level.WARNING);
