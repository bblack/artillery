define(function(require){
    function assert(condition, msg){
        if (!condition)
            throw new Error('Assertion failed: ' + msg);
    }
    assert.warn = function(condition, msg){
        if (!condition)
            console.warn('Assertion failed:', msg);
    }
    return assert;
});
