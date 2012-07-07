define(
    [
        "./_base"
    ],
    function(easing) {
        
        easing.Exponential = {
            
            easeIn: function(t, b, c, d) {
                
                if (t === 0) {
                    
                    return b;
                    
                } else {
                    
                    return (c * Math.pow(2, 10 * ((t / d) - 1))) + b;
                }
            },
            
            easeOut: function(t, b, c, d) {
                
                if (t === d) {
                    
                    return b + c;
                
                } else {
                    
                    return (c * (-Math.pow(2, (-10 * t) / d) + 1)) + b;
                }
            },
            
            easeInOut: function(t, b, c, d) {
                
                if (t == 0) {
                    
                    return b;
                
                } else if (t === d) {
                    
                    return b + c;
                
                } else {
                    
                    t = (2 * t) / d;
                    if (t < 1) {
                        
                        return (0.5 * c * Math.pow(2, 10 * (t - 1))) + b;
                        
                    } else {
                        
                        t = t - 1;
                        return (0.5 * c * (-Math.pow(2, -10 * t) + 2)) + b;
                    }
                }
            }
        };
        
        return easing.Exponential;
    }
);