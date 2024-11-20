var gl, canvas;
var v, p, m, vLoc, pLoc, mLoc;

const T = translate(0.0, 0.0, 0.0);
const R = mat4(); // Identity matrix
// LookAt()
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);
const eye = vec3(1.0, 0.0, 0.0);

const fovy = 90;
const near = 0.001;
const far = 50;

var pointsArray = [
    vec3(2, -1, -1), 
    vec3(2, -1, -5), 
    vec3(-2, -1, -5), 
    vec3(-2, -1, -1), // Quad1 (Large texture-wrapped)

    vec3(0.25, -0.5, -1.25), // Quad2 (placed above ground) (right-most)
    vec3(0.75, -0.5, -1.25), 
    vec3(0.75, -0.5, -1.75), 
    vec3(0.25, -0.5, -1.75),  

    vec3(-1.0, 0.0, -3.0), // Quad3 (placed above ground)
    vec3(-1.0, 0.0, -2.5), 
    vec3(-1.0, -1.0, -2.5),  
    vec3(-1.0, -1.0, -3.0), 
];

var texCoords = pointsArray; // Dynamic texture coordinates if vec3 is used

var texture0, texture1;

window.onload = function init() {
        
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { 
        alert("WebGL isn't available"); 
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);   // Enable backface culling

    // Shaders
    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(gl.program);

    // Vertices
    gl.vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer); 
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    // Position of Vertices
    gl.vPosition = gl.getAttribLocation(gl.program, "vPosition");
    gl.vertexAttribPointer(gl.program.vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.program.vPosition);


    gl.texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.texBuffer); 
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(gl.program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    var mLoc = gl.getUniformLocation(gl.program, "modelMatrix");
    var vLoc = gl.getUniformLocation(gl.program, "viewMatrix");
    var pLoc = gl.getUniformLocation(gl.program, "projectionMatrix");

    var image = document.createElement('img');

    image.crossorigin = 'anonymous';

    image.onload = function () {
        texture0 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        
        gl.bindTexture(gl.TEXTURE_2D, texture0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.uniform1i(gl.getUniformLocation(gl.program, "texMap"), 0);

        gl.generateMipmap(gl.TEXTURE_2D);
    
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    };

    image.src = 'xamp23.png'; 
    
    // loading static red texture
    texture1 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0])); // red
    gl.uniform1i(gl.getUniformLocation(gl.program, "texMap"), 1);

    // View matrix (I)
    var v = mat4();
    // Projection matrix
    var p = perspective(fovy, canvas.width / canvas.height, near, far);

    var m = mat4();


    render();

    function render() {
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Sending info
        gl.uniformMatrix4fv(vLoc, false, flatten(v));
        gl.uniformMatrix4fv(pLoc, false, flatten(p));
        gl.uniformMatrix4fv(mLoc, false, flatten(m));

        gl.bindTexture(gl.TEXTURE_2D, texture0);
        gl.drawArrays( gl.TRIANGLE_FAN, 0, 4);

        
        gl.bindTexture(gl.TEXTURE_2D, texture1);
        gl.drawArrays( gl.TRIANGLE_FAN, 4, 4);
        gl.drawArrays( gl.TRIANGLE_FAN, 8, 4);

        requestAnimationFrame(render);
    }
}
    
    
    