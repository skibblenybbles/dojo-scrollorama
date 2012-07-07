define(
    [
        "./easing/_base",
        "./easing/Linear",
        "./easing/Quadratic",
        "./easing/Cubic",
        "./easing/Quartic",
        "./easing/Quintic",
        "./easing/Sinusoidal",
        "./easing/Exponential",
        "./easing/Circular",
        "./easing/Elastic",
        "./easing/Back",
        "./easing/Bounce"
    ],
    function(easing) {
        
        // convenience loader for all easing types
        return easing;
    }
);