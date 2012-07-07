define(
    [
        "./_base"
    ],
    function(easing) {
        
        easing.Bounce = {
            
            easeIn: function(t, b, c, d) {
                
                return c - easing.Bounce.easeOut(d - t, 0, c, d) + b;
            },
            
            easeOut: function(t, b, c, d) {
                
                t = t / d;
                if (t < (1 / 2.75)) {
                    
                    return (7.5625 * c * t * t) + b;
                
                } else if (t < (2 / 2.75)) {
                    
                    t = t - (1.5 / 2.75);
                    return (7.5625 * c * ((t * t) + 0.75)) + b;
                    
                } else if (t < (2.5 / 2.75)) {
                    
                    t = t - (2.25 / 2.75);
                    return (7.5625 * c * ((t * t) + 0.9375)) + b;
                    
                } else {
                    
                    t = t - (2.625 / 2.75);
                    return (7.5625 * c * ((t * t) + 0.984375)) + b;
                }
            },
            
            easeInOut: function(t, b, c, d) {
                
                if (t < (0.5 * d)) {
                    
                    return (0.5 * easing.Bounce.easeIn(t * 2, 0, c, d)) + b;
                    
                } else {
                    
                    return (0.5 * (easing.Bounce.easeOut((t * 2) - d, 0, c, d) + c)) + b;
                }
            }
        };
        
        return easing.Bounce;
    }
);