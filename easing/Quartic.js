define(
    [
        "./_base"
    ],
    function(easing) {
        
        easing.Quartic = {
            
            easeIn: function(t, b, c, d) {
                
                t = t / d;
                return (c * t * t * t * t) + b
            },
            
            easeOut: function(t, b, c, d) {
                
                t = (t / d) - 1;
                return -(c * ((t * t * t * t) - 1)) + b;
            },
            
            easeInOut: function(t, b, c, d) {
                
                t = (2 * t) / d;
                if (t < 1) {
                    
                    return (0.5 * c * t * t * t * t) + b;
                    
                } else {
                    
                    t = t - 2;
                    return ((-0.5 * c) * ((t * t * t * t) - 2)) + b;
                }
            }
        };
        
        return easing.Quartic;
    }
);