define(
    [
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/dom-style",
        "./_base"
    ],
    function(array, declare, domStyle, blocks) {
        
        
        var Block = declare(null, {
                        
            ///////////////////////////////////////////////////////////////////
            // internal state
            ///////////////////////////////////////////////////////////////////
            
            // the block's DOM node
            _node: null,
            
            // the block's Animation objects
            _animations: null,
            
            // the original CSS style properties which may be overwritten
            // for animations
            _styles: null,
            
            
            ///////////////////////////////////////////////////////////////////
            // constructor
            ///////////////////////////////////////////////////////////////////
            
            constructor: function(node) {
                
                this._node = node;
                
                // sanity check
                if (this._node === null || this._node === undefined) {
                    
                    throw new Error("You must pass a DOM node to the Block constructor.");
                }
                
                var 
                    styles = domStyle.getComputedStyle(this._node),
                    style;
                
                
                // set up the animations array
                this._animations = [];
                
                
                // store the original styles that we may modify, parsing 
                // numerical values as needed
                this._styles = { };
                
                this._styles["display"] = styles["display"];
                this._styles["position"] = styles["position"];
                
                style = styles["margin-top"];
                style = parseInt(style);
                this._styles["margin-top"] = isNaN(style) ? 0 : style;
                
                style = styles["margin-bottom"];
                style = parseInt(style);
                this._styles["margin-bottom"] = isNaN(style) ? 0 : style;
                
                
                // the node's display should be "inline-block"
                // so that margin collapsing is turned off
                if (this._styles["display"] !== "inline-block") {
                    
                    domStyle.set(this._node, "display", "inline-block");
                }
                
                
                // the node's position should be "relative"
                if (this._styles["position"] !== "relative") {

                    domStyle.set(this._node, "position", "relative");
                }
            },
            
            
            ///////////////////////////////////////////////////////////////////
            // public api
            ///////////////////////////////////////////////////////////////////
            
            // return the DOM node
            getNode: function() {
                
                return this._node;
            },
            
            // add an animation
            addAnimation: function(animation) {
                
                this._animations.push(animation);
            },
            
            // update all of the block's animations
            update: function() {
                
                var pinTop = 0,
                    pinBottom = 0;
                
                // reset the top and bottom margins
                domStyle.set(this._node, {
                    "margin-top": this._styles["margin-top"] + "px",
                    "margin-bottom": this._styles["margin-bottom"] + "px"
                });
                
                // update each animation, keeping track of the largest
                // top and bottom pinning margins
                array.forEach(this._animations, function(animation) {
                    
                    var pin = animation.update();
                    if (pin !== null) {
                        
                        if (pin.top > pinTop) {
                            pinTop = pin.top;
                        }
                        
                        if (pin.bottom > pinBottom) {
                            pinBottom = pin.bottom;
                        }
                    }
                });
                
                // apply the new top and bottom margins
                if (pinTop !== 0 || pinBottom !== 0) {
                    
                    domStyle.set(this._node, {
                        "margin-top": this._styles["margin-top"] + pinTop + "px",
                        "margin-bottom": this._styles["margin-bottom"] + pinBottom + "px"
                    });
                }
            }
        });
        
        
        // define the package structure
        blocks.Block = Block;
        return blocks.Block;
    }
);