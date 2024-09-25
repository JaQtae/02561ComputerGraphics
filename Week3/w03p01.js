var indices = [
    1, 0, 3,
    3, 2, 1,
    2, 3, 7, 
    7, 6, 2, 
    3, 0, 4, 
    4, 7, 3, 
    6, 5, 1, 
    1, 2, 6, 
    4, 5, 6, 
    6, 7, 4, 
    5, 4, 0, 
    0, 1, 5
];
// indices are connections between all points, see. p168 of book
var indices_line = [
1,0,   1,2,   2,3,  0,3,    // Face A (front)
3,7,   7,6,   2,6,          // Face B (right)
0,4,   1,5,   5,4,          // Face C (left) 
5,6,   4,7,                 // Face D (bottom) 
];

//   v5--------v6
//  / |        / |
// v1--------v2  |
// |  |       |  |
// |  |       |  |
// |  v4------|--v7
// | /        | /
// v0--------v3

// Figure 4.30 p. 168
const vertices = [
vec4( -0.5, -0.5,  0.5, 1.0 ), // Front
vec4( -0.5,  0.5,  0.5, 1.0 ),
vec4(  0.5,  0.5,  0.5, 1.0 ),
vec4(  0.5, -0.5,  0.5, 1.0 ),
vec4( -0.5, -0.5, -0.5, 1.0 ), // Back
vec4( -0.5,  0.5, -0.5, 1.0 ),
vec4(  0.5,  0.5, -0.5, 1.0 ),
vec4(  0.5, -0.5, -0.5, 1.0 )
];
     
var vertexColors = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 1.0, 1.0, 1.0),  // cyan
    vec4(1.0, 1.0, 1.0, 1.0)   // white
];

var theta = [ 0, 0, 0 ];
var numVertices = indices_line.length;
var rotationMatrix;
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var v, vLoc;

window.onload = function init() 
{
var canvas = document.getElementById("gl-canvas");
gl = WebGLUtils.setupWebGL(canvas); 
if (!gl) { alert("WebGL isn't available"); }

gl.enable(gl.DEPTH_TEST);

gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
gl.enable(gl.DEPTH_TEST);

// Alternate way in JS to create a rotation matrix...

// var angle = 45; // deg
// var axis = [1, 1, 1];
// var axis = normalize(axis); 
// var rotationMatrix = mat4();
// rotationMatrix = mult(rotationMatrix, rotate(angle, axis));
// for (i=0; i<vertices.length; i++) {
//     vertices[i] = mult(rotationMatrix, vertices[i]);
// };

var program = initShaders(gl, "vertex-shader", "fragment-shader");
gl.useProgram(program);

// Vertex buffer(s)
var vBuffer = gl.createBuffer(); 
gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

var vPosition = gl.getAttribLocation(program, "vPosition");
gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(vPosition);

// Index buffer
var iBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices_line), gl.STATIC_DRAW);

// Color buffer(s)
var cBuffer = gl.createBuffer(); 
gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW);

var vColor = gl.getAttribLocation(program, "vColor");
gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(vColor);

// View Matrix location
vLoc = gl.getUniformLocation(program, 'modelViewMatrix')
const at = vec3(1.0, 1.0, 1.0);
const up = vec3(0.0, 1.0, 0.0);
const eye = vec3(0,0,0);
v = lookAt(eye, at, up); // view matrix

render();
};

function render() {
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
gl.uniformMatrix4fv(vLoc, false, flatten(v));
gl.drawElements(gl.LINES, numVertices, gl.UNSIGNED_BYTE, 0); // Lines instead of Triangles
requestAnimationFrame(render);
}