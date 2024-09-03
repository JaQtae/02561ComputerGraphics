"use strict";

// Note to self, you cannot call them var inside the init()
// function if you have globally declared them as vars... !!!

var gl;
var points;
var colors;

window.onload = function init() {
    // Make Canvas etc...
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    // Where my points are placed
    points = [
        vec2(0, 0),    // Middle?
        vec2(1, 0),    // Middle-Right?
        vec2(1, 1)     // Top-right?
    ];

    colors = [
      vec4(1,0,0,1), // Red
      vec4(0,1,0,1), // Green
      vec4(0,0,1,1) // Blue

    ];

    //  Configure WebGL //
    // Set the viewport to match the canvas size
    gl.viewport(0, 0, canvas.width, canvas.height);
    // Clear the canvas with cornflower blue color
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);  // cornflower blue
    gl.clear(gl.COLOR_BUFFER_BIT);

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Load the vertex positions into the GPU    
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Load the colors into the GPU
    var colorBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // Render the points
    render();
};

function render() {
    // Ensure points is defined before trying to render
    if (points && points.length > 0) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, points.length);
        // gl.drawArrays(gl.POINTS, 0, points.length); // gl.POINTS makes it like a square. Can't in WebGPU!
    } else {
        console.error("There are issues with the Points array.");
    }
}
