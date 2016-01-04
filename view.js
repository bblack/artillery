define(function(require){
    var landColor = [0, 128, 0, 255];
    var skyColor = [160, 192, 255, 255];

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

    function putPixel(img, w, h, x, y, rgba) {
        var idx = (y*w + x) * 4;
        if (img.data[idx + 0] != rgba[0]) img.data[idx + 0] = rgba[0];
        if (img.data[idx + 1] != rgba[1]) img.data[idx + 1] = rgba[1];
        if (img.data[idx + 2] != rgba[2]) img.data[idx + 2] = rgba[2];
        if (img.data[idx + 3] != rgba[3]) img.data[idx + 3] = rgba[3];
    };

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
                        var rgba = self.world.land[y][x] ? landColor : skyColor;
                        putPixel(self.landImageData, self.w, self.h, x,
                            self.h - y - 1, rgba);
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
    return View;
});
