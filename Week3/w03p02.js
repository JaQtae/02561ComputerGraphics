// indices are connections between all points, see. p168 of book
const indices_line = [
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
        
const vertexColors = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 1.0, 1.0, 1.0),  // cyan
    vec4(1.0, 1.0, 1.0, 1.0)   // white
];

var numVertices = indices_line.length;
var v, vLoc, pLoc, mLoc;

const T = [
    translate(0, 0, 0),
    translate(-1.6, 0, 0), // Translate to the left
    translate(1.6, 0, 0)  // Translate to the right
];

const R = [
    rotate(0, [1, 0, 0]), 
    rotate(45, [0, 1, 0]), // Rotate around y-axis
    mult(rotate(20, [1, 0, 0]), rotate(20, [0, 1, 0])), // Rotate x @ y (right + tilt down)
];

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas); 
    if (!gl) { 
        alert("WebGL isn't available"); 
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.enable(gl.DEPTH_TEST);

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
    vLoc = gl.getUniformLocation(program, 'viewMatrix')
    pLoc = gl.getUniformLocation(program, 'projectionMatrix');
    mLoc = gl.getUniformLocation(program, 'modelMatrix');

    // [x,y,z]
    const eye = vec3(0, 0, 6); // Direction of camera
    const at = vec3(0, 0, 0); // Up vector
    const up = vec3(0.0, 1.0, 0.0); // Camera position

    console.log(eye);
    console.log(at);
    console.log(up);
    v = lookAt(eye, at, up); // view matrix

    const FoV = 45; // Field of View
    const aspect = canvas.width / canvas.height;
    const near = 0.01;
    const far = 10;

    p = perspective(FoV, aspect, near, far); // projection matrix

    render();
};


function one_point() {
    // Transforms
    m = mult(T[0], R[0]);
    gl.uniformMatrix4fv(mLoc, false, flatten(m));
    gl.drawElements(gl.LINES, numVertices, gl.UNSIGNED_BYTE, 0);
}

function two_point() {
    // Transforms
    m = mult(T[1], R[1]);
    gl.uniformMatrix4fv(mLoc, false, flatten(m));
    gl.drawElements(gl.LINES, numVertices, gl.UNSIGNED_BYTE, 0); // 2nd cube
}

function three_point() {
    // Transforms
    m = mult(T[2], R[2]);
    gl.uniformMatrix4fv(mLoc, false, flatten(m));
    gl.drawElements(gl.LINES, numVertices, gl.UNSIGNED_BYTE, 0);
}
    
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniformMatrix4fv(pLoc, false, flatten(p));
    gl.uniformMatrix4fv(vLoc, false, flatten(v));

    one_point();
    two_point();
    three_point();

    requestAnimationFrame(render);
}