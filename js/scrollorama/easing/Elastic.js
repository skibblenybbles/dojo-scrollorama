define(
    [
        "./_base"
    ],
    function(easing) {
        
        easing.Elastic = {
            
            easeIn: function(t, b, c, d) {
                
                var s = 1.70158,
                    p = 0.3 * d,
                    a = c;
                
                t = t / d;
                
                if (t === 0) {
                    
                    return b;
                
                } else if (t === 1) {
                    
                    return b + c;
                
                } else if (a < Math.abs(c)) {
                    
                    s = 0.25 * p;
                
                } else {
                    
                    s = ((0.5 * p) / Math.PI) * Math.asin(c / a);
                }
                
                t = t - 1;
                return (-a * Math.pow(2, 10 * t) * Math.sin((((t * d) - s) * (2 * Math.PI)) / p)) + b;
            },
            
            easeOut: function(t, b, c, d) {
                
                var s = 1.70158,
                    p = 0.3 * d,
                    a = c;
                
                t = t / d;
                
                if (t === 0) {
                    
                    return b;
                
                } else if (t === 1) {
                    
                    return b + c;
                
                } else if (a < Math.abs(c)) {
                    
                    s = 0.25 * p;
                
                } else {
                    
                    s = ((0.5 * p) / Math.PI) * Math.asin(c / a);
                }
                
                return a * Math.pow(2, -10 * t) * Math.sin((((t * d) - s) * (2 * Math.PI)) / p) + b + c;
            },
            
            easeInOut: function(t, b, c, d) {
                
                var s = 1.70158,
                    p = 0.45 * d,
                    a = c;
                
                t = (2 * t) / d;
                
                if (t === 0) {
                    
                    return b;
                
                } else if (t === 2) {
                    
                    return b + c;
                
                } else if (a < Math.abs(c)) {
                    
                    s = 0.25 * p;
                
                } else {
                    
                    s = ((0.5 * p) / Math.PI) * Math.asin(c / a);
                }
                
                t = t - 1;
                if (t < 0) {
                    
                    return (-0.5 * a * Math.pow(2, 10 * t) * Math.sin((((t * d) - s) * (2 * Math.PI)) / p)) + b;
                
                } else {
                    
                    return (0.5 * a * Math.pow(2, -10 * t) * Math.sin((((t * d) - s) * (2 * Math.PI)) / p)) + b + c;
                }
            }
        };
        
        return easing.Elastic;
    }
);