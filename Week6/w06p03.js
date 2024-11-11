var gl; var canvas;
var numSubdivs = 6;
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
var k_a = 0.3; // Ambient reflection coefficient
var lightPosition = vec4(0.0, 0.0, 1.0, 0.0); // Oppossite light direction

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas); 
    if (!gl) { 
        alert("WebGL isn't available"); 
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0.95); // Like black better when it is a blue globe...
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);   // Enable backface culling
    gl.cullFace(gl.BACK);      // Cull the back faces (default)


    // Image
    var image = document.createElement('img');
    image.crossorigin = 'anonymous';
    image.onload = function () {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.uniform1i(gl.getUniformLocation(gl.program, "texMap"), 0);

        // generating mipmap;
        gl.generateMipmap(gl.TEXTURE_2D);
    };
    image.src = 'earth.jpg';

    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(gl.program);
    initSphere(gl, numSubdivs);

    var min_choice =    [gl.NEAREST, gl.LINEAR, gl.NEAREST_MIPMAP_NEAREST,
                        gl.LINEAR_MIPMAP_NEAREST, gl.NEAREST_MIPMAP_LINEAR, gl.LINEAR_MIPMAP_LINEAR];

    var min_userInput = min_choice[0];

    var min_menu = document.getElementById("texture_filter_min");

    // Buttons
    document.getElementById("Orbit").onclick = function(){
        orbit *= -1
    };

    min_menu.addEventListener("click", function() {
        min_userInput = min_choice[min_menu.selectedIndex];
    });
    


    // Color buffer(s)

    // View Matrix location
    var vLoc = gl.getUniformLocation(gl.program, 'viewMatrix')
    var pLoc = gl.getUniformLocation(gl.program, 'projectionMatrix');
    var mLoc = gl.getUniformLocation(gl.program, 'modelMatrix');
    // Gourad shading parameters
    var lightPositionLoc = gl.getUniformLocation(gl.program, 'lightPosition')
    var l_iLoc = gl.getUniformLocation(gl.program, 'L_i')
    var k_dLoc = gl.getUniformLocation(gl.program, 'k_d')
    var k_dLoc = gl.getUniformLocation(gl.program, 'k_a')

    if (loaded) {
        render();
    }

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (orbit == 1) {
            alpha += 0.005; // rotate camera
        }
        var eye = vec3(radius * Math.sin(alpha), 0, radius * Math.cos(alpha));
        
        // Recalculate every render
        v = lookAt(eye, at, up);  // Update the view matrix based on the rotating eye position
        p = perspective(fovy, canvas.width / canvas.height, near, far); // projection matrix
    
        gl.useProgram(gl.program);

        gl.uniformMatrix4fv(pLoc, false, flatten(p));
        gl.uniformMatrix4fv(vLoc, false, flatten(v));
        gl.uniformMatrix4fv(mLoc, false, flatten(mult(T, R)));
        
        gl.uniform4fv(lightPositionLoc, lightPosition);
        gl.uniform3fv(l_iLoc, L_i);
        gl.uniform1f(k_dLoc, k_d);

        gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, min_userInput);
    
        requestAnimationFrame(render);
    }
};


function triangle(a, b, c) {
    pointsArray.push(a); 
    pointsArray.push(b);
    pointsArray.push(c);

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
    reset_arrays();
    // initial points on tetrahedron, taken from coursesite wiki
    var va = vec4(0.0, 0.0, 1.0, 1);
    var vb = vec4(0.0, 0.942809, -0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
    var vd = vec4(0.816497, -0.471405, -0.333333, 1);

    tetrahedron(va, vb, vc, vd, numSubdivs);
    // Vertex buffer(s)
    gl.vBuffer = gl.createBuffer(); 
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    gl.vPosition = gl.getAttribLocation(gl.program, "vPosition");
    gl.vertexAttribPointer(gl.vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.vPosition);

    // Normals buffer(s)
    gl.nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(nArray), gl.STATIC_DRAW);

    gl.vNormal = gl.getAttribLocation(gl.program, "vNormal");
    gl.vertexAttribPointer(gl.vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.vNormal);
}

function reset_arrays() {
    pointsArray = [];
    nArray = [];
}
