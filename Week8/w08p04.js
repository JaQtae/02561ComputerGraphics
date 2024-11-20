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

var lightPos;

var radius = 2;
var alpha = 0;
var orbit = true;

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
    gl = WebGLUtils.setupWebGL(canvas, {alpha: false}); // Browser compositing influenced
    if (!gl) { 
        alert("WebGL isn't available"); 
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND); // enabling blending
    gl.enable(gl.CULL_FACE);   // Enable backface culling
    gl.depthFunc(gl.LESS); // Default : The fragment passes if its depth value is LESS than the stored value in depth buffer
    // ie. ground quad "blocks" further rendering behind it.

    // Shaders
    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(gl.program);

    // Buttons
    document.getElementById("Orbit").onclick = function(){
        orbit = !orbit;
    };

    // Vertices
    gl.vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer); 
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);


    gl.vPosition = gl.getAttribLocation(gl.program, "vPosition");
    gl.vertexAttribPointer(gl.program.vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.program.vPosition);


    gl.texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.texBuffer); 
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(gl.program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    mLoc = gl.getUniformLocation(gl.program, "modelMatrix");
    vLoc = gl.getUniformLocation(gl.program, "viewMatrix");
    pLoc = gl.getUniformLocation(gl.program, "projectionMatrix");

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
    v = mat4();
    // Projection matrix
    p = perspective(fovy, canvas.width / canvas.height, near, far);

    m = mat4();


    render();

    function render() {
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (orbit) {
            alpha += 0.007;
        }

        // Adding the orbit
        var lightCenter = vec4(0.0, 2.0, -2.0, 1.0) // Point light ( .w = 1 )
        var lightOrbit =  vec4(radius * Math.sin(alpha), 0.0, radius * Math.cos(alpha), 0.0);
        lightPos = vec4(lightOrbit[0] + lightCenter[0],
                        lightOrbit[1] + lightCenter[1],
                        lightOrbit[2] + lightCenter[2],
                        lightOrbit[3] + lightCenter[3],
                    );

        // Shadow projection
        var epsilon = 0.001; // Small value to make the shadows appear above ground. 
        var d = - (lightPos[1] - pointsArray[0][1] + epsilon); // above ground now!

        // Constructing Mp
        Mp = mat4(); 
        Mp[3][1] = 1/d; 
        Mp[3][3] = 0;

        // Translation to and from space with light source as origin
        var T_lp = translate(lightPos[0], lightPos[1], lightPos[2]);
        var T_minuslp = translate(-lightPos[0], -lightPos[1], -lightPos[2]);

        // Calculating shadow projection matrix
        var Ms = mult(mult(mult(T_lp, Mp), T_minuslp), m); //  "concat" Mp with m and translation (T_lp, T_-lp) matrices

        // Sending info
        gl.uniformMatrix4fv(vLoc, false, flatten(v));
        gl.uniformMatrix4fv(pLoc, false, flatten(p));
        gl.uniformMatrix4fv(mLoc, false, flatten(m));

        // Ground quad (gl.LESS)'ed
        gl.bindTexture(gl.TEXTURE_2D, texture0);
        gl.drawArrays( gl.TRIANGLE_FAN, 0, 4);
        gl.bindTexture(gl.TEXTURE_2D, texture1);

        /// Shadows (in front of ground but behind smaller quads)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthFunc(gl.GREATER); // Ground was written first (stencil technique), so shadows may only render IF they are "closer" to camera than ground
        // ie. they cant "pass the depth test" beyond the ground quad.
        gl.disable(gl.CULL_FACE); // shadows appear regardless of lightPos
        gl.uniform1f(gl.getUniformLocation(gl.program, "visibility"), 0.0); // Shadows are invisible
        gl.uniform1f(gl.getUniformLocation(gl.program, "alpha_ambient"), 0.5); 
        gl.uniformMatrix4fv(mLoc, false, flatten(Ms)); // Shadow projection matrix information propagation
        gl.drawArrays( gl.TRIANGLE_FAN, 4, 4);
        gl.drawArrays( gl.TRIANGLE_FAN, 8, 4);

        // Red Quad(s)
        gl.depthFunc(gl.LESS); 
        gl.enable(gl.CULL_FACE);
        gl.uniform1f(gl.getUniformLocation(gl.program, "visibility"), 1.0); 
        gl.uniform1f(gl.getUniformLocation(gl.program, "alpha_ambient"), 1.0); 
        gl.uniformMatrix4fv(mLoc, false, flatten(m));
        gl.drawArrays( gl.TRIANGLE_FAN, 4, 4);
        gl.drawArrays( gl.TRIANGLE_FAN, 8, 4);

        requestAnimationFrame(render);
    }
}
    
    
    