"use strict";

// Note to self, you cannot call them var inside the init()
// function if you have globally declared them as vars... !!!
var gl;
var points = [];
const maxPoints = 3;

window.onload = function init() {
    // Make Canvas etc...
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    //  Configure WebGL //
    gl.viewport(0, 0, canvas.width, canvas.height);
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

    // Attach event listener for mouse clicks on the canvas
    canvas.addEventListener("click", function(event) {

        // Prevent adding more points than the max
        if (points.length >= maxPoints) {
            points = [];
        }
        
        // Accounts for position of canvas relative to browser's viewport
        var rect = event.target.getBoundingClientRect();

        // Mouse coordinates relative to the canvas
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;

        // Convert the coordinates to clip space ([-1, 1])
        var clipX = 2 * x / canvas.width - 1;
        var clipY = 2 * (canvas.height - y) / canvas.height - 1;

        points.push(vec2(clipX, clipY));
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

        render();
    });
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