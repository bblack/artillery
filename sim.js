define(function(require){
    var Victor = require('victor');
    var assert = require('assert');
    var _ = require('underscore');

    function Sim(world, view){
        if (world.constructor.name != 'World')
            throw 'Invalid world passed';
        if (view.constructor.name != 'View')
            throw 'Invalid view passed';
        this.world = world;
        this.view = view;
        this.frametime = 1000 / 60; // ms per frame
        this.g = -0.3; // gravity in pixels/tick/tick
    }
    Sim.prototype.resolveCollision = function(ent){
        // move the ent back, then use bresenham to find first colliding pixel
        // TODO: should we be unfloating here? should we instead be unfloating
        // only when comparing against land?
        var p = ent.position.clone().subtract(ent.velocity);
        var v = ent.velocity.clone();
        var yIsLonger = Math.abs(v.y) > Math.abs(v.x);
        var long = yIsLonger ? v.y : v.x;
        var short = yIsLonger ? v.x : v.y;
        var yDir = new Victor(0, v.y > 0 ? 1 : -1);
        var xDir = new Victor(v.x > 0 ? 1 : -1, 0);
        // for every pixel moved along the longer axis,
        // move this many along the short:
        var shortPerLong = Math.abs(short / long);
        assert(Math.abs(shortPerLong) >= 0 && Math.abs(shortPerLong) <= 1);
        var row = p.y;
        var col = p.x;
        var nextRow;
        var nextCol;
        var collision;
        for (var i = 0; Math.abs(i) < Math.abs(long); i += (long > 0 ? 1 : -1)) {
            p.add(yIsLonger ? yDir : xDir); // move 1 unit along longer axis
            var shortAxisDelta = (yIsLonger ? xDir : yDir).clone()
                .multiplyScalar(shortPerLong);
            p.add(shortAxisDelta); // and less along shorter
            // p now has int component on long axis; float component on short.
            nextCol = p.x;
            nextRow = p.y;
            if (this.world.land.check(nextCol, nextRow)) {
                collision = true;
                break;
            }
            row = nextRow;
            col = nextCol;
        }
        if (collision) {
            // position ent just before land
            p.copy({x: col, y: row});
            ent.position = p;
            var surfnorm = new Victor(0, 0);
            for (var dx = -1; dx <= 1; dx++) {
                for (var dy = -1; dy <= 1; dy++) {
                    if (this.world.land.check(p.x + dx, p.y + dy)) {
                        surfnorm.add(new Victor(dx, dy).invert().norm());
                    }
                }
            }
            surfnorm.norm();
            assert.warn(surfnorm.dot(v) <= 1e-9);
            // TODO: use rotateBy. in current Victor, they are swapped.
            var newV = v.clone()
                .rotate(surfnorm.verticalAngle())
                .invertX()
                .rotate(-surfnorm.verticalAngle())
                .invert();
            var RESTITUTION = 1;
            newV.x = newV.x * RESTITUTION;
            newV.y = newV.y * RESTITUTION;
            ent.velocity.copy(newV);
        }
    };
    Sim.prototype.tick = function(){
        // simulate
        var self = this;
        _.chain(this.world.ents)
        .each(function(ent){
            ent.velocity.y += self.g;
        })
        .each(function(ent){
            ent.position.add(ent.velocity);
        })
        .each(function(ent){
            self.resolveCollision(ent);
        })
        .each(function(ent){
            ent.tick();
        });
    }
    Sim.prototype.start = function(){
        var self = this;
        setInterval(function(){
            self.tick();
        }, self.frametime);
    }
    return Sim;
});
