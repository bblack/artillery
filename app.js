$(function(){
    var canvas = $('canvas')[0];
    var w = canvas.width;
    var h = canvas.height;
    var land = [];
    var ctx = canvas.getContext('2d');

    ctx.transform(1, 0, 0, -1, 0, h);

    _.times(h, function(rownum){
        var row = [];
        land.push(row);
        _.times(w, function(colnum){
            row.push(0);
        })
    })

    var surfaceGen = function(x) {
        return Math.sin(x / 50) * 50 + 200;
    }

    // generating land
    _.times(w, function(x){
        var maxY = surfaceGen(x);
        _.times(h, function(y){
            land[y][x] = (y <= maxY) ? 1 : 0;
        })

    })

    // drawing land
    ctx.fillStyle = 'green';
    _.times(w, function(x){
        _.times(h, function(y){
            var isLand = land[y][x];
            if (isLand) {
                ctx.fillRect(x, y, 1, 1);
            }
        })
    })
})
