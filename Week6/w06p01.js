var gl, canvas;
var v, p, m, vLoc, pLoc, mLoc;

const T = translate(0.0, 0.0, 0.0);
const R = mat4(); // Identity matrix
// LookAt()
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);
var eye = vec3(1.0, 0.0, 0.0);

const fovy = 90;
const near = 0.1;
const far = 50;


var vertices = [
    vec4(-4, -1, -1, 1), 
    vec4(4, -1, -1, 1), 
    vec4(4, -1, -21, 1), 
    vec4(-4, -1, -21, 1)
];

var texCoords = [
    vec2(-1.5, 0.0),
    vec2(2.5, 0.0),
    vec2(2.5, 10.0),
    vec2(-1.5, 10.0)
];

var texSize = 64;
var numChecks = 8;
var myTexels = new Uint8Array(4*texSize*texSize); // 4 for RGBA image, texSize is the resolution

for(var i = 0; i < texSize; ++i) 
    for(var j = 0; j < texSize; ++j) {
        var patchx = Math.floor(i/(texSize/numChecks));
        var patchy = Math.floor(j/(texSize/numChecks));
        var c = (patchx%2 !== patchy%2 ? 255 : 0);
        var idx = 4*(i*texSize + j);
        myTexels[idx] = myTexels[idx + 1] = myTexels[idx + 2] = c; 
        myTexels[idx + 3] = 255;
}

window.onload = function init() {
        
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { 
        alert("WebGL isn't available"); 
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);   // Enable backface culling
    // gl.frontFace(gl.CCW);  

    // Shaders
    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(gl.program);

    // texture object
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, myTexels);

    // Vertices
    gl.vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer); 
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    // Position of Vertices
    gl.vPosition = gl.getAttribLocation(gl.program, "vPosition");
    gl.vertexAttribPointer(gl.program.vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.program.vPosition);

    // Tex
    gl.texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.texBuffer); 
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

    // Tex Vertices
    var vTexCoord = gl.getAttribLocation(gl.program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    gl.uniform1i(gl.getUniformLocation(gl.program, "texMap"), 0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    // coupling MVP to the vertex shader
    var mLoc = gl.getUniformLocation(gl.program, "modelMatrix");
    var vLoc = gl.getUniformLocation(gl.program, "viewMatrix");
    var pLoc = gl.getUniformLocation(gl.program, "projectionMatrix");

    // View matrix (I)
    var v = mat4();
    // Projection matrix
    var p = perspective(fovy, canvas.width / canvas.height, near, far);


    render();

    function render() {
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Sending info
        gl.uniformMatrix4fv(vLoc, false, flatten(v));
        gl.uniformMatrix4fv(pLoc, false, flatten(p));
        gl.uniformMatrix4fv(mLoc, false, flatten(mult(T, R)));
        gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length);
        requestAnimationFrame(render);
    }
}
    
    
    