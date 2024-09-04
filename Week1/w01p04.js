"use strict";

// Note to self, you cannot call them var inside the init()
// function if you have globally declared them as vars... !!!

var gl;
var vertices;
var theta = 1; // Initial theta angle
var uColor;
var thetaLoc;

window.onload = function init() {
    // Make Canvas etc...
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

   // Quadrilateral vertices
vertices = [
    vec2(-0.5,  0.5),  // Top-left
    vec2( 0.5,  0.5),  // Top-right
    vec2(-0.5, -0.5),  // Bottom-left
    vec2( 0.5, -0.5)   // Bottom-right
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
    thetaLoc = gl.getUniformLocation(program, "theta");

    // Load the vertex positions into the GPU    
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Load the colors into the GPU
    uColor = gl.getUniformLocation(program, "uColor");
    gl.uniform4fv(uColor, [1.0, 1.0, 1.0, 1.0]); // White

    // Render the points
    render();
};


function render() { 
    theta += 0.01;
    gl.uniform1f(thetaLoc, theta);

    gl.clear(gl.COLOR_BUFFER_BIT);
    if (vertices && vertices.length > 0) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length);
    } else {
        console.error("There are issues with the Points array.");
    }
    requestAnimationFrame(render); // Refresh next display time when called ~60fps
    // Another frame rate could be used if we set a timer, e.g. (Angel p. 105, ch. 3.5)
    // function render() {
    //     setTimeout(function() {
    //         requestAnimFrame(render);
    //         gl.clear(gl.COLOR_BUFFER_BIT);
    //         theta += 0.1;
    //         gl.uniform1f(thetaLoc, theta);
    //         gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    //     }, 100);
    // }

 }
