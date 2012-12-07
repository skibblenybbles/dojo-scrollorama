define(
    [
        "./_base"
    ],
    function(easing) {
        
        easing.Quadratic = {
            
            easeIn: function(t, b, c, d) {
                
                t = t / d;
                return (c * t * t) + b
            },
            
            easeOut: function(t, b, c, d) {
                
                t = t / d;
                return -(c * t * (t - 2)) + b;
            },
            
            easeInOut: function(t, b, c, d) {
                
                t = (2 * t) / d;
                if (t < 1) {
                    
                    return (0.5 * c * t * t) + b;
                    
                } else {
                    
                    t = t - 1;
                    return ((-0.5 * c) * ((t * (t - 2)) - 1)) + b;
                }
            }
        };
        
        return easing.Quadratic;
    }
);
