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
            
            constructor: function(node) {
                
                var styles;
                
                // store the node
                this._node = node;
                
                // sanity check
                if (node === null || node === undefined) {
                    
                    throw new Error("You must pass a DOM node to the Block constructor.");
                }
                
                // we'll need the node's original styles
                styles = domStyle.getComputedStyle(this._node),
                
                // set up the animations array
                this._animations = [];
                
                // store the original styles that we will modify
                this._styles = { };
                
                this._styles["position"] = styles["position"];
                this._styles["top"] = styles["top"];
                this._styles["left"] = styles["left"];
                this._styles["margin-top"] = styles["margin-top"];
                this._styles["margin-bottom"] = styles["margin-bottom"];
                this._styles["margin-left"] = styles["margin-left"];
                this._styles["margin-right"] = styles["margin-right"];
            },
            
            
            ///////////////////////////////////////////////////////////////////
            // public api
            ///////////////////////////////////////////////////////////////////
            
            // add an animation inside this block
            animate: function(animation) {
                
                this._animations.push(animation);
            },
            
            // configure pinning for this block, the block may only have one
            // pinning configuration, so an error is thrown if this gets
            // called more than once. the parameters are:
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
                        "The delay parameter must be a Number or a function."
                    );
                }
                
                if (!(typeof duration === "number" || lang.isFunction(duration))) {
                    
                    throw new Error(
                        "The duration parameter must be a Number or a function."
                    );
                }
                
                // store the pinning data
                this._pin = {
                    delay: delay,
                    duration: duration
                };
            },
            
            // initialize the block's styles
            initialize: function(marginBox, position, wrapperPosition) {
                
                // store the margin box and position
                this._marginBox = marginBox;
                this._position = position;
                
                // the node's position should be "absolute"
                if (this._styles["position"] !== "absolute") {
                    
                    domStyle.set(this._node, "position", "absolute");
                }
                
                // set the node's "top" and "left" positions and "margin" styles
                domStyle.set(this._node, {
                    "top": -wrapperPosition.y + this._position.y + "px",
                    "left": -wrapperPosition.x + this._position.x + "px",
                    "margin-top": "0",
                    "margin-bottom": "0",
                    "margin-left": "0",
                    "margin-right": "0"
                });
            },
            
            // reset the block's styles
            reset: function() {
                
                domStyle.set(this._node, this._styles);
            },
            
            // calculate the pin's offset
            calculatePinOffset: function(screenHeight) {
                
                var
                    // the block's calculated height
                    blockHeight = domGeom.position(this._node, true).h;
                
                // return the calculated pinning duration
                if (this._pin !== null) {
                    
                    return (
                        lang.isFunction(this._pin.duration)
                        ?
                        this._pin.duration(screenHeight, blockHeight)
                        :
                        this._pin.duration
                    );
                
                } else {
                    
                    return 0;
                }
            },
            
            // set the block node's top offset
            setOffset: function(wrapperPosition, offset) {
                
                this._topOffset = offset;
                domStyle.set(this._node, {
                    "top": -wrapperPosition.y + this._position.y + this._topOffset + this._pinOffset + "px",
                    "left": -wrapperPosition.x + this._position.x + "px"
                });
            },
            
            // update all of the block's animations and pin the block,
            // if necessary
            updateAnimations: function(wrapperPosition, screenTopPixel, screenHeight) {
                
                var
                    // the block's calculated position, top pixel and height
                    blockPosition,
                    blockTopPixel,
                    blockHeight,
                    
                    // the calculated pin delay, duration and completion percentage
                    pinDelay = 0,
                    pinDuration = 0,
                    pinPercent,
                    
                    // the animations along with their completion percentages
                    animationsAbove = [],
                    animationsBelow = [],
                    animationsCurrent = [];
                
                
                // reset the "position", "top" and "left" styles so we can correctly
                // calculate the block's position and each animation's
                // completion percentage
                domStyle.set(this._node, {
                    "position": "absolute",
                    "top": -wrapperPosition.y + this._position.y + this._topOffset + "px",
                    "left": -wrapperPosition.x + this._position.x + "px"
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
                
                // calculate each animations completion percentage
                // to build up the above / below / current arrays
                array.forEach(this._animations, function(animation) {
                    
                    var 
                        // we need the animation's completion percentage
                        percent = animation.calculatePercentage(
                            screenTopPixel,
                            screenHeight,
                            blockTopPixel,
                            blockHeight,
                            pinDelay,
                            pinDuration
                        ),
                        
                        // data to store for this animation
                        data = {
                            animation: animation,
                            percent: percent
                        };
                    
                    if (percent < 0.0) {
                        
                        // the animation is below its starting point
                        animationsBelow.push(data);
                        
                    } else if (percent > 1.0) {
                        
                        // the animation is above its ending point
                        animationsAbove.push(data);
                        
                    } else {
                        
                        // the animation is currently running
                        animationsCurrent.push(data);
                    }
                });
                
                // animations which are below the screen should update from 
                // the bottom up with respect to their registered order
                animationsBelow.reverse();
                
                // start, finish or update each animation
                array.forEach(animationsAbove, function(data) {
                    data.animation.finish();
                });
                array.forEach(animationsBelow, function(data) {
                    data.animation.start();
                });
                array.forEach(animationsCurrent, function(data) {
                    data.animation.update(data.percent);
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
                        "top": screenHeight - pinDelay + "px",
                        "left": this._position.x + "px"
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
                        "top": -wrapperPosition.y + this._position.y + this._topOffset + this._pinOffset + "px"
                    });
                }
            }
        });
        
        
        // define the package structure
        blocks.Block = Block;
        return blocks.Block;
    }
);