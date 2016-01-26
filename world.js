define(function(require){
    function World(){
        var w = this.width = 640;
        var h = this.height = 480;
        var land = this.land = [];
        land.check = function(x, y) {
            return this[Math.round(y)][Math.round(x)];
        }
        var ents = this.ents = [];

        _.times(h, function(rownum){
            var row = [];
            land.push(row);
            _.times(w, function(colnum){
                row.push(0);
            })
        })

        // generating land
        _.times(w, function(x){
            var maxY = Math.sin(x / 50) * 50 + 200;
            _.times(h, function(y){
                land[y][x] = (y <= maxY) ? 1 : 0;
            })
        })
        // _.times(w, function(x){
        //     _.times(20, function(y){
        //         land[y+260+Math.floor(x*0.02)][x] = 1;
        //     })
        // })

        land.lastModified = Date.now();
    }
    World.prototype.addEntity = function(ent){
        this.ents.push(ent);
        ent.world = this;
    }
    World.prototype.destroyEntity = function(ent){
        // TODO - GIVE EACH ENTITY A UUID AND DROP ARRAY IN FAVOR OF FAST HASH TABLE
        var idx = this.ents.indexOf(ent);
        if (idx == -1) return;
        this.ents.splice(idx, 1)
    }
    return World;
});
