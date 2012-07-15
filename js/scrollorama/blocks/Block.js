define(
    [
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/dom-geometry",
        "dojo/dom-style",
        "./_base"
    ],
    function(array, declare, lang, domGeom, domStyle, blocks) {
        
        
        var Block = declare(null, {
            
            ///////////////////////////////////////////////////////////////////
            // internal state
            ///////////////////////////////////////////////////////////////////
            
            // the block's DOM node
            _node: null,
            
            // the block's original margin box
            _marginBox: null,
            
            // the block's original position
            _position: null,
            
            // the block's Animation objects
            _animations: null,
            
            // the original CSS style properties which may be overwritten
            // for animations
            _styles: null,
            
            // the block's pinning configuration, set up by calling pin()
            _pin: null,
            
            // the block's current top offset
            // (to adjust for blocks above that are pinned)
            _topOffset: 0,
            
            // the block's current pin offset
            // (to adjust for the offset after pinning)
            _pinOffset: 0,
            
            
            ///////////////////////////////////////////////////////////////////
            // constructor
            ///////////////////////////////////////////////////////////////////
            
            constructor: function(node, marginBox, position) {
                
                var styles;
                
                this._node = node;
                this._marginBox = marginBox;
                this._position = position;
                
                // sanity check
                if (this._node === null || this._node === undefined) {
                    
                    throw new Error("You must pass a DOM node to the Block constructor.");
                }
                
                if (this._marginBox === null || this._marginBox === undefined) {
                    
                    throw new Error("You must pass the DOM node's margin box to the Block constructor.");
                }
                
                if (this._position === null || this._position === undefined) {
                    
                    throw new Error("You must pass the DOM node's position to the Block constructor.");
                }
                
                // we'll need the node's original styles
                styles = domStyle.getComputedStyle(this._node),
                
                // set up the animations array
                this._animations = [];
                
                // store the original styles that we may modify
                this._styles = { };
                
                this._styles["display"] = styles["display"];
                this._styles["position"] = styles["position"];
                this._styles["top"] = styles["top"];
                this._styles["margin-top"] = styles["margin-top"];
                this._styles["margin-bottom"] = styles["margin-bottom"];
                
                // the node's position should be "absolute"
                if (this._styles["position"] !== "absolute") {
                    
                    domStyle.set(this._node, "position", "absolute");
                }
                
                // set the node's top position and margin styles
                domStyle.set(this._node, {
                    "top": this._position.y + "px",
                    "margin-top": "0",
                    "margin-bottom": "0"
                });
            },
            
            
            ///////////////////////////////////////////////////////////////////
            // public api
            ///////////////////////////////////////////////////////////////////
            
            // add an animation
            addAnimation: function(animation) {
                
                this._animations.push(animation);
            },
            
            // configure pinning for this block, the block may only have one
            // pinning configuration, so an error is thrown if this gets
            // called more than once. the paramters are:
            //
            //  delay:
            //      length of scrolling in pixels from the top edge of the
            //      block crossing the bottom edge of the screen before
            //      pinning starts (Number or function).
            //
            //  duration:
            //      length of scrolling in pixels over which the pinning
            //      occurs after the delay from the bottom of the screen has 
            //      been scrolled through.
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
            pin: function(delay, duration) {
                
                if (this._pin !== null) {
                    
                    throw new Error(
                        "You may only specify up to one pinning configuration for each block."
                    );
                }
                
                // sanity checks
                if (!(typeof delay === "number" || lang.isFunction(delay))) {
                    
                    throw new Error(
                        "The delay paramter must be a Number or a function."
                    );
                }
                
                if (!(typeof duration === "number" || lang.isFunction(duration))) {
                    
                    throw new Error(
                        "The duration paramter must be a Number or a function."
                    );
                }
                
                // store the pinning data
                this._pin = {
                    delay: delay,
                    duration: duration
                };
            },
            
            // set the node's top offset
            setOffset: function(offset) {
                
                this._topOffset = offset;
                domStyle.set(this._node, "top", this._position.y + this._topOffset + this._pinOffset + "px");
            },
            
            // update all of the block's animations and return the block's
            // pinning duration
            update: function(screenTopPixel, screenHeight) {
                
                var
                    // the block's calculated position, top pixel and height
                    blockPosition,
                    blockTopPixel,
                    blockHeight,
                    
                    // the calculated pin delay, duration and completion percentage
                    pinDelay = 0,
                    pinDuration = 0,
                    pinPercent;
                
                    
                // reset the "position" and "top" styles so we can correctly
                // calculate the block's position and each animation's
                // completion percentage
                domStyle.set(this._node, {
                    "position": "absolute",
                    "top": this._position.y + this._topOffset + "px"
                });
                
                // calculate the block's position, top pixel and height
                blockPosition = domGeom.position(this._node, true);
                blockTopPixel = blockPosition.y;
                blockHeight = blockPosition.h;
                
                // calculate the pin delay, duration and completion percentage
                if (this._pin !== null) {
                    
                    pinDelay = 
                        lang.isFunction(this._pin.delay)
                        ?
                        this._pin.delay(screenHeight, blockHeight)
                        :
                        this._pin.delay;
                    
                    pinDuration =
                        lang.isFunction(this._pin.duration)
                        ?
                        this._pin.duration(screenHeight, blockHeight)
                        :
                        this._pin.duration;
                    
                    pinPercent = 
                        pinDuration === 0 
                        ?
                        1.0
                        :
                        (screenTopPixel + screenHeight - (blockTopPixel + pinDelay)) / pinDuration;
                }
                
                // update each animation
                array.forEach(this._animations, function(animation) {
                    
                    animation.update(
                        screenTopPixel,
                        screenHeight,
                        blockTopPixel,
                        blockHeight,
                        pinDelay,
                        pinDuration
                    );
                });
                
                // is the block currently pinned?
                if (this._pin !== null &&
                    pinPercent >= 0.0 &&
                    pinPercent <= 1.0
                ) {
                    
                    // the block is pinned
                    
                    // the pinning offset is zero
                    this._pinOffset = 0;
                    
                    // set its position to "fixed" with the correct "top" offset
                    domStyle.set(this._node, {
                        "position": "fixed",
                        "top": screenHeight - pinDelay + "px"
                    });
                    
                } else {
                    
                    // the block is not pinned
                    
                    // calculate the pinning offset
                    this._pinOffset = 
                        this._pin !== null && pinPercent > 1.0
                        ?
                        pinDuration
                        :
                        0;
                    
                    // set the "top" to the calculated offset
                    domStyle.set(this._node, {
                        "top": this._position.y + this._topOffset + this._pinOffset + "px"
                    });
                }
                
                // return the pin duration
                return pinDuration;
            }
        });
        
        
        // define the package structure
        blocks.Block = Block;
        return blocks.Block;
    }
);