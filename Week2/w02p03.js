"use strict";

var canvas
var gl
var points
var program

const colors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),   // cyan
    vec4( 0.3921, 0.5843, 0.9294, 1.0) // Cornflower
];

window.onload = function init() {
    // WebGL setup
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    // Initialize shaders etc.
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
// ======================================================================== //

    // From slides (week 2)
    var max_verts = 10000; // Pre-allocation of vertex buffer (?? TA Julian verify)
    var vBuffer = gl.createBuffer();
    // User input vars
    var shapeChoice = 0;
    var clickNr = 0;
    var mousepos = vec2(0.0, 0.0);
    // Points, respective colors and bookkeeping variables
    var p = [];
    var color = vec4(0.0, 0.0, 0.0, 1.0);
    var color_list = [];
    var index = 0; var numPoints = 0;

    // Pre-allocate vertex buffer (vec2)
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec2'], gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // And color buffer (vec4)
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec4'], gl.STATIC_DRAW);
    var vColor = gl.getAttribLocation(program, "pColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // From slides (week 2). Mousetracking -- Adds correction for canvas position relative to viewport
    canvas.addEventListener("mousemove", function(ev){
        var bbox = ev.target.getBoundingClientRect();
        mousepos = vec2(
            2*(ev.clientX - bbox.left)/canvas.width - 1, 
            2*(canvas.height - ev.clientY + bbox.top - 1)/canvas.height - 1
        );
    });

    canvas.addEventListener("click", function(ev){
    // Drawing logic for shapes: [Point, Triangle, Circle]
        if (shapeChoice === 0){
            drawPoint(mousepos, color, cBuffer, vBuffer);
        } else if (shapeChoice === 1){
            drawTriangle(mousepos, color, vBuffer, cBuffer);
        }
        
        render(gl, numPoints);
    });


    // Button event listeners
    var clearMenu = document.getElementById("clearMenu");
    var clearButton = document.getElementById("clearButton");
    

    clearButton.addEventListener("click", function(ev){
        var bgcolor = colors[clearMenu.selectedIndex];
        index = 0;
        numPoints = 0;
        clickNr = 0;
        gl.clearColor(bgcolor[0], bgcolor[1], bgcolor[2], bgcolor[3]);
        gl.clear(gl.COLOR_BUFFER_BIT);
        render(gl, numPoints);
    });

    var ColorMenu = document.getElementById("colorMenu");
    ColorMenu.addEventListener("click", function(ev){
        color = colors[ColorMenu.selectedIndex];
    })

    var pointButton = document.getElementById("drawPoint")
    pointButton.addEventListener("click", function(ev){
        shapeChoice = 0;
    })
    var triangleButton = document.getElementById("drawTriangle")
    triangleButton.addEventListener("click", function(ev){
        shapeChoice = 1;
    })


    // Functions
    function drawPoint(mousepos, color, cBuffer, vBuffer) {
        var x = mousepos[0]; // Capture mouse position
        var y = mousepos[1];
        var new_pos = [ 
            vec2(x+0.05, y+0.05), vec2(x+0.05, y-0.05), vec2(x-0.05, y+0.05),
            vec2(x+0.05, y-0.05), vec2(x-0.05, y+0.05), vec2(x-0.05, y-0.05), // two triangles representing square  --> vBuffer (6 vertices)
        ];
        var new_col = [color, color, color, color, color, color];
    
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec4'], flatten(new_col));
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(new_pos));
        index += 6;
        numPoints = Math.max(numPoints, index); 
        index %= max_verts;
    }

    function drawTriangle(mousepos, color, vBuffer, cBuffer) {
        // Capture user inputs
        p.push(mousepos);
        color_list.push(color);

        // Check if we have enough points to draw the triangle
        if (p.length < 3) {
            drawPoint(mousepos, vec4(0.0, 0.0, 0.0, 0.5)); // Temporary points (vertices #1 and #2)
        } else {
            // Clear temporary points from buffer
            index -= 12;
            numPoints -= 12;

            // Update buffers
            gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, index * sizeof['vec4'], flatten(color_list));
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, index * sizeof['vec2'], flatten(p));

            // Add the 3 vertices of the triangle and update index/etc. for next draw!
            index += 3; 
            numPoints = Math.max(numPoints, index); 
            index %= max_verts;

            p = []; 
            color_list = [];
        }
    }

    function render(gl, numPoints)
    {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, numPoints);
    }
    
    render(gl, numPoints);
}
