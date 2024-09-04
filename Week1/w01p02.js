"use strict";

// Note to self, you cannot call them var inside the init()
// function if you have globally declared them as vars... !!!
var gl;
var points;

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

    //  Configure WebGL //
    // Set the viewport to match the canvas size
    gl.viewport(0, 0, canvas.width, canvas.height);
    // Clear the canvas with cornflower blue color
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);  // RGBA values
    gl.clear(gl.COLOR_BUFFER_BIT);

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Load the data into the GPU    
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Render the points
    render();
};

function render() {
    // Ensure points is defined before trying to render
    if (points && points.length > 0) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, points.length);
    } else {
        console.error("There are issues with the Points array.");
    }
}