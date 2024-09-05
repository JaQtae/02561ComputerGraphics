"use strict";

// Note to self, you cannot call them var inside the init()
// function if you have globally declared them as vars... !!!

var gl;
var vertices = []; // these change, so we need to update this list.
var uColor;
var translationLoc;
var bounceStart = -1.0; // Bottom of the canvas
var bounceHeight = 1.2;
var bounceSpeed = 0.2;
var time = 0.0; //  Track time for animation

// Circle variables
var center = vec2(0.0, 0); // where the circle center initializes from
var radius = 0.4;
var numVertices = 100;

window.onload = function init() {
    // Make Canvas etc...
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    // Circle w. TRIANGLE_FAN
    generateCircleVertices(center, radius, numVertices); 
    

    //  Configure WebGL //
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);  // cornflower blue
    gl.clear(gl.COLOR_BUFFER_BIT);

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

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

    // Translation uniform for bouncing
    translationLoc = gl.getUniformLocation(program, "uTranslation");

    // Render the points
    render();
};


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    time += 0.02; // Update bounce time

    // Calculate the y-translation using sine wave
    // radius (0.4), initHeight(-1.0), bounceHeight(1.0)
    // if to top, add radius/2 to the bounce height, for some reason???
    var bounce = (bounceStart + radius) + (bounceHeight * Math.abs(Math.sin(bounceSpeed * time)));
    gl.uniform2fv(translationLoc, [0.0, bounce]);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length);
    requestAnimationFrame(render);
}


function generateCircleVertices(center, radius, numVertices) {
// Function to generate circle vertices using TRIANGLE_FAN
    vertices.push(center);  // Center of the circle, push = its the first vertex.

    for (var i = 0; i <= numVertices; i++) {
        var angle = (i / numVertices) * 2 * Math.PI;  // Calculate angle for each vertex
        var x = radius * Math.cos(angle);
        var y = radius * Math.sin(angle);
        vertices.push(vec2(x, y));
    }
}
