define(
    [
        "./_base"
    ],
    function(easing) {
        
        easing.Sinusoidal = {
            
            easeIn: function(t, b, c, d) {
                
                return (-c * Math.cos((0.5 * Math.PI * t) / d)) + c + b;
            },
            
            easeOut: function(t, b, c, d) {
                
                return (c * Math.sin((0.5 * Math.PI * t) / d)) + b;
            },
            
            easeInOut: function(t, b, c, d) {
                
                return ((-0.5 * c) * (Math.cos((Math.PI * t) / d) - 1)) + b;
            }
        };
        
        return easing.Sinusoidal;
    }
);
