var World = function(){
    var w = this.width = 640;
    var h = this.height = 480;
    var land = this.land = [];

    _.times(h, function(rownum){
        var row = [];
        land.push(row);
        _.times(w, function(colnum){
            row.push(0);
        })
    })

    var surfaceGen = function(x) {
        return Math.sin(x / 50) * 50 + 200;
    };

    // generating land
    _.times(w, function(x){
        var maxY = surfaceGen(x);
        _.times(h, function(y){
            land[y][x] = (y <= maxY) ? 1 : 0;
        })
    })
}

var Sim = function(world, view){
    this.frametime = 1000 / 30; // ms per frame

    if (!(world instanceof World))
        throw 'Invalid world passed';

    if (!(view instanceof View))
        throw 'Invalid view passed';

    this.world = world;
    this.view = view;
};

Sim.prototype.tick = function(){
    // simulate
    this.view.invalidate(); // should be up to view and its timer
}

Sim.prototype.start = function(){
    var self = this;
    setInterval(function(){
        self.tick();
    }, self.framtime);
}

var View = function(canvas, world){
    this.canvas = canvas;
    this.world = world;
    this.ctx = canvas.getContext('2d');
    this.ctx.transform(1, 0, 0, -1, 0, canvas.height);
};

var putPixel = function(img, w, h, x, y, r, g, b, a) {
    var idx = (y*w + x) * 4;
    img.data[idx + 0] = r;
    img.data[idx + 1] = g;
    img.data[idx + 2] = b;
    img.data[idx + 3] = a;
};

View.prototype.invalidate = function(){
    var self = this;

    // draw land
    var imageData = self.ctx.createImageData(self.canvas.width, self.canvas.height);

    _.times(self.canvas.width, function(x){
        _.times(self.canvas.height, function(y){
            var isLand = self.world.land[y][x];
            var rgba = isLand ? [0, 128, 0, 255] : [160, 192, 255, 255];

            putPixel(imageData,
                self.canvas.width,
                self.canvas.height,
                x,
                self.canvas.height - y - 1,
                rgba[0],
                rgba[1],
                rgba[2],
                rgba[3]);
        });
    });

    self.ctx.putImageData(imageData, 0, 0);
};

$(function(){
    var canvas = $('canvas')[0];
    var world = new World();
    var view = new View(canvas, world);
    var sim = new Sim(world, view);
    sim.start();
})
