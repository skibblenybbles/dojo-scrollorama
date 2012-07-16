define(
    [
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/NodeList",
        "dojo/dom-attr",
        "dojo/dom-geometry",
        "dojo/dom-style",
        "dojo/on",
        "dojo/query",
        "dojo/window",
        "./_base",
        "./blocks/Block",
        "./animations/Animation",
        
        // package modifiers (no passed values required)
        "dojo/NodeList-traverse"
    ],
    function(array, declare, lang, NodeList, domAttr, domGeom, domStyle, on, query, scrollWindow, scrollorama, Block, Animation) {
        
        // private, static helpers for the Scrollorama instances
        var statics = {
            
            // a unique serial number
            _serial: 1,
            
            // generate a serial number
            generateSerial: function() {
                
                var serial = this._serial;
                this._serial += 1;
                return serial;
            }
        };
        
        // the Scrollorama class
        var Scrollorama = declare(null, {
            
            
            ///////////////////////////////////////////////////////////////////
            // internal state
            ///////////////////////////////////////////////////////////////////
            
            // the CSS block selector (as a string)
            _selector: null,
            
            // the instance's serial id data attribute (string)
            _serialId: null,
            
            // the blocks' DOM nodes
            _blocks: null,
            
            // the blocks' id map (maps _blocks[i].node["data-scrollorama{serial}-id"] to each block instance)
            _blocksMap: null,
            
            // the blocks' wrapper DOM node
            _wrapper: null,
            
            // the blocks' wrapper original styles
            _wrapperStyles: null,
            
            // the wrapper's base height
            _wrapperHeight: 0,
            
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
                    
                    // run the callback immediately - not atomic :(
    				callback();
    			},
    		
    		// have we started processing scrolling yet?
    		_started: false,
            
            
            ///////////////////////////////////////////////////////////////////
            // constructor
            ///////////////////////////////////////////////////////////////////
            
            constructor: function(selector) {
                
                this._serialId = "data-scrollorama" + statics.generateSerial() + "-id";
                
                this._selector = selector;
                
                // sanity check
                if (!(lang.isString(this._selector))) {
                    
                    throw new Error(
                        "You must pass a CSS selector string to the Scrollorama constructor."
                    );
                }
                
                // initialize
                this._initialize();
            },
            
            
            ///////////////////////////////////////////////////////////////////
            // public api
            ///////////////////////////////////////////////////////////////////
            
            // configure pinning for a NodeList of block DOM nodes or a
            // single block's DOM node with the following parameters:
            //
            //  nodes:
            //      the block nodes to pin; can be a NodeList from query(),
            //      a CSS selector string, or a single DOM node. the nodes
            //      must have been matched by the Scrollorama constructor's
            //      CSS selector, and each block's node may only be pinned
            //      once.
            //
            //  options:
            //      an Object with the following options
            //
            //  delay: (0)
            //      length of scrolling in pixels from the top edge of the
            //      block crossing the bottom edge of the screen before
            //      pinning starts (Number or function).
            //
            //  duration: (0)
            //      length of scrolling in pixels over which the pinning occurs
            //      after the delay from the bottom of the screen has been
            //      scrolled through.
            //
            //  the delay and duration settings may either be a Number or a 
            //  function that returns a Number with the following signature:
            //
            //      function(screenHeight, blockHeight)
            //
            //          screenHeight: (calculated)
            //              the current height of the screen in pixels
            //
            //          blockHeight: (calculated)
            //              the current height of the block in pixels
            pin: function(nodes, options) {
                
                var settings = {
                    delay: 0,
                    duration: 0
                };
                declare.safeMixin(settings, options);
                
                // convert the nodes to a NodeList
                if (!(nodes instanceof NodeList)) {
                    
                    if (typeof nodes === "string") {
                        
                        // query for the selector
                        nodes = query(nodes);
                        
                    } else {
                        
                        // assume a single DOM node
                        nodes = new NodeList(nodes);
                    }
                }
                
                // process each DOM node
                nodes.forEach(lang.hitch(this, function(node) {
                    
                    var 
                        // get the block instance
                        block = this._blocksMap[domAttr.get(node, this._serialId)];
                    
                    if (block === undefined) {
                        
                        throw new Error(
                            "One of the blocks passed passed to pin() was not initialized " + 
                            "when this Scrollorama instance was created."
                        );
                    }
                    
                    // set the block's pinning data
                    block.pin(settings.delay, settings.duration);
                }));
            },
            
            // animate a NodeList of DOM nodes or a single DOM node with a
            // list of animation configurations
            animate: function(nodes) {
                
                // nodes:
                //      the animation target nodes; can be a NodeList from
                //      query(), a CSS selector string, or a single DOM node.
                //      the nodes must be children of one of the blocks matched
                //      by the Scrollorama constructor's CSS selector.
                //
                // additional arguments:
                //      array of animation parameters Objects
                //
                // where animation parameters are specified as:
                //
                //  delay: (0)
                //      length of scrolling in pixels from the top edge of the
                //      block crossing the bottom edge of the screen before animation
                //      starts (Number or function).
                //
                //  duration: (0)
                //      length of scrolling in pixels over which the animation occurs
                //      after the delay from the bottom of the screen has been scrolled
                //      through.
                //
                //  delay and duration settings may either be a 
                //  Number or a function that returns a Number with the 
                //  following signature:
                //
                //      function(screenHeight, blockHeight, pinDelay, pinDuration)
                //
                //          screenHeight: (calculated)
                //              the current height of the screen in pixels
                //
                //          blockHeight: (calculated)
                //              the current height of the block in pixels
                //
                //          pinDelay: (0)
                //              the delay in pixels before the block becomes pinned, if
                //              pinning is configured for this animation's block
                //
                //          pinDuration: (0)
                //              the block's pin duration, if pinning is configured for
                //              this animation's block
                //
                //  property: (required)
                //      CSS property being animated (must be numerical)
                //
                //  begin: (current value)
                //      beginning value of the CSS property
                //
                //  end: (current value)
                //      ending value of the CSS property
                //  easing: (Linear.easeNone)
                //      one of the methods from the easing package
                
                var 
                    // store the animations arguments
                    animations = array.filter(arguments, function(anim, i) {
                        return i !== 0;
                    });
                
                // convert the nodes to a NodeList
                if (!(nodes instanceof NodeList)) {
                    
                    if (typeof nodes === "string") {
                        
                        // query for the selector
                        nodes = query(nodes);
                        
                    } else {
                        
                        // assume a single DOM node
                        nodes = new NodeList(nodes);
                    }
                }
                
                // process each DOM node
                nodes.forEach(lang.hitch(this, function(node) {
                    
                    var 
                        // the node's containing block
                        block = new NodeList(node).closest(this._selector);
                    
                    // sanity check
                    // make sure we have a unique containing block
                    if (block.length !== 1) {
                        
                        throw new Error(
                            "One of the DOM nodes passed to animate() does not have a unique containing block."
                        );
                    }
                    
                    // look up the block data
                    block = this._blocksMap[domAttr.get(block[0], this._serialId)];
                    if (block === undefined) {
                        
                        throw new Error(
                            "One of the parent blocks of the nodes passed to animate() was not initialized " +
                            "when this Scrollorama instance was created."
                        );
                    }
                    
                    // add each animation to the block's animations array
                    array.forEach(animations, lang.hitch(this, function(anim) {
                        
                        block.addAnimation(new Animation(node, anim));
                    }));
                    
                }));
            },
            
            // update the page and start processing scrolling
            go: function() {
                
                if (this._started) {
                    
                    return;
                }
                this._started = true;
                
                // register the event handlers
                this._registerHandlers();
                
                // update!
                this._update();
            },
            
            
            ///////////////////////////////////////////////////////////////////
            // internal methods
            ///////////////////////////////////////////////////////////////////
            
            _update: function() {
                
                this._animateAtomic(lang.hitch(this, this._scrollorama));
            },
            
            _registerHandlers: function() {
                
                on(window, "scroll", lang.hitch(this, this._update));
            },
            
            _initialize: function() {
                
                var blocksData;
                
                // make _animateAtomic run in the context of the window
                this._animateAtomic = lang.hitch(window, this._animateAtomic);
                
                // build the blocks' data with the selected nodes
                blocksData = this._buildBlocksData(query(this._selector));
                
                // initialize the blocks' wrapper
                this._initializeWrapper(blocksData);
                
                // initialize the blocks
                this._initializeBlocks(blocksData);
            },
            
            _buildBlocksData: function(nodes) {
                
                var blocksData = [];
                
                nodes.forEach(function(node) {
                    
                    // keep track of the node, its margin box and position
                    blocksData.push({
                        node: node,
                        marginBox: domGeom.getMarginBox(node),
                        position: domGeom.position(node, true)
                    });
                });
                
                return blocksData;
            },
            
            _initializeWrapper: function(blocksData) {
                
                var wrapper = null,
                    height = 0,
                    styles;
                
                // while we add up the total height,
                // make sure we have a single, unique wrapper
                array.forEach(blocksData, function(data) {
                    
                    if (wrapper === null) {
                        
                        wrapper = data.node.parentNode;
                    
                    } else {
                        
                        if (data.node.parentNode !== wrapper) {
                            
                            throw new Error("The blocks must all share the same parent node.");
                        }
                    }
                    
                    height += data.marginBox.h;
                });
                
                // set up the wrapper's styles
                this._wrapper = wrapper;
                this._wrapperStyles = { };
                this._wrapperHeight = height;
                if (this._wrapper !== null) {
                    
                    styles = domStyle.getComputedStyle(this._wrapper);
                    
                    // store the original styles that we may change
                    this._wrapperStyles["position"] = styles["position"];
                    this._wrapperStyles["height"] = styles["height"];
                    
                    // the wrapper's position should be "relative"
                    if (this._wrapperStyles["position"] !== "relative") {
                        
                        domStyle.set(this._wrapper, "position", "relative");
                    }
                    
                    // set the wrapper's base height
                    domStyle.set(this._wrapper, "height", this._wrapperHeight + "px");
                }
            },
            
            _initializeBlocks: function(blocksData) {
                
                var 
                    // the wrapper's position
                    wrapperPosition = domGeom.position(this._wrapper, true),
                    
                    // processing data
                    index,
                    blocks,
                    blocksMap;
                
                // build the blocks and map
                index = 0;
                blocks = [];
                blocksMap = { };
                blocksData.forEach(lang.hitch(this, function(data) {
                    
                    // store the scrollorama id on this node
                    domAttr.set(data.node, this._serialId, "" + index);
                    
                    var block = new Block(
                        data.node, 
                        data.marginBox, 
                        data.position, 
                        wrapperPosition
                    );
                    blocks.push(block);
                    blocksMap["" + index] = block;
                    
                    index += 1;
                }));
                
                this._blocks = blocks;
                this._blocksMap = blocksMap;
            },
            
            _scrollorama: function() {
                
                var 
                    // the screen's position and dimensions
                    screenPosition = scrollWindow.getBox(),
                    screenTopPixel = screenPosition.t,
                    screenHeight = screenPosition.h,
                    
                    // the wrapper's position
                    wrapperPosition = domGeom.position(this._wrapper, true),
                    
                    // the cumulative pinning offset
                    offset = 0;
                    
                // update each block, setting top offsets along the way
                array.forEach(this._blocks, function(block) {
                    
                    // set the block's top offset
                    block.setOffset(wrapperPosition, offset);
                    
                    // update the block's animations, accumulating
                    // pinning offsets
                    offset += block.update(wrapperPosition, screenTopPixel, screenHeight);
                });
                
                // update the wrapper's height to accommodate pinning offsets
                domStyle.set(this._wrapper, "height", this._wrapperHeight + offset + "px");
            }
        });
        
        
        ///////////////////////////////////////////////////////////////////////
        // static helpers
        ///////////////////////////////////////////////////////////////////////
        
        // scale and offset a function
        var linearize = function(fn, scale, offset) {
            
            if (scale === undefined) {
                
                scale = 1.0;
            }
            
            if (offset === undefined) {
                
                offset = 0.0;
            }
            
            return function() {
                
                return (scale * fn.apply(null, arguments)) + offset;
            }
        }
        
        // helpers for pin delay and duration calculations
        Scrollorama.pin = {
            
            delay: {
                
                // pin the block at the top of the screen
                top: function(s, b) {
                    return s;
                },
                
                // pin the block in the middle of the screen
                middle: function(s, b) {
                    return 0.5 * (s + b);
                },
                
                // pin the block at the bottom of the screen
                bottom: function(s, b) {
                    return b;
                },
                
                // linearized versions
                linearTop: function(scale, offset) {
                    return linearize(this.top, scale, offset);
                },
                linearMiddle: function(scale, offset) {
                    return linearize(this.middle, scale, offset);
                },
                linearBottom: function(scale, offset) {
                    return linearize(this.bottom, scale, offset);
                }
            },
            
            duration: {
                
                // pin for the height of the screen
                screen: function(s, b) {
                    return s;
                },

                // pin for the height of the block
                block: function(s, b) {
                    return b;
                },
                
                // pin for the height of the screen plus the
                // height of the block
                full: function(s, b) {
                    return s + b;
                },
                
                // linearized versions
                linearScreen: function(scale, offset) {
                    return linearize(this.screen, scale, offset);
                },
                linearBlock: function(scale, offset) {
                    return linearize(this.block, scale, offset);
                },
                linearFull: function(scale, offset) {
                    return linearize(this.full, scale, offset);
                }
            }
        };
        
        // helpers for animation delay and duration calculations
        Scrollorama.animate = {
            
            delay: {
                
                // animate at the top of the screen
                top: function(s, b, d, p) {
                    return s + d + p;
                },
                
                // animate in the middle of the screen (without pinning)
                middle: function(s, b, d, p) {
                    return 0.5 * (s + b);
                },
                
                // animate at the bottom of the screen
                bottom: function(s, b, d, p) {
                    return 0;
                },
                
                // animate when the pinning begins
                pin: function(s, b, d, p) {
                    return d;
                },
                
                // animate after the pinning ends
                after: function(s, b, d, p) {
                    return d + p;
                },
                
                // linearized versions
                linearTop: function(scale, offset) {
                    return linearize(this.top, scale, offset);
                },
                linearMiddle: function(scale, offset) {
                    return linearize(this.middle, scale, offset);
                },
                linearBottom: function(scale, offset) {
                    return linearize(this.bottom, scale, offset);
                },
                linearPin: function(scale, offset) {
                    return linearize(this.pin, scale, offset);
                },
                linearAfter: function(scale, offset) {
                    return linearize(this.after, scale, offset);
                }
            },
            
            duration: {
                
                // animate for the height of the screen
                screen: function(s, b, d, p) {
                    return s;
                },
                
                // animate for the height of the block
                block: function(s, b, d, p) {
                    return b;
                },
                
                // animate for the pin's duration
                pin: function(s, b, d, p) {
                    return p;
                },
                
                // animate for the height before the pin
                before: function(s, b, d, p) {
                    return s + b - d;
                },
                
                // animate for the height after the pin
                after: function(s, b, d, p) {
                    return s - d;
                },
                
                // animate for the height of the screen, plus
                // the height of block plus the pin's duration
                full: function(s, b, d, p) {
                    return s + b + p;
                },
                
                // linearized versions
                linearScreen: function(scale, offset) {
                    return linearize(this.screen, scale, offset);
                },
                linearBlock: function(scale, offset) {
                    return linearize(this.block, scale, offset);
                },
                linearPin: function(scale, offset) {
                    return linearize(this.pin, scale, offset);
                },
                linearBefore: function(scale, offset) {
                    return linearize(this.before, scale, offset);
                },
                linearAfter: function(scale, offset) {
                    return linearize(this.after, scale, offset);
                },
                linearFull: function(scale, offset) {
                    return linearize(this.full, scale, offset);
                }
            }
        };
        
        
        // define the package structure
        scrollorama.Scrollorama = Scrollorama;
        return scrollorama.Scrollorama;
    }
);