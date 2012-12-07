define(
    [
        "./_base"
    ],
    function(easing) {
        
        easing.Back = {
            
            easeIn: function(t, b, c, d) {
                
                var s = 1.70158;
                
                t = t / d;
                return (c * t * t * (((s + 1) * t) - s)) + b;
            },
            
            easeOut: function(t, b, c, d) {
                
                var s = 1.70158;
                
                t = (t / d) - 1;
                return c * (t * t * (((s + 1) * t) + s) + 1) + b;
            },
            
            easeInOut: function(t, b, c, d) {
                
                var s = 2.5949095;
                
                t = (2 * t) / d;
                
                if (t < 1) {
                    
                    return (0.5 * c * t * t * (((s + 1) * t) - s)) + b;
                    
                } else {
                    
                    t = t - 2;
                    return 0.5 * c * (t * t * (((s + 1) * t) + s) + 2) + b;
                }
            }
        };
        
        return easing.Back;
    }
);