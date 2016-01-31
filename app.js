requirejs.config({
    paths: {
        'eventemitter2': 'bower_components/eventemitter2/lib/eventemitter2',
        underscore: 'bower_components/underscore/underscore',
        victor: 'bower_components/victor/build/victor'
    }
});

define(function(require){
var Victor = require('victor');
var World = require('./world');
var Sim = require('./sim');
var View = require('./view');

function Entity(){}

var Tank = function(){
    this.position = new Victor(0, 0);
    this.velocity = new Victor(0, 0);
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
Tank.prototype.tick = function(){};

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

    this.velocity = new Victor(0, 0);
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
