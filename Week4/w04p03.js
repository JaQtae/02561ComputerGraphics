var color;
var colors = []
var numSubdivs = 1;
const rotationSpeed = 0.01; 
var pointsArray = [];
var nArray = [];
var loaded = 1;
var v, p, m, vLoc, pLoc, mLoc;
// Transforms
const T = translate(0.0, 0.0, 0.0);
const R = mat4(); // Identity matrix
// LookAt()
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

const fovy = 45;
const near = 0.001;
const far = 5;

var radius = 3; var alpha = 0.0; var orbit = 1;
var L_e = vec3(1.0, 1.0, 1.0); // Light emission = incident light (L_i) (if V = 1 as visibility(V) * L_e)
var L_i = L_e;
var l_dir = vec3(0.0, 0.0, -1.0); // Direction of light source
var k_d = 1.0; // Diffuse reflection coefficient
var lightPosition = vec4(0.0, 0.0, 1.0, 0.0); // Oppossite light direction

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    var gl = WebGLUtils.setupWebGL(canvas); 
    if (!gl) { 
        alert("WebGL isn't available"); 
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);   // Enable backface culling
    gl.cullFace(gl.BACK);      // Cull the back faces (default)
    gl.frontFace(gl.CCW);      // Counter-clockwise winding is the front face (default)
    
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    initSphere(gl, numSubdivs);

    // Buttons
    document.getElementById("increment").onclick = function(){
        if (numSubdivs < 7) {  // Cap subdivisions to prevent slowdowns/redundancy
            numSubdivs++;
            reset_arrays();
            loaded = 0;
            init();
        }
    };
    document.getElementById("decrement").onclick = function(){
        if(numSubdivs > 0) numSubdivs--;
        reset_arrays();
        loaded = 0;
        init();
    };

    // Vertex buffer(s)
    gl.vBuffer = gl.createBuffer(); 
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(gl.vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.vPosition);

    // Normals buffer(s)
    gl.nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(nArray), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    // Color buffer(s)
    gl.cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, 'vColor');
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // View Matrix location
    var vLoc = gl.getUniformLocation(program, 'viewMatrix')
    var pLoc = gl.getUniformLocation(program, 'projectionMatrix');
    var mLoc = gl.getUniformLocation(program, 'modelMatrix');
    // Gourad shading parameters
    var lightPositionLoc = gl.getUniformLocation(program, 'lightPosition')
    var l_iLoc = gl.getUniformLocation(program, 'L_i')
    var k_dLoc = gl.getUniformLocation(program, 'k_d')

    if (loaded) {
        render();
    }

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (orbit == 1) {
            alpha += 0.01; // rotate camera
        }
        var eye = vec3(radius * Math.sin(alpha), 0, radius * Math.cos(alpha));
        
        // Recalculate every render
        v = lookAt(eye, at, up);  // Update the view matrix based on the rotating eye position
        p = perspective(fovy, canvas.width / canvas.height, near, far); // projection matrix
    
        gl.useProgram(program);

        m = mult(T, R); // identity matrix and no translation
        gl.uniformMatrix4fv(pLoc, false, flatten(p));
        gl.uniformMatrix4fv(vLoc, false, flatten(v));
        gl.uniformMatrix4fv(mLoc, false, flatten(m));
        
        gl.uniform4f(lightPositionLoc, lightPosition[0], lightPosition[1], lightPosition[2], lightPosition[3]);
        gl.uniform3f(l_iLoc, L_i[0], L_i[1], L_i[2]);
        gl.uniform1f(k_dLoc, k_d);

        gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
    
        requestAnimationFrame(render);
    }
};


function triangle(a, b, c) {
    pointsArray.push(a); 
    pointsArray.push(b);
    pointsArray.push(c);

    colors.push(vec4(0.5 * a[0] + 0.5, 0.5 * a[1] + 0.5, 0.5 * a[2] + 0.5, 1.0));
    colors.push(vec4(0.5 * b[0] + 0.5, 0.5 * b[1] + 0.5, 0.5 * b[2] + 0.5, 1.0));
    colors.push(vec4(0.5 * c[0] + 0.5, 0.5 * c[1] + 0.5, 0.5 * c[2] + 0.5, 1.0));

    nArray.push(vec4(a[0], a[1], a[2], 0.0));
    nArray.push(vec4(b[0], b[1], b[2], 0.0));
    nArray.push(vec4(c[0], c[1], c[2], 0.0));
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
    if (!gl.vBuffer) {
        gl.vBuffer = gl.createBuffer();  // Gives warnings if I don't make it if-statement...
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer); 
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

}

function reset_arrays() {
    pointsArray = [];
    nArray = [];
    colors = [];
}
