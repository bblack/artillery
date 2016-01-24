define(function(require){
    function assert(condition, msg){
        if (!condition)
            throw new Error('Assertion failed: ' + msg);
    }
    return assert;
});
