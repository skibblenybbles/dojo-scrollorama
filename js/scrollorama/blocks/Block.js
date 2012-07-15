define(
    [
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/dom-style",
        "./_base",
        "../ranges/RangeSet"
    ],
    function(array, declare, domStyle, blocks, RangeSet) {
        
        
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
            
            // the block's current top offset
            // (to adjust for blocks above that are pinned)
            _topOffset: 0,
            
            // the block's current pin offset
            // (to adjust for animations before and after their pinning)
            _pinOffset: 0,
            
            // the block's Animation objects
            _animations: null,
            
            // the original CSS style properties which may be overwritten
            // for animations
            _styles: null,
            
            
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
            
            // return the DOM node
            getNode: function() {
                
                return this._node;
            },
            
            // add an animation
            addAnimation: function(animation) {
                
                this._animations.push(animation);
            },
            
            // set the node's top offset
            setTopOffset: function(offset) {
                
                this._topOffset = offset;
                domStyle.set(this._node, "top", this._position.y + this._topOffset + this._pinOffset + "px");
            },
            
            // update all of the block's animations and return
            // pinning range data
            update: function() {
                
                var
                    // pinning ranges for finished animations
                    // (used to calculate the pinOffset)
                    finishedRanges = new RangeSet(),
                    
                    // all pinning ranges
                    // (used by the Scrollorama instance to adjust all 
                    // subsequent blocks and the wrapper's height)
                    allRanges = new RangeSet(),
                    
                    // the pin positions currently applying to this block
                    pinPositions = [],
                    
                    // the average of the pin positions
                    pinPosition;
                
                    
                // reset the "position" and "top" styles so we can correctly
                // calculate the animations' completion percentage
                domStyle.set(this._node, {
                    "position": "absolute",
                    "top": this._position.y + this._topOffset + "px"
                });
                
                // update each animation and track pinning data
                array.forEach(this._animations, function(animation) {
                    
                    var pinningData = animation.update();
                    
                    // track pinning data?
                    if (pinningData !== null) {
                        
                        // track all ranges
                        allRanges.add(pinningData.range);
                        
                        // track other data based on the animation's state
                        switch (pinningData.state) {
                            
                            case "above":
                            
                                // this animation is finished, so track
                                // its range separately
                                finishedRanges.add(pinningData.range);
                                break;
                            
                            case "below":
                                
                                // nothing to track
                                break;
                            
                            case "pinned":
                                
                                // the animation is pinned, so track its
                                // pinning position
                                pinPositions.push(pinningData.position);
                                break;
                        }
                    }
                });
                
                // calculate the pinning offset
                this._pinOffset = finishedRanges.totalLength();
                
                // is the block pinned?
                if (pinPositions.length > 0) {
                    
                    // set the block's position to "fixed" and its "top" to the
                    // average of the pin positions
                    pinPosition = 0;
                    array.forEach(pinPositions, function(position) {
                        
                        pinPosition += position;
                    });
                    pinPosition = Math.round(pinPosition / pinPositions.length);
                    domStyle.set(this._node, {
                        "position": "fixed",
                        "top": pinPosition + "px"
                    });
                    
                } else {
                    
                    // set the "top" to the calculated offset
                    domStyle.set(this._node, {
                        "top": this._position.y + this._topOffset + this._pinOffset + "px"
                    });
                }
                
                // return the pinning range data
                return allRanges;
            }
        });
        
        
        // define the package structure
        blocks.Block = Block;
        return blocks.Block;
    }
);