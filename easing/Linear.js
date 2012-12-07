define(
    [
        "./_base"
    ],
    function(easing) {
        
        easing.Linear = {
            
            easeNone: function(t, b, c, d) {
                
                return (c * (t / d)) + b;
            }
        };
        
        return easing.Linear;
    }
);
