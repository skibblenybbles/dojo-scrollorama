define(
    [
        "./_base"
    ],
    function(easing) {
        
        easing.Circular = {
            
            easeIn: function(t, b, c, d) {
                
                t = t / d;
                return (-c * (Math.sqrt(1 - (t * t)) - 1)) + b;
            },
            
            easeOut: function(t, b, c, d) {
                
                t = (t / d) - 1;
                return (c * Math.sqrt(1 - (t * t))) + b; 
            },
            
            easeInOut: function(t, b, c, d) {
                
                t = (2 * t) / d;
                if (t < 1) {
                    
                    return ((-0.5 * c) * (Math.sqrt(1 - (t * t)) - 1)) + b;
                
                } else {
                    
                    t = t - 2;
                    return (0.5 * c * (Math.sqrt(1 - (t * t)) + 1)) + b;
                }
            }
        };
        
        return easing.Circular;
    }
);