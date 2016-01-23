define(function(require){
    var Victor = require('victor');

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
        // determine pixel where collision occurs, primarily so we can calculate its
        // surface normal force, and secondarily to place the entity there.

        var p = ent.position.clone().unfloat(); // round this, i guess
        if (this.world.land[p.y][p.x]) {
            // undo it (i.e., place the ent back outside the land)
            ent.position.x -= ent.velocity.x;
            ent.position.y -= ent.velocity.y;
            // use bresenham's line algo to find the soonest colliding pixel
            var v = ent.velocity;
            var pPrime;
            var lastPixel;
            var thisPixel;
            var yIsLonger = Math.abs(v.y) > Math.abs(v.x);
            var long = yIsLonger ? v.y : v.x;
            var short = yIsLonger ? v.x : v.y;
            for (var i=0; i < Math.abs(long); i += (long > 0 ? 1 : -1)) {
                var p = ent.position.clone().unfloat(); // round this, i guess
                if (yIsLonger) {
                    var row = i + p.y;
                    var col = Math.round(v.x / v.y * (row - p.y) + p.x);
                } else {
                    var col = i + p.x;
                    var row = Math.round(v.y / v.x * (col - p.x) + p.y);
                }
                lastPixel = thisPixel;
                thisPixel = [row, col];
                if (this.world.land[row][col]) {
                    ent.position.x = col;
                    ent.position.y = row;
                    break;
                }
            }
            x = Math.floor(ent.position.x);
            y = Math.floor(ent.position.y);
            // velocity vector gets reflected off surface:
            var run = ent.velocity.x >= 0 ? 1 : -1;
            var rise = this.lowestOpenRow(x + run) - this.lowestOpenRow(x);
            var surfnorm = new Victor(-rise, run);
            // TODO: use rotateBy. in current Victor, they are swapped.
            var v = new Victor(ent.velocity.x, ent.velocity.y)
                .rotate(surfnorm.verticalAngle())
                .invertX()
                .rotate(-surfnorm.verticalAngle())
                .invert();
            _.extend(ent.velocity, _.pick(v, 'x', 'y'));
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
