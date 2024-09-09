"use strict";

// Note to self, you cannot call them var inside the init()
// function if you have globally declared them as vars... !!!
var gl;
var points = [];
var colors = [];
var clearColor = [0.3921, 0.5843, 0.9294, 1.0]; // Default to Cornflower blue
var selectedPointColor = [0.0, 0.0, 0.0, 1.0]; // Default to black
const maxPoints = 3;

window.onload = function init() {
    // Make Canvas etc...
    var canvas = document.getElementById("gl-canvas");
    var clearButton = document.getElementById("clear-canvas");
    var colorChoice = document.getElementById("color-choice");
    var pointColorChoice = document.getElementById("point-color-choice");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    //  Configure WebGL //
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(...clearColor); 
    gl.clear(gl.COLOR_BUFFER_BIT);

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");

    gl.useProgram(program);

    // Load the data into the GPU    
    var pointBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var colorBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program, "vPosition");
    var vColor = gl.getAttribLocation(program, "vColor");
    //Points
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBufferId);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0); //vec2
    gl.enableVertexAttribArray(vPosition);
    //Colors
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0); //vec4
    gl.enableVertexAttribArray(vColor);

    // Attach event listener for mouse clicks on the canvas
    canvas.addEventListener("click", function(event) {

        // Prevent adding more points than the max (3)
        if (points.length >= maxPoints) {
            points = [];
            colors = []; // doesn't change the color of the points selected!! 
        }
        
        // Accounts for position of canvas relative to browser's viewport
        var rect = event.target.getBoundingClientRect();

        // Mouse coordinates relative to the canvas
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;

        // Convert the coordinates to clip space ([-1, 1])
        var clipX = 2 * x / canvas.width - 1;
        var clipY = 2 * (canvas.height - y) / canvas.height - 1;

        console.log("Mouse X, Y: ", x, y);
        console.log("Clip Space X, Y: ", clipX, clipY); // TODO: Remove debugging

        points.push(vec2(clipX, clipY));
        colors.push(vec4(...selectedPointColor));

        // Update the buffer data (POINTS)
        gl.bindBuffer(gl.ARRAY_BUFFER, pointBufferId);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

        // Update COLORS
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

        render();
    });

    // Attach event listener for the clear button
    clearButton.addEventListener("click", function() {
        points = [];
        colors = [];

        // Update the buffer data (POINTS + COLORS). Keeps colors in memory!
        gl.bindBuffer(gl.ARRAY_BUFFER, pointBufferId);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

        gl.clearColor(...clearColor); // updated clearColor
        gl.clear(gl.COLOR_BUFFER_BIT);

        render();
    });

    // Canvas clear color choice
    colorChoice.addEventListener("change", function() {
        var color = colorChoice.value;
        switch (color) {
            case "black":
                clearColor = [0.0, 0.0, 0.0, 1.0];
                break;
            case "red":
                clearColor = [1.0, 0.0, 0.0, 1.0];
                break;
            case "yellow":
                clearColor = [1.0, 1.0, 0.0, 1.0];
                break;
            case "green":
                clearColor = [0.0, 1.0, 0.0, 1.0];
                break;
            case "magenta":
                clearColor = [1.0, 0.0, 1.0, 1.0];
                break;
            case "cyan":
                clearColor = [0.0, 1.0, 1.0, 1.0];
                break;
            case "white":
                clearColor = [1.0, 1.0, 1.0, 1.0];
                break;
            case "cornflowerblue":
                clearColor = [0.3921, 0.5843, 0.9294, 1.0]; // Cornflower blue
                break;
        }

        gl.clearColor(...clearColor);
        gl.clear(gl.COLOR_BUFFER_BIT);
        render();   
    });

    // Point color choice
    pointColorChoice.addEventListener("change", function() {
        var color = pointColorChoice.value;
        switch (color) {
            case "black":
                selectedPointColor  = [0.0, 0.0, 0.0, 1.0];
                break;
            case "red":
                selectedPointColor  = [1.0, 0.0, 0.0, 1.0];
                break;
            case "yellow":
                selectedPointColor  = [1.0, 1.0, 0.0, 1.0];
                break;
            case "green":
                selectedPointColor  = [0.0, 1.0, 0.0, 1.0];
                break;
            case "magenta":
                selectedPointColor  = [1.0, 0.0, 1.0, 1.0];
                break;
            case "cyan":
                selectedPointColor  = [0.0, 1.0, 1.0, 1.0];
                break;
            case "white":
                selectedPointColor  = [1.0, 1.0, 1.0, 1.0];
                break;
        }
        console.log("Selected Point Color: ", selectedPointColor );
    });
};

function render() {
    // Ensure points is defined before trying to render
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (points && points.length > 0) {
        gl.drawArrays(gl.POINTS, 0, points.length);
    } else {
        console.log("The points array has been cleared or is empty.");
    }
}