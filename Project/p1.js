var gl, canvas;
var program_OBJECT, program_GROUND;

// View Matrix
var at = vec3(0.0, 0.0, -1.0);
var up = vec3(0.0, 1.0, 0.0); 
var eye = vec3(0.0, 0.0, 1.0);

var m, v, p;
// Perspective
const fovy = 65;
const near = 0.01;
const far = 25;

var vLoc_OBJECT, pLoc_OBJECT, mLoc_OBJECT;
var vLoc_GROUND, vLoc_light_GROUND, pLoc_GROUND, mLoc_GROUND;
var vLoc_SHADOW, pLoc_SHADOW, mLoc_SHADOW;
var lightPositionLoc, l_iLoc, k_aLoc, k_dLoc, k_sLoc, sLoc;



// Orbit: 
    var orbit = true; // Orbit on

    var radius = 3.5;
    var alpha = 0.0;
    var lightCenter = vec4(0.0, 3.5, -3.0, 1.0) 
    var lightOrbit, lightPosition; // LightCalculations
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
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL( canvas );
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
    vLoc_OBJECT = gl.getUniformLocation(program_OBJECT, "viewMatrix");
    pLoc_OBJECT = gl.getUniformLocation(program_OBJECT, "projectionMatrix");
    mLoc_OBJECT = gl.getUniformLocation(program_OBJECT, "modelMatrix");
    vLoc_GROUND = gl.getUniformLocation(program_GROUND, "viewMatrix");   
    vLoc_light_GROUND = gl.getUniformLocation(program_GROUND, "viewMatrixFromLight");   
    pLoc_GROUND = gl.getUniformLocation(program_GROUND, "projectionMatrix");    
    mLoc_GROUND = gl.getUniformLocation(program_GROUND, "modelMatrix");  
    vLoc_SHADOW = gl.getUniformLocation(program_SHADOW, "viewMatrix");          
    pLoc_SHADOW = gl.getUniformLocation(program_SHADOW, "projectionMatrix");    
    mLoc_SHADOW = gl.getUniformLocation(program_SHADOW, "modelMatrix");  

    // coupling lighting to shaders
    lightPositionLoc = gl.getUniformLocation(program_OBJECT, "lightPosition");
    l_iLoc = gl.getUniformLocation(program_OBJECT, "L_i");
    k_aLoc = gl.getUniformLocation(program_OBJECT, "k_a");
    k_dLoc = gl.getUniformLocation(program_OBJECT, "k_d");
    k_sLoc = gl.getUniformLocation(program_OBJECT, "k_s");
    sLoc = gl.getUniformLocation(program_OBJECT, "s");

    // --- GROUND ---:
    gl.useProgram(program_GROUND);

    program_GROUND.vPosition = gl.getAttribLocation(program_GROUND, "vPosition");
    program_GROUND.vTexCoord = gl.getAttribLocation(program_GROUND, "vTexCoord"); 

    program_GROUND.vBuffer = gl.createBuffer();
    program_GROUND.vBuffer.num = 3; program_GROUND.vBuffer.type = gl.FLOAT;
    gl.bindBuffer(gl.ARRAY_BUFFER, program_GROUND.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);  

    program_GROUND.vPosition = gl.getAttribLocation(program_GROUND, "vPosition");
    gl.vertexAttribPointer(program_GROUND.vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program_GROUND.vPosition);

    program_GROUND.texBuffer = gl.createBuffer();
    program_GROUND.texBuffer.num = 2; program_GROUND.texBuffer.type = gl.FLOAT;
    gl.bindBuffer(gl.ARRAY_BUFFER, program_GROUND.texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

    program_GROUND.vTexCoord = gl.getAttribLocation(program_GROUND, "vTexCoord"); 
    gl.vertexAttribPointer(program_GROUND.vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program_GROUND.vTexCoord);

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
    program_OBJECT.vNormal = gl.getAttribLocation(program_OBJECT, "vNormal");
    program_OBJECT.vColor = gl.getAttribLocation(program_OBJECT, "vColor")

    // init buffers
    model = initVertexBuffers(gl, program_OBJECT);

    // init frame-buffer object:
    texwidth = 512.0; // 2048
    texheight = 512.0;
    var fbo = initFramebufferObject(gl, texwidth, texheight);
    
    const drawingInfo = await readOBJFile('teapot.obj', 0.25, true);
    if (drawingInfo) {
      g_drawingInfo = onReadComplete(gl, model, drawingInfo);
      console.log("(Init) Drawing info ready!: " + g_drawingInfo);
    }
    
    function tick(){   
        console.log("Orbit is:", orbit);
        console.log("Alpha is:", alpha);
        console.log("Light Orbit:", lightOrbit);
        console.log("Light Position:", lightPosition);  
        try{
        if (orbit) {
            alpha += 0.01;
            // Adding the orbit
            lightOrbit = vec4(radius * Math.sin(alpha), 0.0, radius * Math.cos(alpha), 0.0);
            lightPosition = vec4(lightOrbit[0] + lightCenter[0], lightOrbit[1] + lightCenter[1], lightOrbit[2] + lightCenter[2], lightOrbit[3] + lightCenter[3]);
        };

        gl.useProgram(program_OBJECT) // specify program
        // Sending lighting information to buffer
        gl.uniform4fv(lightPositionLoc, lightPosition);
        gl.uniform3fv(l_iLoc, L_i);
        gl.uniform1f(k_aLoc, k_a);
        gl.uniform1f(k_dLoc, k_d);
        gl.uniform1f(k_sLoc, k_s);
        gl.uniform1f(sLoc, s);
        
        M = translate(vec3(0.0, y_coord, -3.0)); 

        if (jump) {
            // Week 1: 
            if (y_coord.toFixed(2) == -1.0) { Wy = 0.01; }
            if (y_coord.toFixed(2) == 0.0) { Wy = -0.01; }
            y_coord += Wy;
        };
        
        render();
        requestAnimationFrame(tick);}
        catch(e){
            console.log("Error in tick:", e);
        }
    }

    tick();

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // --- REFLECTED OBJECT --- //
        v = lookAt(eye, at, up);
        p = perspective(fovy, canvas.width / canvas.height, near, far);
        m = translate(vec3(0, y_coord, -3));

        gl.depthMask(true); // Enable depth writing for transparent objects
        gl.disable(gl.BLEND); // Disable blending for the reflected teapot
        draw_object(reflect_coeff = 1.0);// Reflected

        // --- TRANSPARENT QUAD OBJECT --- //
        gl.enable(gl.BLEND); // Enable blending for the ground
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false); // Disable depth writing for transparent objects

        v = lookAt(eye, at, up);
        p = perspective(fovy, canvas.width / canvas.height, near, far);
        m = mat4();
        draw_ground(alpha = 0.0); // Shouldn't be rendered for part 1!!

        // --- NON-REFLECTED OBJECT --- //
        gl.disable(gl.BLEND); // Disable blending for the reflected teapot
        v = lookAt(eye, at, up);
        p = perspective(fovy, canvas.width / canvas.height, near, far);
        m = translate(vec3(0, y_coord, -3));  
        draw_object(reflect_coeff = 0.0); // Non reflected

    };
};



function draw_object(reflect_coeff) {
    gl.useProgram(program_OBJECT);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vBuffer);
    gl.vertexAttribPointer(program_OBJECT.vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program_OBJECT.vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, model.nBuffer);
    gl.vertexAttribPointer(program_OBJECT.vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program_OBJECT.vNormal);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, model.cBuffer);
    gl.vertexAttribPointer(program_OBJECT.vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program_OBJECT.vColor);
    
    gl.uniformMatrix4fv(vLoc_OBJECT, false, flatten(v));
    gl.uniformMatrix4fv(pLoc_OBJECT, false, flatten(p));
    gl.uniformMatrix4fv(mLoc_OBJECT, false, flatten(m));
    gl.uniform1f(gl.getUniformLocation(program_OBJECT, "visibility"), 1.0);
    gl.uniform1i(gl.getUniformLocation(program_OBJECT, "reflected"), reflect_coeff); // Reflected: 1 --> reflected
    gl.uniform4fv(lightPositionLoc, lightPosition);
    gl.uniform3fv(l_iLoc, L_i);
    gl.uniform1f(k_aLoc, k_a);
    gl.uniform1f(k_dLoc, k_d);
    gl.uniform1f(k_sLoc, k_s);
    gl.uniform1f(sLoc, s);
    
    gl.disable(gl.CULL_FACE); // To make certain parts of teapot non-see-through
    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_INT, 0);
    }

function draw_ground(alpha) {
    gl.useProgram(program_GROUND);

    gl.uniformMatrix4fv(vLoc_GROUND, false, flatten(v));
    gl.uniformMatrix4fv(pLoc_GROUND, false, flatten(p));
    gl.uniformMatrix4fv(mLoc_GROUND, false, flatten(m));
    gl.uniform1f(gl.getUniformLocation(program_GROUND, "visibility"), 1.0);
    gl.uniform1f(gl.getUniformLocation(program_GROUND, "alpha"), alpha);

    initAttributeVariable(gl, program_GROUND.vPosition, program_GROUND.vBuffer);
    initAttributeVariable(gl, program_GROUND.vTexCoord, program_GROUND.texBuffer);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindTexture(gl.TEXTURE_2D, program_GROUND.texture);
    gl.drawArrays( gl.TRIANGLE_FAN, 0, 4);
    gl.disable(gl.BLEND);

}


function initAttributeVariable(gl, attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(attribute);
    };
    
// Create an buffer object and perform an initial configuration
function initVertexBuffers(gl, program) {
    var _obj = new Object(); // Utilize Object object to return multiple buffer objects
    _obj.vBuffer = createEmptyArrayBuffer(gl, program.vPosition, 4, gl.FLOAT);
    _obj.nBuffer = createEmptyArrayBuffer(gl, program.vNormal, 4, gl.FLOAT);
    _obj.cBuffer = createEmptyArrayBuffer(gl, program.vColor, 4, gl.FLOAT);
    _obj.idxBuffer = gl.createBuffer();
    if (!_obj.vBuffer || !_obj.nBuffer || !_obj.cBuffer || !_obj.idxBuffer) {
        return null; 
    }

    return _obj;
};
    
// Create a buffer object, assign it to attribute variables, and enable the assignment
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
    var buffer = gl.createBuffer();  // Create a buffer object
    if (!buffer) {
        console.log('Failed to create the buffer object.');
        return null;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);  // Assign the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);  // Enable the assignment

    return buffer;
}

    
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
    
var g_objDoc = null;      // The information of OBJ file
var g_drawingInfo = null; // The information for drawing 3D model


function onReadComplete(gl, model, objDoc) {
    // Acquire the vertex coordinates and colors from OBJ file
    var drawingInfo = objDoc;

    if (!drawingInfo) {
        console.log('Failed to get drawing info.');
        return null;
    }

    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.idxBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

    return drawingInfo;
}

    
function initFramebufferObject(gl, width, height) {

    var framebuffer = gl.createFramebuffer(); 
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    var renderbuffer = gl.createRenderbuffer(); 
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer); 
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

    var shadowMap = gl.createTexture(); 
    gl.activeTexture(gl.TEXTURE1); 
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