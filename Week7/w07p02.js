var numSubdivs = 6;
var pointsArray = [];
var nArray = [];
var loaded = 1;

// LookAt()
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

const fovy = 45;
const near = 0.001;
const far = 5;

var radius = 1; var alpha = 0.0; var orbit = 1;

// Normalized device coordinates (NDC) for quad
var quad = [
    vec4(-1.0, -1.0, 0.999, 1.0), 
    vec4(1.0, -1.0, 0.999, 1.0), 
    vec4(-1.0, 1.0, 0.999, 1.0), 
    vec4(1.0, 1.0, 0.999, 1.0),
]

var mTex_sphere, mTex_quad, g_tex_ready;

window.onload = function init() {
    // My JavaScript code which runs when the webpage is loaded by the browser
    var canvas = document.getElementById("gl-canvas");
    var gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available")
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0.95);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    // attach shaders to program
    var program = initShaders(gl, "vertex-shader", "fragment-shader");

    // which program to use when drawing arrays etc.
    gl.useProgram(program);

    // initSphere(numSubdivs); --> CANT DO HERE OR IT DIES ????

    // Adding the quad to the scene
    for(var i = 0; i < 4; ++i) {
        pointsArray.push(quad[i])   
        nArray.push(vec4(quad[i][0], quad[i][1], -quad[i][2], 0.0));
    }

    initSphere(numSubdivs);

    gl.vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition"); 
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(nArray), gl.STATIC_DRAW);

    var vNormals = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormals, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormals);

    // Create index buffer for background (quad)
    var quad_indices = [
        0, 1, 2,
        3, 2, 1,
    ];

    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(quad_indices), gl.STATIC_DRAW);

    var vLoc = gl.getUniformLocation(program, "viewMatrix");
    var pLoc = gl.getUniformLocation(program, "projectionMatrix");
    var mLoc = gl.getUniformLocation(program, "modelMatrix");
    var mTexLoc = gl.getUniformLocation(program, "mTex");

    // Buttons
    document.getElementById("Orbit").onclick = function(){
        orbit *= -1;
    };

    var texture_list = ['cm', 'brightday2', 'greenhill', 'terrain', 'cloudyhills', 'autumn'];

    var texture_type = texture_list[0];

    var texture_menu = document.getElementById("texture");
    texture_menu.addEventListener("click", function() {
        texture_type = texture_list[texture_menu.selectedIndex]; 
        g_tex_ready = 0; // counter of loaded images (if == 6, tex is ready)
        initTexture(gl, texture_type);
        loaded = false;
    } );  
    
    var g_tex_ready = 0;
    function initTexture(gl, texture_choice) {
        if (texture_choice == 'cloudyhills') {
            var  cubemap = [
                texture_choice+"_cubemap/"+texture_choice+"_posx.jpg", // POSITIVE_X
                texture_choice+"_cubemap/"+texture_choice+"_negx.jpg", // NEGATIVE_X
                texture_choice+"_cubemap/"+texture_choice+"_posy.jpg", // POSITIVE_Y
                texture_choice+"_cubemap/"+texture_choice+"_negy.jpg", // NEGATIVE_Y
                texture_choice+"_cubemap/"+texture_choice+"_posz.jpg", // POSITIVE_Z
                texture_choice+"_cubemap/"+texture_choice+"_negz.jpg"  // NEGATIVE_Z;
            ]; 
        } else {
        var cubemap = [
            texture_choice+"_cubemap/"+texture_choice+"_posx.png", // POSITIVE_X
            texture_choice+"_cubemap/"+texture_choice+"_negx.png", // NEGATIVE_X
            texture_choice+"_cubemap/"+texture_choice+"_posy.png", // POSITIVE_Y
            texture_choice+"_cubemap/"+texture_choice+"_negy.png", // NEGATIVE_Y
            texture_choice+"_cubemap/"+texture_choice+"_posz.png", // POSITIVE_Z
            texture_choice+"_cubemap/"+texture_choice+"_negz.png" // NEGATIVE_Z
            ]; 
        }   
        
        gl.activeTexture(gl.TEXTURE0);
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        for (var i = 0; i < 6; ++i) {
            var image = document.createElement("img");
            image.crossorigin = "anonymous";
            image.textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;

            image.onload = function (event) {
                var image = event.target;
                gl.activeTexture(gl.TEXTURE0);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, texture_choice == 'cm'); // Only flip if 'cm' texture
                gl.texImage2D(image.textarget, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
                ++g_tex_ready;
            };
            image.src = cubemap[i];
    }
    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
    }

    initTexture(gl, texture_type);

    function tick() { 
        // Ready?
        if (loaded && g_tex_ready >= 6) {
            // Render once
            loaded = false;
            render();
        }
        requestAnimationFrame(tick); 
    }
    
    tick(); 

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (orbit == 1) {
            alpha += 0.003;
        }
        var eye = vec3(radius * Math.sin(alpha), 0, radius * Math.cos(alpha));
        v = lookAt(eye, at, up);
        p = mat4(); 
        m = mat4(); 

        mTex_quad = getQuadMTex(v, p);
        mTex_sphere = mat4(); // Identity

        // Background (Quad)
        gl.uniformMatrix4fv(vLoc, false, flatten(mat4()));
        gl.uniformMatrix4fv(pLoc, false, flatten(p));
        gl.uniformMatrix4fv(mLoc, false, flatten(m));
        gl.uniformMatrix4fv(mTexLoc, false, flatten(mTex_quad));
        // Draw
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);

        // Sphere
        gl.uniformMatrix4fv(vLoc, false, flatten(v)); // Rotate around room
        gl.uniformMatrix4fv(pLoc, false, flatten(p));
        gl.uniformMatrix4fv(mLoc, false, flatten(scalem(0.5, 0.5, 0.5))); // Make the sphere appear smaller by half in each direction  
        gl.uniformMatrix4fv(mTexLoc, false, flatten(mTex_sphere));
        // Draw
        gl.drawArrays(gl.TRIANGLES, 4, pointsArray.length - 4);   // Subtract quad

        requestAnimFrame(render);
    }

    // given worksheet
    function getQuadMTex(v, p) {
        var invertedV = inverse(v)
        var invertedP = inverse(p)

        // zero-padding the 3x3 V.inv
        for (let i = 0; i < 4; i++) {
            invertedV[3][i] = 0;
            invertedV[i][3] = 0;
        }

        return mult(invertedV, invertedP)
    }
}

function triangle(a, b, c) {
    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);
    
    // pushing normals
    nArray.push(vec4(a[0], a[1], a[2], 0.0));
    nArray.push(vec4(b[0], b[1], b[2], 0.0));
    nArray.push(vec4(c[0], c[1], c[2], 0.0));
}

function divideTriangle(a, b, c, count) {
    if (count > 0) {

        var ab = normalize(mix(a, b, 0.5), true);
        var ac = normalize(mix(a, c, 0.5), true);
        var bc = normalize(mix(b, c, 0.5), true);

        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
    }
    else { // draw tetrahedron at end of recursion
        triangle(a, b, c);
    }
}

function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}


function initSphere(numSubdivs) {

    // initial points on tetrahedron, taken from coursesite wiki
    var va = vec4(0.0, 0.0, 1.0, 1);
    var vb = vec4(0.0, 0.942809, -0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
    var vd = vec4(0.816497, -0.471405, -0.333333, 1);

    tetrahedron(va, vb, vc, vd, numSubdivs);
}
