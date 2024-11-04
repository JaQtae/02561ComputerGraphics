"use strict";

var gl;
var orbit = false;
var theta = 0, phi = 0;
var at, up, fovy, aspect, near, far, eye;

var light = vec4(-5, 3.5, 2,0);

var V, vLoc, pLoc, P, M, mLoc, nLoc;
var radius = 10; 
var model, g_drawingInfo;

var materialShininess = 55.0;

var lightAmbient = vec4( 0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4( 1.0, 1.0, 0.8, 1.0 );
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0 );
var ambientColor, diffuseColor, specularColor;
var ambientProduct, diffuseProduct, specularProduct;

window.onload = function init() 
{
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas); 
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW); // change order of winding

    document.getElementById("orbit").onclick = function(){
        if(orbit) orbit = false;
        else orbit = true;
    };
    
    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(gl.program);
    gl.vBuffer = null;

    gl.program.a_Position = gl.getAttribLocation(gl.program, 'a_Position'); 
    gl.program.a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');

    vLoc = gl.getUniformLocation(gl.program, 'viewMatrix');
    pLoc = gl.getUniformLocation(gl.program, 'projectionMatrix');
    mLoc = gl.getUniformLocation(gl.program, 'modelMatrix');
    nLoc = gl.getUniformLocation(gl.program, 'normalMatrix');
    
    gl.uniform1f(gl.getUniformLocation(gl.program, "shininess"), materialShininess); 
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    
    model = initVertexBuffers(gl, gl.program);
    if (!model) {
      console.log('Failed to set the vertex information');
      return;
    }

    readOBJFile('monkey.obj', gl, model, 2, true);
    // https://github.com/Lapsec/webgl-programming-guide-source-code/blob/master/ch10/OBJViewer.js

    at = vec3(0.0, 0.0, 1.0);
    up = vec3(0.0, 1.0, 0.0);
    eye = vec3(20, 50, 0);

    fovy = 45;
    aspect = canvas.width / canvas.height;
    near = 0.1;
    far = 25;

    render();
  };

function draw_object() {
    
    // initSphere(gl, numTimesToSubdivide);
    var M1 = translate(1.3, 0, 0.2);
    var M3 = rotate(0, [1,0,0]);
    var M2 = rotate(0, [0,1,0]);
    var M4 = rotate(0, [0,0,1]);
    M = mult(M1, M2);
    M = mult(M3, M2);
    M = mult(M4, M);

    model.normalMatrix = [
      vec3(M[0][0], M[0][1], M[0][2]),
      vec3(M[1][0], M[1][1], M[1][2]),
      vec3(M[2][0], M[2][1], M[2][2])
    ];
    // gl.nBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, gl.nBuffer);
    // gl.vertexAttribPointer(gl.nBuffer, 3, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(gl.nBuffer);

    gl.uniformMatrix3fv(nLoc, false, flatten(model.normalMatrix));

    gl.uniformMatrix4fv(pLoc, false, flatten(P));
    gl.uniformMatrix4fv(vLoc, false, flatten(V));
    gl.uniformMatrix4fv(mLoc, false, flatten(M));

    if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) { 
        // OBJ and all MTLs are available 
        g_drawingInfo = onReadComplete(gl, model, g_objDoc);
      }
      if (!g_drawingInfo) return;
      
    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(radius*Math.sin(theta)*Math.cos(phi),
        radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));

    V = lookAt(eye, at, up);
    P = perspective(fovy, aspect, near, far);

    if (orbit){ theta += 0.05; }
    model.vertexBuffer.num = 3; model.vertexBuffer.type = gl.FLOAT;
    initAttributeVariable(gl, gl.program.a_Position, model.vertexBuffer);
    model.normalBuffer.num = 3; model.normalBuffer.type = gl.FLOAT;
    initAttributeVariable(gl, gl.program.a_Normal, model.normalBuffer);
    gl.uniform4fv(gl.getUniformLocation(gl.program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(gl.program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(gl.program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(gl.program, "lightPosition"), flatten(light));

    draw_object();

    requestAnimationFrame(render);
}   

function initAttributeVariable(gl, attribute, buffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(attribute, buffer.num, buffer.type, false, 0, 0);
  gl.enableVertexAttribArray(attribute);
}

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
  var buffer =  gl.createBuffer();  // Create a buffer object
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

  request.onreadystatechange = function() {
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

// Coordinate transformation matrix
var g_modelMatrix = new mat4();
var g_mvpMatrix = new mat4();
var g_normalMatrix = new mat4();

// render function
function draw(gl, program, angle, viewProjMatrix, model) {
  if (g_objDoc != null && g_objDoc.isMTLComplete()){ // OBJ and all MTLs are available
    g_drawingInfo = onReadComplete(gl, model, g_objDoc);
    g_objDoc = null;
  }
  if (!g_drawingInfo) return;   // モデルを読み込み済みか判定

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear color and depth buffers

  g_modelMatrix.setRotate(angle, 1.0, 0.0, 0.0); // 適当に回転
  g_modelMatrix.rotate(angle, 0.0, 1.0, 0.0);
  g_modelMatrix.rotate(angle, 0.0, 0.0, 1.0);

  // Calculate the normal transformation matrix and pass it to u_NormalMatrix
  g_normalMatrix.setInverseOf(g_modelMatrix);
  g_normalMatrix.transpose();
  gl.uniformMatrix4fv(program.u_NormalMatrix, false, g_normalMatrix.elements);

  // Calculate the model view project matrix and pass it to u_MvpMatrix
  g_mvpMatrix.set(viewProjMatrix);
  g_mvpMatrix.multiply(g_modelMatrix);
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);

  // Draw
  gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
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

var ANGLE_STEP = 30;   // The increments of rotation angle (degrees)

var last = Date.now(); // Last time that this function was called
function animate(angle) {
  var now = Date.now();   // Calculate the elapsed time
  var elapsed = now - last;
  last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle % 360;
}


