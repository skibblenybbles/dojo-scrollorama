define(
    [
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/dom-geometry",
        "dojo/dom-style",
        "dojo/has",
        "./_base",
        
        // package modifiers (no passed values required)
        "dojo/_base/sniff",
    ],
    function(declare, lang, domGeom, domStyle, has, animation) {
        
        
        var Animation = declare(null, {
            
            
            ///////////////////////////////////////////////////////////////////
            // options
            ///////////////////////////////////////////////////////////////////
            
            // amount of scrolling in pixels from the top edge of the
            // block crossing the bottom edge of the screen before animation
            // begins (Number or function).
            delay: 0,
            
            // screen length of scrolling over which the animation occurs
            // after the delay from the bottom of the screen has been scrolled
            // through.
            duration: 0,
            
            // the delay and duration settings control when the animation
            // begins and ends. each setting may either be a Number or a
            // function that returns a Number with the following signature:
            //
            //  function(screenHeight, blockHeight, pinDelay, pinDuration)
            //
            //      screenHeight:
            //          the current height of the screen in pixels
            //
            //      blockHeight:
            //          the current height of the block in pixels
            //
            //      pinDelay:
            //          the delay in pixels before the block becomes pinned
            //
            //      pinDuration:
            //          the block's pinning duration
            
            // CSS property being animated (must be numerical)
            property: null,
            
            // beginning value of the CSS property
            // (uses current value if not specified)
            begin: null,
            
            // ending value of the CSS property
            // (uses current value if not specified)
            end: null,
            
            // one of the methods from the easing package
            // (the default, null, uses Linear.easeNone() easing)
            easing: null,
            
            
            ///////////////////////////////////////////////////////////////////
            // internal state
            ///////////////////////////////////////////////////////////////////
            
            // the DOM node inside the block to which the animation applies
            _node: null,
            
            // the original CSS style properties which may be overwritten
            // for animations
            _styles: null,
            
            
            ///////////////////////////////////////////////////////////////////
            // constructor
            ///////////////////////////////////////////////////////////////////
            
            constructor: function(node, options) {
                
                this._node = node;
                declare.safeMixin(this, options);
                
                // sanity checks
                if (this._node === null || this._node === undefined) {
                    
                    throw new Error("You must pass a DOM node to the Animation constructor.");
                }
                
                if (!(typeof this.delay === "number" || lang.isFunction(this.delay))) {
                    
                    throw new Error("The delay option must be either a Number or a function.");
                }
                
                if (!(typeof this.duration === "number" || lang.isFunction(this.duration))) {
                    
                    throw new Error("The duration option must be either a Number or a function.");
                }
                
                if (this.property === null) {
                    
                    throw new Error("The property option must be set to a CSS property name.");
                }
                
                if (!(this.easing === null || lang.isFunction(this.easing))) {
                    
                    throw new Error("The easing option must be set to an easing function or null.");
                }
                
                // initialize the node
                this._initialize();
            },
            
            
            ///////////////////////////////////////////////////////////////////
            // public api
            ///////////////////////////////////////////////////////////////////
            
            // calculate the animation's completion percentage
            calculatePercentage: function(screenTopPixel, screenHeight, blockTopPixel, blockHeight, pinDelay, pinDuration) {
                
                var 
                    // calculate the delay offset
                    delay = 
                        lang.isFunction(this.delay)
                        ?
                        this.delay(screenHeight, blockHeight, pinDelay, pinDuration)
                        :
                        this.delay,
                
                    // calculate the duration
                    duration =
                        lang.isFunction(this.duration)
                        ?
                        this.duration(screenHeight, blockHeight, pinDelay, pinDuration)
                        :
                        this.duration,
                
                    // calculate the animation completion percentage
                    animPercent = 
                        duration === 0
                        ?
                        1.0
                        :
                        (screenTopPixel + screenHeight - (blockTopPixel + delay)) / duration;
                
                return animPercent;
            },
            
            // start the node's animation
            start: function() {
                
                this._setProperty(this.begin);
            },
            
            // finish the node's animation
            finish: function() {
                
                this._setProperty(this.end);
            },
            
            // update the node's animation
            update: function(percent) {
                
                // update the percentage with easing
                if (this.easing !== null) {
                    
                    percent = this.easing(percent, 0, 1, 1);
                }
                
                // set the CSS property value
                this._setProperty(this.begin + (percent * (this.end - this.begin)));
            },
            
            
            ///////////////////////////////////////////////////////////////////
            // internal methods
            ///////////////////////////////////////////////////////////////////
            
            // initialize the node, storing its original CSS style property
            _initialize: function() {
                
                var 
                    // the node's computed styles
                    styles = domStyle.getComputedStyle(this._node),
                    
                    // the calculated CSS property value
                    value;
                
                // store up the initial styles
                this._styles = { };
                
                // calculate begin and end values for all property cases
                switch (this.property) {
                    
                    case "top":
                    case "bottom":
                    case "left":
                    case "right":
                        
                        // the node's position should be not be "static"
                        if (styles["position"] === "static") {
                            
                            this._styles["position"] = styles["position"];
                            domStyle.set(this._node, "position", "relative");
                        }
                        
                        // calculate the begin and end values
                        value = parseInt(styles[this.property]);
                        if (this.begin === null) {
                            this.begin = isNaN(value) ? 0 : value;
                        }
                        if (this.end === null) {
                            this.end = isNaN(value) ? 0 : value;
                        }
                        
                        break;
                    
                    case "rotate":
                        
                        // set begin and end defaults
                        if (this.begin === null) {
                            this.begin = 0;
                        }
                        if (this.end === null) {
                            this.end = 0;
                        }
                        
                        break;
                    
                    case "zoom":
                    case "scale":
                    case "letter-spacing":
                        
                        // set begin and end defaults
                        if (this.begin === null) {
                            this.begin = 1;
                        }
                        if (this.end === null) {
                            this.end = 1;
                        }
                        
                        break;
                    
                    default:
                        
                        // calculate the begin and end values
                        value = parseInt(styles[this.property]);
                        if (this.begin === null) {
                            this.begin = isNaN(value) ? 0 : value;
                        }
                        if (this.end === null) {
                            this.end = isNaN(value) ? 0 : value;
                        }
                        
                        break;
                }
            },
            
            // set the CSS property to the given value
            _setProperty: function(value) {
                
                var position;
                
                switch (this.property) {
                    
                    case "rotate":
                        
                        domStyle.set(this._node, "transform", "rotate(" + value + "deg)");
                        domStyle.set(this._node, Animation.BROWSER_PREFIX + "transform", "rotate(" + value + "deg)");
                        break;
                    
                    case "zoom":
                    case "scale":
                        
                        if (has("ie")) {
                            
                            domStyle.set(this._node, "zoom", (value * 100) + "%");
                            
                        } else {
                            
                            domStyle.set(this._node, "transform", "scale(" + value + ")");
                            domStyle.set(this._node, Animation.BROWSER_PREFIX + "transform", "scale(" + value + ")");
                        }
                        break;
                    
                    case "background-position-x":
                    case "background-position-y":
                        
                        position = domStyle.get(this._node, "backgtround-position").split(" ");
                        if (property === "background-position-x") {
                            
                            domStyle.set(this._node, "background-position", value + "px " + position[1]);
                            
                        } else if (property === "background-position-y") {
                            
                            domStyle.set(this._node, "background-position", position[0] + " " + value + "px");
                        }
                        break;
                    
                    case "text-shadow":
                        
                        domStyle.set(this._node, this.property, "0 0 " + value + "px #fff");
                        break;
                    
                    case "opacity":
                        
                        domStyle.set(this._node, this.property, value);
                        break;
                    
                    default:
                        
                        // use pixels for all other properties
                        domStyle.set(this._node, this.property, value + "px");
                        break;
                }
            }
        });
        
        
        ///////////////////////////////////////////////////////////////////////
        // constants
        ///////////////////////////////////////////////////////////////////////
        
        // the browser prefix for "experimental" CSS properties
        Animation.BROWSER_PREFIX =
            ((has("ff") || has("mozilla")) && "-moz-") ||
            ((has("webkit") || has("chrome") || has("safari")) && "-webkit-") ||
            (has("opera") && "-o-") ||
            (has("ie") && "-ms-") ||
            "";
        
        
        // define the package structure
        animation.Animation = Animation;
        return animation.Animation;
    }
);