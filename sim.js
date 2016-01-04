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
        var x = Math.floor(ent.position.x);
        var y = Math.floor(ent.position.y);
        if (this.world.land[y][x]) {
            // undo it (i.e., place the ent back outside the land)
            ent.position.x -= ent.velocity.x;
            ent.position.y -= ent.velocity.y;
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
