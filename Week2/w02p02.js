
"use strict";

var gl;
var points = [];
var colors = [];
var clearColor = [0.3921, 0.5843, 0.9294, 1.0]; // Default to Cornflower blue
var selectedPointColor = [0.0, 0.0, 0.0, 1.0]; // Default to black
var maxPoints = 1000; // Default to "unlimited"
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
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var colorBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

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

        points.push(vec2(clipX, clipY));
        colors.push(vec4(...selectedPointColor));

        gl.bindBuffer(gl.ARRAY_BUFFER, pointBufferId);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

        render();
    });

    clearButton.addEventListener("click", function() {
        points = [];
        colors = [];

        gl.bindBuffer(gl.ARRAY_BUFFER, pointBufferId);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

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
                clearColor = [0.3921, 0.5843, 0.9294, 1.0];
                break;
        }

        gl.clearColor(...clearColor);
        gl.clear(gl.COLOR_BUFFER_BIT);
        render();   
    });

    pointColorChoice.addEventListener("change", function() {
        var color = pointColorChoice.value;
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
    });
};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Draw all points
    if (points && points.length > 0) {
        gl.drawArrays(gl.POINTS, 0, points.length);
    }

    // Draw triangles if in triangle mode
    if (currentMode === "triangle") {
        const numTriangles = Math.floor(points.length / 3);
        for (let i = 0; i < numTriangles; i++) {
            const startIdx = i * 3;
            gl.drawArrays(gl.TRIANGLES, startIdx, 3);
        }
    }
}