
var program_OBJECT; var program_GROUND;

// View Matrix
var at = vec3(0.0, 0.0, -1.0);
var up = vec3(0.0, 1.0, 0.0); 
var eye = vec3(0.0, 0.0, 1.0);

var M, V;
var P = perspective(65, 1.0, 0.01, 10.0);

// Orbit: 
    var orbit = true; // Orbit on

    var radius = 3.5;
    var stepsize = 0.75;
    var lightCenter = vec4(0.0, 3.5, -3.0, 1.0) 
    var lightOrbit, lightPos; // LightCalculations
    var epsilon, d, T_lp, T_minuslp // ShadowCalculations
    var Mp, Ms

// Jump:
    var jump = true;    
    var y_coord = -0.999; 
    var Wy = 0.01;

// Lighting variables
    var L_i = vec3(1.0, 1.0, 1.0);
    // ambient coefficient
    var k_a = 0.5;
    // diffuse reflection coefficient
    var k_d = 0.5;
    // specular coefficient
    var k_s = 0.5;
    // shininess
    var s = 50;

// Setup marble plane coordinates
var pointsArray = [
    vec3(2, -1, -1), // Ground quad
    vec3(2, -1, -5), 
    vec3(-2, -1, -5), 
    vec3(-2, -1, -1),
];

var texCoords = [
    vec2(1, 0),
    vec2(1, 1),
    vec2(0, 1),
    vec2(0, 0),
];

window.onload = async function init()
{
    var canvas = document.getElementById("c");
    var gl = WebGLUtils.setupWebGL( canvas , { alpha : false });
    if ( !gl ) { alert( "WebGL isn't available" ); }
    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) {
      console.log('Warning: Unable to use an extension');
    }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);   
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LESS); // Default value

    // Handling orbit on/off
    document.getElementById("Orbit").onclick = function() { orbit = !orbit };
    // Handling jump on/off
    document.getElementById("Jump").onclick = function() { jump = !jump };
    
    // attach shaders to program
    program_GROUND = initShaders(gl, "vertex-shader-ground", "fragment-shader-ground");
    program_OBJECT = initShaders(gl, "vertex-shader-teapot", "fragment-shader-teapot");
    program_SHADOW = initShaders(gl, "vShadows", "fShadows");
    
    // Coupling VPM to shaders
    var vLoc_OBJECT = gl.getUniformLocation(program_OBJECT, "viewMatrix");
    var pLoc_OBJECT = gl.getUniformLocation(program_OBJECT, "projectionMatrix");
    var mLoc_OBJECT = gl.getUniformLocation(program_OBJECT, "modelMatrix");
    var vLoc_GROUND = gl.getUniformLocation(program_GROUND, "viewMatrix");   
    var vLoc_light_GROUND = gl.getUniformLocation(program_GROUND, "viewMatrixFromLight");   
    var pLoc_GROUND = gl.getUniformLocation(program_GROUND, "projectionMatrix");    
    var mLoc_GROUND = gl.getUniformLocation(program_GROUND, "modelMatrix");  
    var vLoc_SHADOW = gl.getUniformLocation(program_SHADOW, "viewMatrix");          
    var pLoc_SHADOW = gl.getUniformLocation(program_SHADOW, "projectionMatrix");    
    var mLoc_SHADOW = gl.getUniformLocation(program_SHADOW, "modelMatrix");  

    // coupling lighting to shaders
    var lightPosLoc = gl.getUniformLocation(program_OBJECT, "lightPos");
    var liLoc = gl.getUniformLocation(program_OBJECT, "L_i");
    var kaLoc = gl.getUniformLocation(program_OBJECT, "k_a");
    var kdLoc = gl.getUniformLocation(program_OBJECT, "k_d");
    var ksLoc = gl.getUniformLocation(program_OBJECT, "k_s");
    var sLoc = gl.getUniformLocation(program_OBJECT, "s");

    // --- GROUND ---:
    gl.useProgram(program_GROUND);

    // coupling attributes to shaders
    program_GROUND.vPosition = gl.getAttribLocation(program_GROUND, "vPosition");
    program_GROUND.vTexel = gl.getAttribLocation(program_GROUND, "vTexel"); 

    // Vertex Buffer - 1. Creation
    program_GROUND.vBuffer = gl.createBuffer();
    program_GROUND.vBuffer.num = 3; program_GROUND.vBuffer.type = gl.FLOAT;

    // Vertex Buffer - 2. Connection
    gl.bindBuffer(gl.ARRAY_BUFFER, program_GROUND.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);  
    gl.vertexAttribPointer(program_GROUND.vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program_GROUND.vPosition);

    // Texel Buffer - 1. Creation
    program_GROUND.tBuffer = gl.createBuffer();
    program_GROUND.tBuffer.num = 2; program_GROUND.tBuffer.type = gl.FLOAT;

    // Texel Buffer - 2. Connection
    gl.bindBuffer(gl.ARRAY_BUFFER, program_GROUND.tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);
    gl.vertexAttribPointer(program_GROUND.vTexel, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program_GROUND.vTexel);

    // Sending IMAGE-TEXTURE to Buffer
    var image = document.createElement('img');

    image.crossorigin = 'anonymous';

    // Image-load function
    image.onload = function () {

        gl.useProgram(program_GROUND)
        // texture object
        program_GROUND.texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, program_GROUND.texture);
        
        // Magnification and Minification parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    
        // Upload texture map
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.uniform1i(gl.getUniformLocation(program_GROUND, "texMap"), 0);

    };

    image.src = "xamp23.png";

    // --- TEAPOT ---:
    gl.useProgram(program_OBJECT); // specify program

    // coupling attributes to shaders
    program_OBJECT.vPosition = gl.getAttribLocation(program_OBJECT, "vPosition");
    program_OBJECT.vNormals = gl.getAttribLocation(program_OBJECT, "vNormals");
    program_OBJECT.vColor = gl.getAttribLocation(program_OBJECT, "vColor")

    // init buffers
    model = initVertexBuffers(gl, program_OBJECT);

    // init frame-buffer object:
    texwidth = 512.0; // 2048
    texheight = 512.0;
    var fbo = initFramebufferObject(gl, texwidth, texheight);
    
    // Read OBJ
    const drawingInfo = await readOBJFile('teapot.obj', 0.25, true);
    if (drawingInfo) {
      g_drawingInfo = onReadComplete(gl, model, drawingInfo);
      console.log("(Init) Drawing info ready!: " + g_drawingInfo);
    }
    
    function tick(){     
            
        if (orbit) {
            stepsize += 0.01;
            // Adding the orbit
            lightOrbit = vec4(radius * Math.sin(stepsize), 0.0, radius * Math.cos(stepsize), 0.0);
            lightPos = vec4(lightOrbit[0] + lightCenter[0], lightOrbit[1] + lightCenter[1], lightOrbit[2] + lightCenter[2], lightOrbit[3] + lightCenter[3]);
        };

        gl.useProgram(program_OBJECT) // specify program
        // Sending lighting information to buffer
        gl.uniform4fv(lightPosLoc, lightPos);
        gl.uniform3fv(liLoc, L_i);
        gl.uniform1f(kaLoc, k_a);
        gl.uniform1f(kdLoc, k_d);
        gl.uniform1f(ksLoc, k_s);
        gl.uniform1f(sLoc, s);
        
        M = translate(vec3(0.0, y_coord, -3.0)); 

        // Calculating view-matrices for the light-source
        eye_l = vec3(lightPos[0], lightPos[1], lightPos[2]);
        at_l = vec3(0.0, -1.0, -3.0);

        // View and Perspective matrices for light-source:
        V_l = lookAt(eye_l, at_l, up);
        P_l = perspective(65, 1.0, 0.01, 10.0);

        if (jump) {
            if (y_coord.toFixed(2) == -1.0) { Wy = 0.01; }
            if (y_coord.toFixed(2) == 0.0) { Wy = -0.01; }
            y_coord += Wy;
        }
        
        render();
        requestAnimationFrame(tick);
    }

    tick();

    function render() {

        // ---- SHADOWS ----:
        // Initialize framebuffeer
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); 

        // Viewport and clearing buffers
        gl.viewport(0, 0, fbo.width, fbo.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // ---- Teapot Shadow ----:
        gl.useProgram(program_SHADOW) // specify program

        // Initializing variables
        initAttributeVariable(gl, program_OBJECT.vPosition, model.vertexBuffer);
        initAttributeVariable(gl, program_OBJECT.vNormals, model.normalBuffer);
        initAttributeVariable(gl, program_OBJECT.vColor, model.colorBuffer);                
        
        // Sending VPM to buffer
        gl.uniformMatrix4fv(mLoc_SHADOW, false, flatten(M));
        gl.uniformMatrix4fv(vLoc_SHADOW, false, flatten(V_l));
        gl.uniformMatrix4fv(pLoc_SHADOW, false, flatten(P_l));
        
        // Drawing teapot
        gl.disable(gl.CULL_FACE); // To make shadows appear regardless of light position
        gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);

        // End of framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        
        
        
        // ---- Regular Drawing ----:
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // ---- TEAPOT ----:
        gl.useProgram(program_OBJECT) // specify program
        // bind buffers, enable attributes
        initAttributeVariable(gl, program_OBJECT.vPosition, model.vertexBuffer);
        initAttributeVariable(gl, program_OBJECT.vNormals, model.normalBuffer);
        initAttributeVariable(gl, program_OBJECT.vColor, model.colorBuffer);

        // Sending VPM to buffer
        V = lookAt(eye, at, up);
        M = translate(vec3(0.0, y_coord, -3.0)); 
        gl.uniformMatrix4fv(mLoc_OBJECT, false, flatten(M));
        gl.uniformMatrix4fv(vLoc_OBJECT, false, flatten(V));
        gl.uniformMatrix4fv(pLoc_OBJECT, false, flatten(P));
        gl.uniform1f(gl.getUniformLocation(program_OBJECT, "visibility"), 1.0); // Visibility: 1 --> Colored
        gl.uniform1i(gl.getUniformLocation(program_OBJECT, "reflected"), 1); // Reflected: 1 --> reflected

        // Drawing teapot
        gl.disable(gl.CULL_FACE); // To make certain parts of teapot non-see-through
        gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);

        // Sending VPM to buffer
        V = lookAt(eye, at, up);
        M = translate(vec3(0.0, y_coord, -3.0)); 
        gl.uniformMatrix4fv(mLoc_OBJECT, false, flatten(M));
        gl.uniformMatrix4fv(vLoc_OBJECT, false, flatten(V));
        gl.uniformMatrix4fv(pLoc_OBJECT, false, flatten(P));
        gl.uniform1f(gl.getUniformLocation(program_OBJECT, "visibility"), 1.0); // Visibility: 1 --> Colored
        gl.uniform1i(gl.getUniformLocation(program_OBJECT, "reflected"), 0); // Reflected: 1 --> reflected

        // Drawing teapot
        gl.disable(gl.CULL_FACE); // To make certain parts of teapot non-see-through
        gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);



        // ---- GROUND QUAD ----:
        gl.useProgram(program_GROUND); // specify program

        // Sending the previously calculated ShadowMap (texture) to the ground shader. 
        // Binding to texture
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
        gl.uniform1i(gl.getUniformLocation(program_GROUND, "u_ShadowMap"), 1);
        gl.uniform1f(gl.getUniformLocation(program_GROUND, "alpha"), 0.6);

        // bind buffers, enable attributes
        initAttributeVariable(gl, program_GROUND.vPosition, program_GROUND.vBuffer);
        initAttributeVariable(gl, program_GROUND.vTexel, program_GROUND.tBuffer);

        // Sending VPM to buffer
        V = lookAt(eye, at, up);
        M = mat4();
        gl.uniformMatrix4fv(mLoc_GROUND, false, flatten(M));
        gl.uniformMatrix4fv(vLoc_GROUND, false, flatten(V));
        gl.uniformMatrix4fv(vLoc_light_GROUND, false, flatten(V_l));
        gl.uniformMatrix4fv(pLoc_GROUND, false, flatten(P));

        // DRAWING
        gl.enable(gl.CULL_FACE); 
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); 
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        gl.disable(gl.BLEND);


    };
};

function initAttributeVariable(gl, attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(attribute);
};

// Create a buffer object and perform the initial configuration
function initVertexBuffers(gl, program) {
    var o = new Object();
    o.vertexBuffer = createEmptyArrayBuffer(gl, program.vPosition, 4, gl.FLOAT);
    o.vertexBuffer.num = 4; o.vertexBuffer.type = gl.FLOAT;
    o.normalBuffer = createEmptyArrayBuffer(gl, program.vNormal, 4, gl.FLOAT);
    o.normalBuffer.num = 4; o.normalBuffer.type = gl.FLOAT;
    o.colorBuffer = createEmptyArrayBuffer(gl, program.vColor, 4, gl.FLOAT);
    o.colorBuffer.num = 4; o.colorBuffer.type = gl.FLOAT;
    o.indexBuffer = gl.createBuffer();
    
    return o;
};

function createEmptyArrayBuffer(gl, a_attribute, num, type) {
    var buffer = gl.createBuffer(); // Create a buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute); // Enable the assignment
    
    return buffer;
};


async function readOBJFile(fileName, scale, reverse)
{
const response = await fetch(fileName);
if(response.ok)
{ console.log("OBJ file loading complete: ", fileName);
  var objDoc = new OBJDoc(fileName); // Create an OBJDoc object
  let fileText = await response.text();
  let result = await objDoc.parse(fileText, scale, reverse);
  if(!result) {
    console.log("OBJ file parsing error.");
    return null;
  }
  return objDoc.getDrawingInfo();
}
else { 
  console.error('Failed to fetch ' + fileName); 
  return null;
}
}

var g_objDoc = null; // The information of OBJ file
var g_drawingInfo = null; // The information for drawing 3D model


 // OBJ File has been read completely
function onReadComplete(gl, model, objDoc) {
    // Acquire the vertex coordinates and colors from OBJ file
    var drawingInfo = objDoc;
    
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices,gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);
    
    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);
    
    return drawingInfo;   
};

function initFramebufferObject(gl, width, height) {

    var framebuffer = gl.createFramebuffer(); 
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    var renderbuffer = gl.createRenderbuffer(); 
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer); 
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

    var shadowMap = gl.createTexture(); 
    gl.activeTexture(gl.TEXTURE1); // OBS ER DER NOGET SJOVT MED TEXTURE 0 / 1?
    gl.bindTexture(gl.TEXTURE_2D, shadowMap); 
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); 
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    framebuffer.texture = shadowMap;

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowMap, 0); 
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

    if (status !== gl.FRAMEBUFFER_COMPLETE) { 
        console.log('Framebuffer object is incomplete: ' + status.toString()); 
    } 

    gl.bindFramebuffer(gl.FRAMEBUFFER, null); 
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    framebuffer.width = width; framebuffer.height = height;
    return framebuffer;

}