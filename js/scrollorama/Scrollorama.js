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
        "./_base",
        "./blocks/Block",
        "./animations/Animation",
        "./ranges/RangeSet",
        
        // package modifiers (no passed values required)
        "dojo/NodeList-traverse"
    ],
    function(array, declare, lang, NodeList, domAttr, domGeom, domStyle, on, query, scrollorama, Block, Animation, RangeSet) {
        
        var Scrollorama = declare(null, {
            
            
            ///////////////////////////////////////////////////////////////////
            // internal state
            ///////////////////////////////////////////////////////////////////
            
            // the CSS block selector (as a string)
            _selector: null,
            
            // the blocks' DOM nodes
            _blocks: null,
            
            // the blocks' id map (maps _blocks[i].node["data-scrollorama-id"] to each block instance)
            _blocksMap: null,
            
            // the blocks wrapper DOM node
            _wrapper: null,
            
            // the blocks wrapper original styles
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
            
            
            ///////////////////////////////////////////////////////////////////
            // constructor
            ///////////////////////////////////////////////////////////////////
            
            constructor: function(selector) {
                
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
            
            // register a NodeList of DOM nodes with a list of animation
            // configurations
            register: function(nodes) {
                
                // nodes:
                //      the animation target nodes; can be a NodeList from
                //      query(), a CSS selector string, or a single DOM node.
                //
                // additional arguments:
                //      array of animation parameters Objects
                //
                // animation parameters:
                //
                //  delay: (0)
                //      amount of scrolling (in delayUnits) from the (delayEdge) of the
                //      block crossing the bottom edge of the screen before animation
                //      starts.
                //  delayUnits: ("%")
                //      the units to measure the scroll delay.
                //      may be "px" for absolute lengths or "%" for relative lengths
                //      of the screen's height, e.g. 25%.
                //  delayEdge: (0)
                //      the horizontal edge line of the block from which to measure the
                //      delay with respect to the bottom edge of the screen
                //      may be a numerical percentage of the block's border-box height,
                //      e.g. 50 for the middle of the block, or one of the presets
                //      "top" === 0, "bottom" === 100 or "middle" === 50
                // 
                //      the overall duration of the animation is the sum of
                //      screenDuration and blockDuration.
                //      used in combination with "%" units, this makes it easy to 
                //      configure an animation that runs from the bottom of the screen 
                //      all the way until the block has completely left the screen,
                //      i.e. screenDuration === 100% and blockDuration === 100%
                //      with delay === 0.
                //
                //  screenDuration: (100)
                //      screen length of scrolling (in screenDurationUnits) over which
                //      the animation occurs after the delay from the bottom of the
                //      screen has been scrolled through.
                //  screenDurationUnits: ("%")
                //      the units to measure the screen scroll duration
                //      may be "px" for absolute lengths or "%" for relative lengths
                //      of the screen's height, e.g. 25%.
                //  blockDuration: (100)
                //      block length of scrolling (in blockDurationUnits) over which
                //      the animation occurs after the delay from the bottom of the
                //      screen has been scrolled through.
                //  blockDurationUnits: ("%")
                //      the units to measure the block scroll duration
                //      may be "px" for absolute lengths or "%" for relative lengths
                //      of the block's border-box height, e.g. 25%.
                //  property: (required)
                //      CSS property being animated (must be numerical)
                //  begin: (current value)
                //      beginning value of the CSS property
                //      (uses current value if not specified)
                //  end: (current value)
                //      ending value of the CSS property
                //      (uses current value if not specified)
                //  pin: (false)
                //      pin the block during the animation's duration?
                //  easing: (null)
                //      one of the methods from the easing packages
                //      (the default, null, uses Linear.easeNone() easing)
                
                var 
                    // store the animations arguments
                    animations = array.filter(arguments, function(anim, i) {
                        return i !== 0;
                    });
                
                // convert the target to a NodeList
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
                    block = this._blocksMap[domAttr.get(block[0], "data-scrollorama-id")];
                    if (block === undefined) {
                        
                        throw new Error(
                            "One of the parent blocks of the nodes passed to animate() was not initialized " +
                            "when this Scrollorama instance was created."
                        );
                    }
                    
                    // add each animation to the block's animations array
                    array.forEach(animations, lang.hitch(this, function(anim) {
                        
                        block.addAnimation(new Animation(block, node, anim));
                    }));
                    
                }));
                
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
                
                // register event handlers
                this._registerHandlers();
            },
            
            _buildBlocksData: function(nodes) {
                
                var blocksData = [];
                
                nodes.forEach(function(node) {
                    
                    // keep track of the node, its margin box and position
                    blocksData.push({
                        node: node,
                        marginBox: domGeom.getMarginBox(node),
                        position: domGeom.position(node)
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
                    index,
                    blocks,
                    blocksMap;
                
                // build the blocks and map
                index = 0;
                blocks = [];
                blocksMap = { };
                blocksData.forEach(function(data) {
                    
                    // store the scrollorama id on this node
                    domAttr.set(data.node, "data-scrollorama-id", "" + index);
                    
                    var block = new Block(data.node, data.marginBox, data.position);
                    blocks.push(block);
                    blocksMap["" + index] = block;
                    
                    index += 1;
                });
                
                
                this._blocks = blocks;
                this._blocksMap = blocksMap;
            },
            
            _scrollorama: function() {
                
                var 
                    // all pinning ranges
                    ranges = new RangeSet();
                    
                // update each block, setting top offsets along the way
                array.forEach(this._blocks, function(block) {
                    
                    // set the block's top offset
                    block.setTopOffset(ranges.totalLength());
                    
                    // update the block's animations
                    // and track its pinning ranges
                    ranges.extend(block.update());
                    
                    // simplify the ranges
                    ranges = ranges.simplify();
                });
                
                // update the wrapper's height
                domStyle.set(this._wrapper, "height", this._wrapperHeight + ranges.totalLength() + "px");
            }
        });
        
        
        // define the package structure
        scrollorama.Scrollorama = Scrollorama;
        return scrollorama.Scrollorama;
    }
);