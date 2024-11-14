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
    //gl.cullFace(gl.BACK);      // Cull the back faces (default)

    var g_tex_ready = 0;
    function initTexture(gl, texture_choice) {
        if (texture_choice == 'cloudyhills') {
            var cubemap = [
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
    gl.uniform1i(gl.getUniformLocation(gl.program, "texMap"), 0);
    }


    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(gl.program);
    initSphere(gl, numSubdivs);

    // Buttons
    document.getElementById("Orbit").onclick = function(){
        orbit *= -1
    };

    var texture_list = ['cm', 'brightday2', 'greenhill', 'terrain', 'cloudyhills', 'autumn'];

    var texture_choice = texture_list[0];

    var texture_menu = document.getElementById("texture");
    texture_menu.addEventListener("click", function() {
        texture_choice = texture_list[texture_menu.selectedIndex]; 
        g_tex_ready = 0; // counter of loaded images (if == 6, tex is ready)
        initTexture(gl, texture_choice);
        justLoaded = false;
    } );  


    // Buffers moved to initSphere


    // View Matrix location
    var vLoc = gl.getUniformLocation(gl.program, 'viewMatrix')
    var pLoc = gl.getUniformLocation(gl.program, 'projectionMatrix');
    var mLoc = gl.getUniformLocation(gl.program, 'modelMatrix');
    // Gourad shading parameters

    initTexture(gl, texture_choice);

    function tick() { 
        // Ready to render?
        if (loaded && g_tex_ready >= 6) {
            // Render once only
            loaded = false;
            render();
        }
        requestAnimationFrame(tick); 
    }
    
    tick(); 

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (orbit == 1) {
            alpha += 0.003; // rotate camera
        }
        var eye = vec3(radius * Math.sin(alpha), 0, radius * Math.cos(alpha));
        
        // Recalculate every render
        v = lookAt(eye, at, up);  // Update the view matrix based on the rotating eye position
        p = perspective(fovy, canvas.width / canvas.height, near, far); // projection matrix
    
        gl.useProgram(gl.program);

        gl.uniformMatrix4fv(pLoc, false, flatten(p));
        gl.uniformMatrix4fv(vLoc, false, flatten(v));
        gl.uniformMatrix4fv(mLoc, false, flatten(mult(T, R)));

        gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);

    
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
