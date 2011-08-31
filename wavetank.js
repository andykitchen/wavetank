var canvas;
var context;
var draw_canvas;
var draw_context;

var outputImage;

var output;
var grid_0;
var grid_1;
var grid_2;

var width  = 240;
var height = 180;

function init() {
  canvas  = document.createElement("canvas");
  context = canvas.getContext("2d");
  draw_canvas  = document.getElementById("draw-canvas")
  draw_context = draw_canvas.getContext("2d");
  
  canvas.width  = width;
  canvas.height = height;
  
  draw_canvas.onclick = clickCanvas;
  
  outputImage = context.createImageData(width, height);
  
  grid_0 = new Array(width * height);
  grid_1 = new Array(width * height);
  grid_2 = new Array(width * height);
  output = new Array(width * height);

  zeroArray(grid_0);
  zeroArray(grid_1);
  zeroArray(grid_2);
  zeroArray(output);

  window.setInterval(animate, 8);
}

function clickCanvas(e) {
  var x;
  var y;
  if (e.pageX != undefined && e.pageY != undefined) {
  	x = e.pageX;
  	y = e.pageY;
  }
  else {
  	x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
  	y = e.clientY + document.body.scrollTop  + document.documentElement.scrollTop;
  }

  x -= draw_canvas.offsetLeft;
  y -= draw_canvas.offsetTop;

  x *= canvas.width/draw_canvas.width;
  y *= canvas.height/draw_canvas.height;

  gaussBumpArray = function(gx, gy, val) {
    if(gx == 0 || gx == width-1 || gy == 0 || gy == height-1) {
      return val;
    }
    
    var dx = gx - x;
    var dy = gy - y;
    var c  = 5;
    
    var r  = Math.sqrt(dx*dx + dy*dy);
    var z  = 10.0*Math.exp(-(r*r)/(2*c*c));
    
    return val + z;
  }

  mapGrid(grid_0, gaussBumpArray);
  mapGrid(grid_1, gaussBumpArray);
}

function mapGrid(grid, f) {
  for (var y = 0; y < height; y += 1) {
    for (var x = 0; x < width; x += 1) {
      var val = grid[y*width + x];
      grid[y*width + x] = f(x, y, val);
    }
  }
}

function zeroArray(grid) {
  mapGrid(grid, function(x, y) { return 0.0; });
}

function cornerBlockArray(grid) {
  mapGrid(grid, function(x, y) {
    if(y < height/2 && x < width/2) {
      return 1.0;
    } else {
      return 0.0;
    }
  });
}

var phys_frame_count = 0;
function animate() {
  var w = width, h = height;
  
  for (var y = 1; y < h-1; y += 1) {
    for (var x = 1; x < w-1; x += 1) {
      var i = y*w + x;

      var l = 0.7;

      var u0 = grid_0[i];
      var u1 = grid_1[i];
      var a  = grid_0[i - 1];
      var b  = grid_0[i + 1];
      var c  = grid_0[i - w];
      var d  = grid_0[i + w];

      // output[i] = l*l*(a + b + c + d - 4*u0) - u1 + 2*u0;
      output[i] = l*l*(a + b + c + d - 4*u0) - u1 + 2*u0 - 0.01*(u0 - u1);
    }
  }

  // for (var y = 0; y < h-1; y += 1) {
  //   var x = 0;
  //   var i = y*w + x;
  //   output[i] = 2*grid_0[i + 1] - grid_1[i + 2];
  // 
  //   var x = w - 1;
  //   var i = y*w + x;
  //   output[i] = 2*grid_0[i - 1] - grid_1[i - 2];
  // }
  // 
  // for (var x = 0; x < w-1; x += 1) {
  //   var y = 0;
  //   var i = y*w + x;
  //   output[i] = 2*grid_0[i + w] - grid_1[i + 2*w];
  //       
  //   var y = h - 1;
  //   var i = y*w + x;
  //   output[i] = 2*grid_0[i - w] - grid_1[i - 2*w];
  // }

  // if(phys_frame_count % 2 == 0) {
    // phys_frame_count = 0;
    var outputData = outputImage.data;
    for (var y = 0; y < h; y += 1) {
      for (var x = 0; x < w; x += 1) {
        var i = (y*w + x)*4;

        outputData[i + 0] = tonemap_r(output[y*w + x]) * 255;
        outputData[i + 1] = tonemap_g(output[y*w + x]) * 255;
        outputData[i + 2] = tonemap_b(output[y*w + x]) * 255;

        outputData[i + 3] = 255; // alpha
      }
    }

    context.putImageData(outputImage, 0, 0);
    draw_context.drawImage(canvas, 0, 0,
                           draw_canvas.width,
                           draw_canvas.height);
  // }
  // phys_frame_count += 1;

  var tmp = grid_2;
  grid_2 = grid_1;
  grid_1 = grid_0;
  grid_0 = output;
  output = tmp;
}

function prescale(x) {
  return clamp(Math.abs(x));
}

function tonemap_r(x) {
  x = prescale(x);
  return clamp(-8.0*x*x + 14.0*x - 5.0);
}

function tonemap_g(x) {
  x = prescale(x);
  return clamp(1.0/3.0*(x*(28.0 + x*(-92.0 + x*(128.0 + x*-64.0)))));
}

function tonemap_b(x) {
  x = prescale(x);
  return clamp(-8.0*x*x + 2.0*x + 1,0,1);
}

function clamp(x) {
  if(x > 1.0) {
    return 1.0;
  } else if(x < 0.0) {
    return 0.0;
  } else {
    return x;
  }
}
