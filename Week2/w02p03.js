"use strict";

var gl;
var unlimitedPoints = []; // Points drawn in "unlimited" mode
var trianglePoints = []; // Points drawn in "triangle" mode
var unlimitedColors = []; // Colors for unlimited points
var triangleColors = []; // Colors for triangle points
var clearColor = [0.3921, 0.5843, 0.9294, 1.0]; // Default to Cornflower blue
var selectedPointColor = [0.0, 0.0, 0.0, 1.0]; // Default to black
var currentMode = "unlimited"; // "unlimited" or "triangle"

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    var clearButton = document.getElementById("clear-canvas");
    var colorChoice = document.getElementById("color-choice");
    var pointColorChoice = document.getElementById("point-color-choice");
    var unlimitedButton = document.getElementById("unlimited-mode");
    var triangleButton = document.getElementById("triangle-mode");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(...clearColor); 
    gl.clear(gl.COLOR_BUFFER_BIT);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var pointBufferId = gl.createBuffer();
    var colorBufferId = gl.createBuffer();

    function updateBuffers() {
        // Helper function for brevity.
        // Combine points and colors for drawing
        var combinedPoints = unlimitedPoints.concat(trianglePoints);
        var combinedColors = unlimitedColors.concat(triangleColors);
        gl.bindBuffer(gl.ARRAY_BUFFER, pointBufferId);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(combinedPoints), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(combinedColors), gl.STATIC_DRAW);
    }

    var vPosition = gl.getAttribLocation(program, "vPosition");
    var vColor = gl.getAttribLocation(program, "vColor");
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBufferId);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0); //vec2
    gl.enableVertexAttribArray(vPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0); //vec4
    gl.enableVertexAttribArray(vColor);

    canvas.addEventListener("click", function(event) {
        var rect = event.target.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;

        var clipX = 2 * x / canvas.width - 1;
        var clipY = 2 * (canvas.height - y) / canvas.height - 1;

        if (currentMode === "unlimited") {
            if (unlimitedPoints.length < 1000) {
                unlimitedPoints.push(vec2(clipX, clipY));
                unlimitedColors.push(vec4(...selectedPointColor));
                updateBuffers();
                render();
            }
        } else if (currentMode === "triangle") {
            trianglePoints.push(vec2(clipX, clipY));
            // Log the number of triangle vertices
            console.log(trianglePoints.length % 3);
            triangleColors.push(vec4(...selectedPointColor));
            updateBuffers();
            render();
        }
    });

    clearButton.addEventListener("click", function() {
        unlimitedPoints = [];
        trianglePoints = [];
        unlimitedColors = [];
        triangleColors = [];
        updateBuffers();
        gl.clearColor(...clearColor); 
        gl.clear(gl.COLOR_BUFFER_BIT);
        render();
    });

    unlimitedButton.addEventListener("click", function () {
        currentMode = "unlimited";
        render();
    });

    triangleButton.addEventListener("click", function () {
        currentMode = "triangle";
        render();
    });

    colorChoice.addEventListener("change", function() {
        var color = colorChoice.value;
        colorOptions(color);

        gl.clearColor(...clearColor);
        gl.clear(gl.COLOR_BUFFER_BIT);
        render();   
    });

    pointColorChoice.addEventListener("change", function() {
        var color = pointColorChoice.value;
        colorOptions(color);
    });
};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw points in unlimited mode
    if (unlimitedPoints.length > 0) {
        gl.drawArrays(gl.POINTS, 0, unlimitedPoints.length);
    }

    // Draw triangles if in triangle mode
    if (trianglePoints.length >= 3) {
        const numTriangles = Math.floor(trianglePoints.length / 3);
        for (let i = 0; i < numTriangles; i++) {
            const startIdx = unlimitedPoints.length + i * 3;
            gl.drawArrays(gl.TRIANGLES, startIdx, 3);
        }
    }
}

function colorOptions(color) {
    switch (color) {
        case "black":
            selectedPointColor = [0.0, 0.0, 0.0, 1.0];
            break;
        case "red":
            selectedPointColor = [1.0, 0.0, 0.0, 1.0];
            break;
        case "yellow":
            selectedPointColor = [1.0, 1.0, 0.0, 1.0];
            break;
        case "green":
            selectedPointColor = [0.0, 1.0, 0.0, 1.0];
            break;
        case "magenta":
            selectedPointColor = [1.0, 0.0, 1.0, 1.0];
            break;
        case "cyan":
            selectedPointColor = [0.0, 1.0, 1.0, 1.0];
            break;
        case "white":
            selectedPointColor = [1.0, 1.0, 1.0, 1.0];
            break;
        case "cornflowerblue":
            selectedPointColor = [0.3921, 0.5843, 0.9294, 1.0];
            break;
    }   
}
