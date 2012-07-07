define(
    [
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/NodeList",
        "dojo/_base/window",
        "dojo/dom-attr",
        "dojo/dom-geometry",
        "dojo/dom-style",
        "dojo/has",
        "dojo/on",
        "dojo/query",
        "dojo/window",
        "./_base",
        
        // package modifiers (no passed values required)
        "dojo/_base/sniff",
        "dojo/NodeList-traverse"
    ],
    function(array, declare, lang, NodeList, baseWindow, domAttr, domGeom, domStyle, has, on, query, scrollWindow, scrollorama) {
        
        var Scrollorama = declare(null, {
            
            
            ///////////////////////////////////////////////////////////////////
            // options
            ///////////////////////////////////////////////////////////////////
            
            // global offset for starting animations
            offset: 0,
            
            // whether to allow pinning
            enablePin: true,
            
            // the CSS block selector (as a string)
            selector: null,
            
            
            ///////////////////////////////////////////////////////////////////
            // internal state
            ///////////////////////////////////////////////////////////////////
            
            // the blocks' DOM nodes
            _blocks: null,
            
            // the blocks' id map (maps _blocks[i].node["data-scrollorama-id"] to each block's data)
            _blocksMap: null,
            
            // the browser prefix for "experimental" CSS properties
            _prefix:
                ((has("ff") || has("mozilla")) && "-moz-") ||
                ((has("webkit") || has("chrome") || has("safari")) && "-webkit-") ||
                (has("opera") && "-o-") ||
                (has("ie") && "-ms-") ||
                "",
            
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
            
            constructor: function(options) {
                
                declare.safeMixin(this, options);
                
                // sanity check
                if (!(lang.isString(this.selector))) {
                    
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
            
            animate: function(nodes) {
                
                // nodes:
                //      the animation target nodes; can be a NodeList from
                //      query(), a CSS selector string, or a single DOM node.
                // arguments:
                //      array of animation parameters Objects
                // animation parameters:
                //      Object with the following options:
                //      delay:
                //          amount of scrolling (in pixels) before animation starts
                //      duration:
                //          amount of scrolling (in pixels) over which the animation occurs
                //      property:
                //          CSS property being animated (must be numerical)
                //      begin:
                //          beginning value of the property (uses current value if not specified)
                //      end:
                //          ending value of the property (uses current value if not specified)
                //      pin:
                //          pin the block during animation duration (applies to all animations within the block)
                //      baseline:
                //          "top" (when block reaches top of viewport) or "bottom" (when block first comes into view);
                //          default is "top" if pin === true; otherwise default is "bottom"
                //      easing:
                //          TODO!
                
                
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
                        
                        // must be a DOM node
                        nodes = new NodeList(nodes);
                    }
                }
                
                // process each DOM node
                nodes.forEach(lang.hitch(this, function(node) {
                    
                    var // the node's containing block
                        block = new NodeList(node).closest(this.selector),
                        
                        // the computed styles for this node
                        styles = domStyle.getComputedStyle(node);
                    
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
                        
                        var value,
                            offset;
                        
                        // calculate begin and end values for all property cases
                        switch (anim.property) {
                            
                            case "top":
                            case "bottom":
                            case "left":
                            case "right":
                                
                                // the node's position should be "relative"
                                if (styles.position === "static") {

                                    domStyle.set(node, "position", "relative");
                                }

                                // calculate the begin and end values
                                value = parseInt(styles[anim.property]);
                                if (anim.begin === undefined) {
                                    anim.begin = isNaN(value) ? 0 : value;
                                }
                                if (anim.end === undefined) {
                                    anim.end = isNaN(value) ? 0 : value;
                                }
                                
                                break;
                            
                            case "rotate":
                                
                                // set begin and end defaults
                                if (anim.begin === undefined) {
                                    anim.begin = 0;
                                }
                                if (anim.end === undefined) {
                                    anim.end = 0;
                                }
                                
                                break;
                            
                            case "zoom":
                            case "scale":
                            case "letter-spacing":
                                
                                // set begin and end defaults
                                if (anim.begin === undefined) {
                                    anim.begin = 1;
                                }
                                if (anim.end === undefined) {
                                    anim.end = 1;
                                }
                                
                                break;
                            
                            default:
                                
                                // calculate the begin and end values
                                value = parseInt(styles[anim.property]);
                                if (anim.begin === undefined) {
                                    anim.begin = isNaN(value) ? 0 : value;
                                }
                                if (anim.end === undefined) {
                                    anim.end = isNaN(value) ? 0 : value;
                                }
                                
                                break;
                        }
                        
                        // set the baseline
                        if (anim.baseline === undefined) {
                            
                            if (anim.pin || block.pin !== 0) {
                                
                                anim.baseline = "top";
                            
                            } else {
                                
                                anim.baseline = "bottom";
                            }
                            
                        } else if (anim.baseline !== "top" || anim.baseline !== "bottom") {
                            
                            throw new Error(
                                "Invalid baseline setting: " + anim.baseline
                            );
                        }
                        
                        // set the delay
                        if (anim.delay === undefined) {
                            
                            anim.delay = 0;
                        }
                        
                        // adjust styles for pinning
                        if (anim.pin) {
                            
                            if (block.pin < anim.duration + anim.delay) {
                                
                                offset = anim.duration + anim.delay - block.pin;
                                block.pin += offset;
                                
                                // adjust all blocks below
                                array.forEach(this._blocks.slice(block.index + 1), function(block) {
                                    
                                    block.top += offset;
                                    domStyle(block.node, "top", block.top + "px");
                                });
                            }
                        }
                        
                        // store the animation
                        anim.node = node;
                        block.animations.push(anim);
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
                
                var 
                    index,
                    nodes,
                    block,
                    blocks,
                    blocksMap;
                
                // make _animateAtomic run in the context of the window
                this._animateAtomic = lang.hitch(window, this._animateAtomic);
                
                // query for the blocks' nodes
                nodes = query(this.selector);
                
                // build the blocks data and map
                index = 0;
                blocks = [];
                blocksMap = { };
                nodes.forEach(function(node) {
                    
                    var
                        // the node's position
                        position = domGeom.position(node, true);
                    
                    // store the scrollorama id on this node
                    domAttr.set(node, "data-scrollorama-id", "" + index);
                    
                    var block = {
                        node: node,
    					top: position.y,
    					height: position.h,
    					pin: 0,
    					index: index,
    					animations: []
                    };
                    blocks.push(block);
                    blocksMap["" + index] = block;
                    
                    index += 1;
                });
                this._blocks = blocks;
                this._blocksMap = blocksMap;
                
                // is pinning enabled?
                if (this.enablePin) {
                    
                    // make sure the body has the "position: relative" style
                    domStyle.set(baseWindow.body(), "position", "relative");
                    
                    // convert the blocks to absolute position
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
            
            _scrollorama: function() {
                
                // sanity check?
                if (this._blocks.length === 0) {
                    
                    return;
                }
                
                var
                    // the screen's position
                    screen = scrollWindow.getBox(),
                    screenTop = screen.t,
                    
                    // the calculated current block
                    currentBlock = this._blocks[0];
                
                // find the current block
                // (the bottom-most block that is currently on the screen)
                array.every(this._blocks, lang.hitch(this, function(block) {
                    
                    if (block.top <= (screenTop - this.offset)) {
                        
                        currentBlock = block;
                        
                        // keep searching
                        return true;
                    
                    } else {
                        
                        // stop searching
                        return false;
                    }
                    
                }));
                
                // update each block's animations
                array.forEach(this._blocks, lang.hitch(this, function(block) {
                    
                    // update each animation
                    array.forEach(block.animations, lang.hitch(this, function(anim) {
                        
                        var
                            // the top of the animation
                            animTop = block.top + anim.delay - (anim.baseline === "bottom" ? screen.h : 0),
                            
                            // the bottom of the animation
                            animBottom = animTop + anim.duration,
                            
                            // the percentage of animation completion
                            animPercentage;
                        
                        // if below the current block,
                        // change properties to their begin values
                        // unless we're on an animation that starts
                        // when it hits the bottom of the viewport
                        if (block.index > currentBlock.index) {
                            
                            if (!((block.index - 1) === currentBlock.index && 
                                  anim.baseline === "bottom"
                            )) {
                                
                                this._setProperty(anim.node, anim.property, anim.begin);
                            }
                            
                            if (block.pin !== 0) {
                                
                                domStyle.set(block.node, {
                                    "position": "absolute",
                                    "top": block.top
                                });
                            }
                        }
                        
                        // if above the current block,
                        // change properties to their end values
                        if (block.index < currentBlock.index) {
                            
                            this._setProperty(anim.node, anim.property, anim.end);
                            
                            if (block.pin !== 0) {
                                
                                domStyle.set(block.node, {
                                    "position": "absolute",
                                    "top": block.top + block.pin
                                });
                            }
                        }
                        
                        // otherwise, set properties based on scroll position
                        if (block.index === currentBlock.index ||
                            ((block.index - 1) === currentBlock.index && 
                             anim.baseline === "bottom"
                        )) {
                            
                            // pin it?
                            if (block.pin !== 0 &&
                                block.index === currentBlock.index
                            ) {
                                
                                domStyle.set(block.node, {
                                    "position": "fixed",
                                    "top": 0
                                });
                            }
                            
                            // decide what to do based on where we are in the animation
                            if (screenTop < animTop) {
                                
                                this._setProperty(anim.node, anim.property, anim.begin);
                                
                                if (block.pin !== 0) {

                                    domStyle.set(block.node, {
                                        "position": "absolute",
                                        "top": block.top
                                    });
                                }
                                
                            } else if (screenTop > animBottom) {
                                
                                this._setProperty(anim.node, anim.property, anim.end);
                                
                                if (block.pin !== 0) {
                                    
                                    domStyle.set(block.node, {
                                        "position": "absolute",
                                        "top": block.top + block.pin
                                    });
                                }
                                
                            } else {
                                
                                // calculate the animation percentage
                                animPercent = (screenTop - animTop) / anim.duration;
                                
                                // calculate easing
                                if (anim.easing && lang.isFunction(anim.easing)) {
                                    
                                    animPercent = anim.easing(animPercent, 0, 1, 1);
                                }
                                
                                // set the property
                                this._setProperty(anim.node, anim.property, anim.begin + (animPercent * (anim.end - anim.begin)));
                            }
                        }
                        
                    }));
                                        
                }));
            
            },
            
            _setProperty: function(node, property, value) {
                
                var position;
                
                switch (property) {
                    
                    case "rotate":
                        
                        domStyle.set(node, this._prefix + "transform", "rotate(" + value + "deg)");
                        break;
                    
                    case "zoom":
                    case "scale":
                        
                        if (has("ie")) {
                            
                            domStyle.set(node, "zoom", (value * 100) + "%");
                            
                        } else {
                            
                            domStyle.set(node, this._prefix + "transform", "scale(" + value + ")");
                        }
                        break;
                    
                    case "background-position-x":
                    case "background-position-y":
                        
                        position = domStyle.get(node, "backgtround-position").split(" ");
                        if (property === "background-position-x") {
                            
                            domStyle.set(node, "background-position", val + "px " + position[1]);
                            
                        } else if (property === "background-position-y") {
                            
                            domStyle.set(node, "background-position", position[0] + " " + val + "px");
                        }
                        break;
                    
                    case "text-shadow":
                        
                        domStyle.set(node, property, "0 0 " + val + "px #fff");
                        break;
                    
                    case "opacity":
                        
                        domStyle.set(node, property, value);
                        break;
                    
                    default:
                        
                        // use pixels for all other properties
                        domStyle.set(node, property, value + "px");
                        break;
                }
            }
            
        });
        
        
        // define the package structure
        scrollorama.Scrollorama = Scrollorama;
        return scrollorama.Scrollorama;
    }
);