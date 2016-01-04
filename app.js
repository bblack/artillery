requirejs.config({
    paths: {
        'eventemitter2': 'bower_components/eventemitter2/lib/eventemitter2',
        victor: 'bower_components/victor/build/victor'
    }
});

define(function(require){
var Victor = require('victor');
var World = require('./world');
var Sim = require('./sim');

var Entity = function(){}

var Tank = function(){
    this.position = new Victor(0, 0);
    this.velocity = {x: 0, y: 0};
    this.color = 'red';
}
Tank.__proto__ = Entity;
Tank.prototype.draw = function(canvas){
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, 8, 0, 2*Math.PI);
    ctx.fill();
}
Tank.prototype.tick = function(){
    var x = Math.floor(this.position.x);
    var y = Math.floor(this.position.y);
    // TODO: remove this in favor of real collision detection/resolution
    if (this.world.land[y][x]) {
        this.velocity = {x: 0, y: 0};
    }
}

var Shell = function(){
    if (arguments.length == 2) {
        this.position.x = arguments[0];
        this.position.y = arguments[1];
    } else if (arguments.length == 0) {
        this.position.x = 0;
        this.position.y = 0;
    } else {
        throw 'wrong constructor signature';
    }

    this.velocity = {x: 0, y: 0};
    this.blastRadius = 10;
};
Shell.__proto__ = Entity;
Shell.prototype.draw = function(canvas) {
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(this.position.x - 1, this.position.y - 1, 3, 3);
}
Shell.prototype.tick = function(){
    var x = Math.floor(this.position.x);
    var y = Math.floor(this.position.y);
    // TODO - OPERATE ONLY ON VALID X,Y
    if (this.world.land[y][x]) {
        for (var col = x - this.blastRadius; col < x + this.blastRadius; col++) {
            for (var row = y - this.blastRadius; row < y + this.blastRadius; row++) {
                if (Math.pow(x - col, 2) + Math.pow(y - row, 2) < Math.pow(this.blastRadius, 2))
                    this.world.land[row][col] = 0;
            }
        }
        this.world.land.lastModified = Date.now();
        this.world.destroyEntity(this);
    }
}

function View(canvas, world){
    this.frametime = 1000 / 60;
    this.canvas = canvas;
    this.w = this.canvas.width;
    this.h = this.canvas.height;
    this.world = world;
    this.ctx = canvas.getContext('2d');
    this.ctx.transform(1, 0, 0, -1, 0, canvas.height);
    this.landImageData = this.ctx.createImageData(this.w, this.h);

    this.vline = {canvas: document.createElement('canvas')};
    this.vline.canvas.width = this.w;
    this.vline.canvas.height = this.h;
    this.vline.ctx = this.vline.canvas.getContext('2d');

    var self = this;

    setInterval(function(){
        self.invalidate();
    }, self.frametime);
};

var putPixel = function(img, w, h, x, y, rgba) {
    var idx = (y*w + x) * 4;
    if (img.data[idx + 0] != rgba[0]) img.data[idx + 0] = rgba[0];
    if (img.data[idx + 1] != rgba[1]) img.data[idx + 1] = rgba[1];
    if (img.data[idx + 2] != rgba[2]) img.data[idx + 2] = rgba[2];
    if (img.data[idx + 3] != rgba[3]) img.data[idx + 3] = rgba[3];
};

var landColor = [0, 128, 0, 255];
var skyColor = [160, 192, 255, 255];

View.prototype.drawVLines = function(){
    var self = this;
    var ctx = self.vline.ctx;
    ctx.clearRect(0, 0, self.w, self.h);
    ctx.beginPath();
    self.world.ents.forEach(function(ent){
        ctx.moveTo(ent.position.x, ent.position.y);
        ctx.lineTo(ent.position.x + ent.velocity.x, ent.position.y + ent.velocity.y);
    });
    ctx.stroke();
    ctx.closePath();
    self.ctx.drawImage(self.vline.canvas, 0, 0);
};

View.prototype.invalidate = function(){
    var self = this;

    window.requestAnimationFrame(function(){
        var frameDuration = self.lastFrameTime ? Date.now() - self.lastFrameTime : 0;
        self.lastFrameTime = Date.now();
        // $('#viewfps').text((1000/frameDuration).toFixed(1));

        // draw land
        if (self.world.land.lastModified != self.lastLandDrawn) {
            var x, y;
            for (x = 0; x < self.w; x++) {
                for (y = 0; y < self.h; y++) {
                    var isLand = self.world.land[y][x];
                    var rgba = isLand ? landColor : skyColor;

                    putPixel(self.landImageData,
                        self.w,
                        self.h,
                        x,
                        self.h - y - 1,
                        rgba);
                };
            };
            self.lastLandDrawn = self.world.land.lastModified;
        }

        self.ctx.putImageData(self.landImageData, 0, 0);

        // draw ents
        self.world.ents.forEach(function(ent){
            ent.draw(self.canvas);
        });

        self.drawVLines();
    });
};

$(function(){
    var canvas = $('canvas')[0];
    var world = new World();

    // var shell = new Shell(200, 200);
    // shell.velocity.y = 10;
    // shell.velocity.x = 5;
    // this.addEntity(shell);

    var tank = new Tank();
    tank.position = new Victor(301, 300);
    world.addEntity(tank);

    var view = new View(canvas, world);
    var sim = new Sim(world, view);
    sim.start();
})
});
