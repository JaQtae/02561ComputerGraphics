var numSubdivs = 1;
var pointsArray = [];
var v, p, m, vLoc, pLoc, mLoc;
// Transforms
const R = [
    rotate(0, [1, 0, 0]),
    rotate(0, [0, 1, 0]),
    rotate(0, [0, 0, 1])
];
var gl;

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas); 
    if (!gl) { 
        alert("WebGL isn't available"); 
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.CULL_FACE);   // Enable backface culling
    // gl.cullFace(gl.BACK);      // Cull the back faces (default)
    // gl.frontFace(gl.CCW);      // Counter-clockwise winding is the front face (default)
    

    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(gl.program);

    // init
    gl.vBuffer = null;
    initSphere(gl, numSubdivs);

    // Buttons
    document.getElementById("increment").onclick = function(){
        numSubdivs++;
        init();
    };
    document.getElementById("decrement").onclick = function(){
        if(numSubdivs) numSubdivs--;
        init();
    };

    // Vertex buffer(s)
    gl.vBuffer = gl.createBuffer(); 
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    gl.vPosition = gl.getAttribLocation(gl.program, "vPosition");
    gl.vertexAttribPointer(gl.vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.vPosition);

    gl.vColor = gl.getAttribLocation(gl.program, "vColor");
    gl.vertexAttribPointer(gl.vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.vColor);

    // View Matrix location
    vLoc = gl.getUniformLocation(gl.program, 'viewMatrix')
    pLoc = gl.getUniformLocation(gl.program, 'projectionMatrix');
    mLoc = gl.getUniformLocation(gl.program, 'modelMatrix');

    const at = vec3(0.0, 0.0, 1.0);
    const up = vec3(0.0, 1.0, 0.0);
    const eye = vec3(0, 0, 5);

    const fovy = 45;
    const aspect = canvas.width / canvas.height;
    const near = 0.1;
    const far = 6;

    v = lookAt(eye, at, up); // view matrix
    p = perspective(fovy, aspect, near, far); // projection matrix

    render();
};


function triangle(a, b, c) {
    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);
}

function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {
 
        var ab = normalize(mix( a, b, 0.5), true);
        var ac = normalize(mix( a, c, 0.5), true);
        var bc = normalize(mix( b, c, 0.5), true);
 
        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else { // draw tetrahedron at end of recursion
        triangle( a, b, c );
    }
}

function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
 }

 function initSphere(gl, numSubdivs) {
    pointsArray = [];
    // initial points on tetrahedron, taken from coursesite wiki
    var va = vec4(0.0, 0.0, 1.0, 1);
    var vb = vec4(0.0, 0.942809, -0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
    var vd = vec4(0.816497, -0.471405, -0.333333, 1);

    tetrahedron(va, vb, vc, vd, numSubdivs);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer); 
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

}


function three_point() {
    m = mult(R[0], R[1]);
    m = mult(R[2], m);
    gl.uniformMatrix4fv(pLoc, false, flatten(p));
    gl.uniformMatrix4fv(vLoc, false, flatten(v));
    gl.uniformMatrix4fv(mLoc, false, flatten(m));
    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length); // Triangles now
}
    
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    three_point();
    requestAnimationFrame(render);
}