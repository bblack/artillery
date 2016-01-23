define(function(require){
    var Victor = require('victor');
    var assert = require('assert');

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
    Sim.prototype.lowestOpenRow = function(col){
        for (var i=0; i<this.world.height; i++) {
            if (!this.world.land[i][col]) break;
        }
        return i;
    }
    Sim.prototype.resolveCollision = function(ent){
        // move the ent back, then use bresenham to find first colliding pixel
        var p = ent.position.clone().subtract(ent.velocity).unfloat();
        var v = ent.velocity.clone();
        var yIsLonger = Math.abs(v.y) > Math.abs(v.x);
        var long = yIsLonger ? v.y : v.x;
        var short = yIsLonger ? v.x : v.y;
        var yDir = new Victor(0, v.y > 0 ? 1 : -1);
        var xDir = new Victor(v.x > 0 ? 1 : -1, 0);
        // for every pixel moved along the longer axis,
        // move this many along the short:
        var shortPerLong = short / long;
        assert(Math.abs(shortPerLong) >= 0 && Math.abs(shortPerLong) <= 1);
        var row = p.y;
        var col = p.x;
        var nextRow;
        var nextCol;
        var collision;
        for (var i = 0; Math.abs(i) < Math.abs(long); i += (long > 0 ? 1 : -1)) {
            p.add(yIsLonger ? yDir : xDir); // move 1 unit along longer axis
            p[yIsLonger ? 'x' : 'y'] += shortPerLong; // and less along shorter
            // p now has int component on long axis; float component on short.
            nextCol = Math.round(p.x);
            nextRow = Math.round(p.y);
            if (this.world.land[nextRow][nextCol]) {
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
                    if (this.world.land[p.y + dy][p.x + dx]) {
                        surfnorm.add(new Victor(dx, dy).invert().norm());
                    }
                }
            }
            surfnorm.norm();
            // assert(surfnorm.dot(v) <= 1e-9);
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
        this.world.ents.forEach(function(ent){
            ent.velocity.y += self.g;
        });
        this.world.ents.forEach(function(ent){
            ent.position.x += ent.velocity.x;
            ent.position.y += ent.velocity.y;
        });
        this.world.ents.forEach(function(ent){
            self.resolveCollision(ent);
        });
        this.world.ents.forEach(function(ent){
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
