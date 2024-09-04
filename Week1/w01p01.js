"use strict";

// Note to self, you cannot call them var inside the init()
// function if you have globally declared them as vars... !!!

var gl;

window.onload = function init() {
    // Make Canvas etc...
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    //  Configure WebGL //
    // Set the viewport to match the canvas size
    gl.viewport(0, 0, canvas.width, canvas.height);
    // Clear the canvas with cornflower blue color
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);  // cornflower blue
    gl.clear(gl.COLOR_BUFFER_BIT);

};

