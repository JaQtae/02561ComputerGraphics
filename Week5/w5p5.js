var gl, canvas;
var orbit = 1;
var alpha = 0.0;
var aspect;
var lightPosLoc, liLoc, kaLoc, kdLoc, sLoc, eyeLoc;

var V, vLoc, pLoc, P, M, mLoc, T, R;
var radius = 1.5;
var model, g_drawingInfo;

// Constants for projectionMatrix
var fovy = 90; // angle: 
var near = 0.001; // near
var far = 50; // far

// at and up vectors for LookAt
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

// lighting stuff
// k_d (k_diffuse) --> might have to be the color
// var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var L_e = vec3(1.0, 1.0, 1.0);
var L_i = L_e;

// ambient coefficient
var k_a = 0.1;

// diffuse reflection coefficient
var k_d = 0.9;

// specular coefficient
var k_s = 0.5;

// shininess
var s = 50;

// we want direrctional light, i.e. lightpos.w = 0
var lightPos = vec4(0.0, 0.0, 1.0, 1.0); // opposite the light direction.

window.onload = function init() {
  canvas = document.getElementById("c");
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

  // coupling attributes to shaders
  gl.program.a_Position = gl.getAttribLocation(gl.program, 'vPosition');
  gl.program.a_Normal = gl.getAttribLocation(gl.program, 'vNormals');
  gl.program.a_Color = gl.getAttribLocation(gl.program, 'color');
  // gl.program.u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');

  // world matrices
  vLoc = gl.getUniformLocation(gl.program, 'viewMatrix');
  pLoc = gl.getUniformLocation(gl.program, 'projectionMatrix');
  mLoc = gl.getUniformLocation(gl.program, 'modelMatrix');

  lightPosLoc = gl.getUniformLocation(gl.program, "lightPos");
  liLoc = gl.getUniformLocation(gl.program, "L_i");
  kaLoc = gl.getUniformLocation(gl.program, "k_a");
  kdLoc = gl.getUniformLocation(gl.program, "k_d");
  ksLoc = gl.getUniformLocation(gl.program, "k_s");
  sLoc = gl.getUniformLocation(gl.program, "s");
  eyeLoc = gl.getUniformLocation(gl.program, "eye");

  // initializing buffers
  model = initVertexBuffers(gl, gl.program);
  if (!model) {
    console.log('Failed to set the vertex information');
    return;
  }

  // sliders
  var Le_slider = document.getElementById("L_e");
  Le_slider.oninput = function () {
    L_e = vec3(this.value, this.value, this.value);
    L_i = L_e;
  }

  var Ka_slider = document.getElementById("K_a");
  Ka_slider.oninput = function () {
    k_a = this.value;
  }

  var Kd_slider = document.getElementById("K_d");
  Kd_slider.oninput = function () {
    k_d = this.value;
  }

  var Ks_slider = document.getElementById("K_s");
  Ks_slider.oninput = function () {
    k_s = this.value;
  }

  var s_slider = document.getElementById("s");
  s_slider.oninput = function () {
    s = this.value;
  }

  // reading OBJ
  readOBJFile('monkey.obj', gl, model, 0.5, true);

  // Render the object.
  render();

  console.log("hello");

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
  V = lookAt(eye, at, up);

  // prrojection matrix
  aspect = canvas.width / canvas.height;
  P = perspective(fovy, aspect, near, far);

  // model matrix -- translation and rotation
  T = translate(0.0, 0.0, 0.0);
  R = mat4(); // rotate(60, [0,1,0]);

  // sending information to buffer
  gl.uniformMatrix4fv(vLoc, false, flatten(V));
  gl.uniformMatrix4fv(pLoc, false, flatten(P));
  gl.uniformMatrix4fv(mLoc, false, flatten(mult(T, R)));

  gl.uniform4fv(lightPosLoc, lightPos);
  gl.uniform3fv(liLoc, L_i);
  gl.uniform3fv(eyeLoc, eye)
  gl.uniform1f(kaLoc, k_a);
  gl.uniform1f(kdLoc, k_d);
  gl.uniform1f(ksLoc, k_s);
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
function readOBJFile(fileName, gl, model, scale, reverse) {
  var request = new XMLHttpRequest();

  request.onreadystatechange = function () {
    if (request.readyState === 4 && request.status !== 404) {
      onReadOBJFile(request.responseText, fileName, gl, model, scale, reverse);
    }
  }
  request.open('GET', fileName, true); // Create a request to acquire the file
  request.send();                      // Send the request
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