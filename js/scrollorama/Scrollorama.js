define(
    [
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/NodeList",
        "dojo/_base/window",
        "dojo/dom-geometry",
        "dojo/dom-style",
        "dojo/has",
        "dojo/on",
        "dojo/query",
        "dojo/window",
        "./_base",
        // package modifiers (no passed values required)
        "dojo/_base/sniff"
    ],
    function(array, declare, lang, NodeList, baseWindow, domGeom, domStyle, has, on, query, scrollWindow, scrollorama) {
        
        var Scrollorama = declare(null, {
            
            
            ///////////////////////////////////////////////////////////////////
            // options
            ///////////////////////////////////////////////////////////////////
            
            // global offset for starting animations
            offset: 0,
            
            // whether to allow pinning
            enablePin: true,
            
            // the blocks that contain scrolling animations
            // (either a a NodeList from a query() or a CSS selector string)
            blocks: null,
            
            
            ///////////////////////////////////////////////////////////////////
            // internal state
            ///////////////////////////////////////////////////////////////////
            
            // the blocks' DOM nodes
            _blocks: null,
            
            // the browser prefix for "experimental" CSS properties
            _prefix:
                ((has("ff") || has("mozilla")) && "-moz-") ||
                ((has("webkit") || has("chrome") || has("safari")) && "-webkit-") ||
                (has("opera") && "-o-") ||
                (has("ie") && "-ms-"),
            
            // TODO: handle firing block change events with proper Dojo events
            // _onBlockChange: null, // ???
            // _blockIndex: 0, // ???
            
            // browser-specific method for performing atomic animations
            _animateAtomic:
                window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function(callback) {
                    // run the callback immediately (not necessarily atomic)
    				callback();
    			},
            
            
            ///////////////////////////////////////////////////////////////////
            // constructor
            ///////////////////////////////////////////////////////////////////
            
            constructor: function(options) {
                
                declare.safeMixin(this, options);
                
                // sanity check
                if (this.blocks === null || 
                    this.blocks === undefined ||
                    !(this.blocks instanceof NodeList) ||
                    !(lang.isString(this.blocks))
                ) {
                    
                    throw new Error(
                        "You must pass a blocks NodeList or CSS selector to the Scrollorama constructor."
                    );
                }
                
                // initialize
                this._initialize();
            },
            
            
            ///////////////////////////////////////////////////////////////////
            // public api
            ///////////////////////////////////////////////////////////////////
            
            animate: function(target) {
                
                // TODO!
            },
            
            
            ///////////////////////////////////////////////////////////////////
            // internal methods
            ///////////////////////////////////////////////////////////////////
            
            _initialize: function() {
                
                var blocks;
                
                // make sure the body has the "position: relative" style
                domStyle.set(baseWindow.body(), "position", "relative");
                
                // query for the blocks?
                if (lang.isString(this.blocks)) {
                    
                    this.blocks = query(this.blocks);
                }
                
                // build the blocks data
                blocks = [];
                this.blocks.forEach(function(block) {
                    
                    blocks.push({
                        block: block,
    					top: domGeom.position(block, true).y,
    					pin: 0,
    					animations: []
                    });
                });
                this._blocks = blocks;
                
                // if pinning is enabled, convert the blocks to
                // absolute position
                if (this.enablePin) {
                    
                    array.forEach(this._blocks, function(block) {
                        
                        domStyle.set(block.block, {
                            "position": "absolute",
                            "top": block.top
                        });
                    });
                }
                
                // register event handlers
                this._registerHandlers();
            },
            
            _registerHandlers: function() {
                
                on(window, "scroll", lang.hitch(this, this._onScroll));
            },
            
            _onScroll: function() {
                
                this._animateAtomic(lang.hitch(this, this._scrollorama));
            },
            
            _scrollorama: function() {
                
                // TODO:
                // the meat!
            }
        });
        
        
        // define the package structure
        scrollorama.Scrollorama = Scrollorama;
        return scrollorama.Scrollorama;
    }
);