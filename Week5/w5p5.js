var gl, canvas;
var model, g_drawingInfo;
var v, p, m, vLoc, pLoc, mLoc;
// Transforms
const T = translate(0.0, 0.0, 0.0);
const R = mat4(); // Identity matrix
// LookAt()
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

const fovy = 45;
const near = 0.11;
const far = 25;

var lightPositionLoc, l_iLoc, k_aLoc, k_dLoc, k_sLoc, sLoc;
var radius = 3; var alpha = 0.0; var orbit = 1;
var L_e = vec3(1.0, 1.0, 1.0); // Light emission = incident light (L_i) (if V = 1 as visibility(V) * L_e)
var L_i = L_e;
var l_dir = vec3(0.0, 0.0, -1.0); // Direction of light source
var lightPosition = vec4(0.0, 0.0, 1.0, 0.0); // Oppossite light direction
var k_a = 0.5; // Ambient reflection coefficient
var k_d = 0.5; // Diffuse reflection coefficient
var k_s = 0.5; // Specular reflection coefficient
var shininess = 50; // Shininess value

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert("WebGL isn't available"); }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  // initializing shaders
  gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(gl.program);
  gl.vBuffer = null;

  // initializing buffers
  model = initVertexBuffers(gl, gl.program);
  if (!model) {
    console.log('Failed to set the vertex information');
    return;
  }

    // Slider Interactivity
    document.getElementById("L_e").oninput = function() {
        L_e = vec3(parseFloat(this.value), parseFloat(this.value), parseFloat(this.value));
        L_i = L_e;
        document.getElementById("L_e_val").innerHTML = this.value;
    };

    document.getElementById("K_a").oninput = function() {
        k_a = parseFloat(this.value);
        document.getElementById("K_a_val").innerHTML = this.value;
    };

    document.getElementById("K_d").oninput = function() {
        k_d = parseFloat(this.value);
        document.getElementById("K_d_val").innerHTML = this.value;
    };

    document.getElementById("K_s").oninput = function() {
        k_s = parseFloat(this.value);
        document.getElementById("K_s_val").innerHTML = this.value;
    };

    document.getElementById("s").oninput = function() {
        shininess = parseFloat(this.value);
        document.getElementById("s_val").innerHTML = this.value;
    };

    // Couple attributes with the shaders
    gl.program.vPosition = gl.getAttribLocation(gl.program, 'vPosition');
    gl.program.vNormal = gl.getAttribLocation(gl.program, 'vNormal');
    gl.program.vColor = gl.getAttribLocation(gl.program, 'vColor');
    

    // View Matrix location
    vLoc = gl.getUniformLocation(gl.program, 'viewMatrix')
    pLoc = gl.getUniformLocation(gl.program, 'projectionMatrix');
    mLoc = gl.getUniformLocation(gl.program, 'modelMatrix');

    // Gourad shading parameters
    lightPositionLoc = gl.getUniformLocation(gl.program, 'lightPosition')
    l_iLoc = gl.getUniformLocation(gl.program, 'L_i')
    k_aLoc = gl.getUniformLocation(gl.program, 'k_a')
    k_dLoc = gl.getUniformLocation(gl.program, 'k_d')
    k_sLoc = gl.getUniformLocation(gl.program, 'k_s')
    sLoc = gl.getUniformLocation(gl.program, 's')

  // reading OBJ
  readOBJFile('monkey.obj', gl, model, 0.5, true);

  // Render the object.
  render();

  console.log("rendered");

  function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // drawing the object. 
    draw_object();

    requestAnimationFrame(render);
  }
};

function draw_object() {

  if (orbit == 1) {
    alpha += 0.01;
  }

  // eye, at, up
  var eye = vec3(radius * Math.sin(alpha), 0, radius * Math.cos(alpha));

  // view matrix
  v = lookAt(eye, at, up);

  // prrojection matrix
  aspect = canvas.width / canvas.height;
  p = perspective(fovy, aspect, near, far);

  // sending information to buffer
  gl.uniformMatrix4fv(vLoc, false, flatten(v));
  gl.uniformMatrix4fv(pLoc, false, flatten(p));
  gl.uniformMatrix4fv(mLoc, false, flatten(mult(T, R)));

  gl.uniform4fv(lightPositionLoc, lightPosition);
  gl.uniform3fv(l_iLoc, L_i);
  gl.uniform1f(k_aLoc, k_a);
  gl.uniform1f(k_dLoc, k_d);
  gl.uniform1f(k_sLoc, k_s);
  gl.uniform1f(sLoc, s);

  if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
    // OBJ and all MTLs are available 
    g_drawingInfo = onReadComplete(gl, model, g_objDoc);
  }
  if (!g_drawingInfo) return;

  gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
}


// LOAD OBJECT FUNCTIONS: 

// Create an buffer object and perform an initial configuration
function initVertexBuffers(gl, program) {
  var o = new Object(); // Utilize Object object to return multiple buffer objects
  o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT);
  o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
  o.colorBuffer = createEmptyArrayBuffer(gl, program.a_Color, 4, gl.FLOAT);
  o.indexBuffer = gl.createBuffer();
  if (!o.vertexBuffer || !o.normalBuffer || !o.colorBuffer || !o.indexBuffer) { return null; }

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return o;
};

// Create a buffer object, assign it to attribute variables, and enable the assignment
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
  var buffer = gl.createBuffer();  // Create a buffer object
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);  // Assign the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);  // Enable the assignment

  return buffer;
}

// Read a file
async function readOBJFile(fileName, scale, reverse)
{
  const response = await fetch(fileName);
  if(response.ok)
  {
    var objDoc = new OBJDoc(fileName); // Create an OBJDoc object
    let fileText = await response.text();
    let result = await objDoc.parse(fileText, scale, reverse);
    if(!result) {
      console.error("OBJ file parsing error.");
      return null;
    }
    return objDoc.getDrawingInfo();
  }
  else 
    return null;
}

var g_objDoc = null;      // The information of OBJ file
var g_drawingInfo = null; // The information for drawing 3D model

// OBJ File has been read
function onReadOBJFile(fileString, fileName, gl, o, scale, reverse) {
  var objDoc = new OBJDoc(fileName);  // Create a OBJDoc object
  var result = objDoc.parse(fileString, scale, reverse); // Parse the file
  if (!result) {
    g_objDoc = null; g_drawingInfo = null;
    console.log("OBJ file parsing error.");
    return;
  }
  g_objDoc = objDoc;
}

// OBJ File has been read compreatly
function onReadComplete(gl, model, objDoc) {
  // Acquire the vertex coordinates and colors from OBJ file
  var drawingInfo = objDoc.getDrawingInfo();

  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

  return drawingInfo;
}