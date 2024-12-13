// General
var gl, canvas;
var model, g_drawingInfo;
var program_GROUND, program_OBJECT;

// Camera
var v, p, m;

// LookAt()
var at = vec3(0.0, 0.0, -1.0);
var up = vec3(0.0, 1.0, 0.0);
var eye = vec3(0.0, 0.0, 0.0);

// Perspective
const fovy = 75;
const near = 0.01;
const far = 25;

// Locations
var lightPositionLoc, l_iLoc, k_aLoc, k_dLoc, k_sLoc, sLoc;
var vLoc_OBJECT, pLoc_OBJECT, mLoc_OBJECT, vLoc_GROUND, pLoc_GROUND, mLoc_GROUND;
// Gourad shading vars:
var L_e = vec3(1.0, 1.0, 1.0); // Light emission = incident light (L_i) (if V = 1 as visibility(V) * L_e)
var L_i = L_e;
var lightPosition; // Oppossite light direction
var k_a = 0.1; // Ambient reflection coefficient
var k_d = 1.0; // Diffuse reflection coefficient
var k_s = 0.6; // Specular reflection coefficient
var s = 50; // Shininess value

// Orbit vars:
var orbit = true; var radius = 2; var alpha = 0.0;
var lightCenter = vec4(0.0, 2.0, -3.0, 1.0) // Directly above teapot
var lightOrbit, lightPos; // Light calculations
var epsilon, d, T_lp, T_minuslp, Mp, Ms; // Shadow calculations
// Jump vars:
var jump = true;    
var y_coord = -0.999; 
var Wy = 0.01;
// Topview vars:
var topview = false;

// Quad texture (marble):
var pointsArray = [
  vec3(2, -1, -1), 
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

window.onload = async function init() {
  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas); 
  if (!gl) { 
      alert("WebGL isn't available"); 
  }
  var ext = gl.getExtension('OES_element_index_uint');
  if (!ext) {
    console.log('Warning: Unable to use an extension');
  }

  // Buttons
  document.getElementById("Orbit").onclick = function(){
    orbit = !orbit;
  };
  document.getElementById("Jump").onclick = function() { jump = !jump };
  document.getElementById("Topview").onclick = function() { topview = !topview 
      if (!topview) { 
          at = vec3(0.0, 0.0, -1.0); up = vec3(0.0, 1.0, 0.0); eye = vec3(0.0, 0.0, 0.0);
      } 
      else { 
          at = vec3(0.0, 0.0, -2.999); up = vec3(0.0, -1.0, 0.0); eye = vec3(0.0, 3.0, -3.0)
      };
  };

  // Initialize shaders for Quad and Teapot
  program_OBJECT = initShaders(gl, "vertex-shader-object", "fragment-shader-object");
  program_GROUND = initShaders(gl, "vertex-shader-ground", "fragment-shader-ground");

  // Quad texture loading 
  var image = document.createElement('img');
  image.crossorigin = 'anonymous';
  image.onload = function () {
      gl.useProgram(program_GROUND);
      program_GROUND.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, program_GROUND.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      gl.uniform1i(gl.getUniformLocation(program_GROUND, "texMap"), 0);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  
    };
  image.src = 'xamp23.png'; 

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);   // Enable backface culling
  gl.frontFace(gl.CCW);      // Counter-clockwise winding is the front face (default)
  

  // ------------ OBJECT ------------- //
  program_OBJECT.vPosition = gl.getAttribLocation(program_OBJECT, 'vPosition');
  program_OBJECT.vNormal = gl.getAttribLocation(program_OBJECT, 'vNormal');
  program_OBJECT.vColor = gl.getAttribLocation(program_OBJECT, 'vColor');

  vLoc_OBJECT = gl.getUniformLocation(program_OBJECT, 'viewMatrix')
  pLoc_OBJECT = gl.getUniformLocation(program_OBJECT, 'projectionMatrix');
  mLoc_OBJECT = gl.getUniformLocation(program_OBJECT, 'modelMatrix');

  lightPositionLoc = gl.getUniformLocation(program_OBJECT, 'lightPosition')
  l_iLoc = gl.getUniformLocation(program_OBJECT, 'L_i')
  k_aLoc = gl.getUniformLocation(program_OBJECT, 'k_a')
  k_dLoc = gl.getUniformLocation(program_OBJECT, 'k_d')
  k_sLoc = gl.getUniformLocation(program_OBJECT, 'k_s')
  sLoc = gl.getUniformLocation(program_OBJECT, 's')

  model = initVertexBuffers(gl, program_OBJECT);
  if (!model) {
      console.log('Failed to set the vertex information');
      return;
  }

  const drawingInfo = await readOBJFile('teapot.obj', 0.25, true);
  if (drawingInfo) {
    g_drawingInfo = onReadComplete(gl, model, drawingInfo);
    console.log("(Init) Drawing info ready!: " + g_drawingInfo);
  }

  // ------------ GROUND ------------- //
  
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

  mLoc_GROUND = gl.getUniformLocation(program_GROUND, "modelMatrix");
  vLoc_GROUND = gl.getUniformLocation(program_GROUND, "viewMatrix");
  pLoc_GROUND = gl.getUniformLocation(program_GROUND, "projectionMatrix");


  function tick() {
      if (orbit) {
        m = translate(vec3(0.0, y_coord, -3.0)); 
        alpha += 0.01;

        // Adding the orbit
        lightOrbit =  vec4(radius * Math.sin(alpha), 0.0, radius * Math.cos(alpha), 0.0);
        lightPosition = vec4(lightOrbit[0] + lightCenter[0], lightOrbit[1] + lightCenter[1], lightOrbit[2] + lightCenter[2], lightOrbit[3] + lightCenter[3]);

        // Shadow projection
        epsilon = 0.001; // Small value to make the shadows appear below ground --> Then using 
        d = - (lightPosition[1] - pointsArray[0][1] + epsilon); // y-coord of the light subtracted by y-coordinate of the plane

        // Constructing Mp
        Mp = mat4(); 
        Mp[3][1] = 1/d; 
        Mp[3][3] = 0;

        // Translation to and from space with light source as origin
        T_lp = translate(lightPosition[0], lightPosition[1], lightPosition[2]);
        T_minuslp = translate(-lightPosition[0], -lightPosition[1], -lightPosition[2]);

    }

    if (jump) {
      Wy *= Math.sign(1.0 - Math.abs(y_coord));
      y_coord += Wy;
    }

      // Calculating shadow projection matrix
      Ms = mult(mult(mult(T_lp, Mp), T_minuslp), m);

      render();
      requestAnimationFrame(tick);
  }


  tick();

  function render() {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


      v = lookAt(eye, at, up);
      p = perspective(fovy, canvas.width / canvas.height, near, far);
      m = mat4();

      draw_ground();

      v = lookAt(eye, at, up);
      p = perspective(fovy, canvas.width / canvas.height, near, far);
      m = translate(vec3(0, y_coord, -3)); // Teapot position

      draw_shadow();

      draw_object();


  };
}


function draw_object() {
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

console.log("program_TEAPOT: vertexBuffer", model.vBuffer);
console.log("program_TEAPOT: normalBuffer", model.nBuffer);
console.log("program_TEAPOT: colorBuffer", model.cBuffer);
console.log("program_TEAPOT: indexBuffer", model.iBuffer);

gl.uniformMatrix4fv(vLoc_OBJECT, false, flatten(v));
gl.uniformMatrix4fv(pLoc_OBJECT, false, flatten(p));
gl.uniformMatrix4fv(mLoc_OBJECT, false, flatten(m));
gl.uniform1f(gl.getUniformLocation(program_OBJECT, "visibility"), 1.0);
gl.uniform4fv(lightPositionLoc, lightPosition);
gl.uniform3fv(l_iLoc, L_i);
gl.uniform1f(k_aLoc, k_a);
gl.uniform1f(k_dLoc, k_d);
gl.uniform1f(k_sLoc, k_s);
gl.uniform1f(sLoc, s);

gl.depthFunc(gl.LESS);
gl.enable(gl.CULL_FACE);

gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_INT, 0);
}

function draw_ground() {
  gl.useProgram(program_GROUND);

  gl.uniformMatrix4fv(vLoc_GROUND, false, flatten(v));
  gl.uniformMatrix4fv(pLoc_GROUND, false, flatten(p));
  gl.uniformMatrix4fv(mLoc_GROUND, false, flatten(m));
  gl.uniform1f(gl.getUniformLocation(program_GROUND, "visibility"), 1.0);

  initAttributeVariable(gl, program_GROUND.vPosition, program_GROUND.vBuffer);
  initAttributeVariable(gl, program_GROUND.vTexCoord, program_GROUND.texBuffer);

  gl.depthFunc(gl.LESS);
  gl.bindTexture(gl.TEXTURE_2D, program_GROUND.texture);
  gl.drawArrays( gl.TRIANGLE_FAN, 0, 4);
}

function draw_shadow() {
gl.useProgram(program_OBJECT);
  gl.uniformMatrix4fv(mLoc_OBJECT, false, flatten(Ms));

  gl.bindBuffer(gl.ARRAY_BUFFER, model.vBuffer);
  gl.vertexAttribPointer(program_OBJECT.vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(program_OBJECT.vPosition);

  gl.bindBuffer(gl.ARRAY_BUFFER, model.nBuffer);
  gl.vertexAttribPointer(program_OBJECT.vNormal, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(program_OBJECT.vNormal);

  gl.bindBuffer(gl.ARRAY_BUFFER, model.cBuffer);
  gl.vertexAttribPointer(program_OBJECT.vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(program_OBJECT.vColor);

  // Set light position and other uniforms
  gl.uniform4fv(lightPositionLoc, lightPosition);
  gl.uniform3fv(l_iLoc, L_i);
  gl.uniform1f(k_aLoc, k_a);
  gl.uniform1f(k_dLoc, 0.0); // Disable diffuse lighting for shadows
  gl.uniform1f(k_sLoc, 0.0); // Disable specular lighting for shadows
  gl.uniform1f(sLoc, s);

  // Adjust depth function and blending for shadow rendering
  gl.depthFunc(gl.GREATER); // Render shadow on top of the ground but behind the object
  gl.enable(gl.CULL_FACE); // Enable backface culling for shadow rendering
  gl.cullFace(gl.FRONT);
  // Render the shadow by drawing the object again
  gl.uniform1f(gl.getUniformLocation(program_OBJECT, "visibility"), 0.0);
  gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_INT, 0);
  gl.disable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_INT, 0);
  gl.disable(gl.CULL_FACE)
  // Solid silhouette by back and front face culling.

}



//------------- LOAD OBJECT FUNCTIONS  -----------------//

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