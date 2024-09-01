// Week 1 | WebGL setup for Worksheet 1

// function init(){ // Taken from Angel 2.8.7 init()
//   canvas = document.getElementById("gl-canvas");
//   gl = WebGLUtils.setupWebGL(canvas);
//   if (!gl) {
//     alert("WebGL isn’t available");
//   }

//   gl.viewport(0, 0, canvas.width, canvas.height);
//   gl.clearColor(1.0, 1.0, 1.0, 1.0);

//   // Load shaders and initialize attribute buffers
//   program = initShaders(gl, "vertex-shader", "fragment-shader");
//   gl.useProgram(program);
//   var buffer = gl.createBuffer();
//   gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
//   var vPosition = gl.getAttribLocation(program, "vPosition");
//   gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
//   gl.enableVertexAttribArray(vPosition);
//   render();
// }

// function render() { // rendering function 
//   gl.clear(gl.COLOR_BUFFER_BIT);
//   gl.drawArrays(gl.POINTS, 0, numPoints);
// }


// Function to initialize the WebGL context
function main() {
  // Get the canvas element
  var canvas = document.getElementById('gl-canvas'); // Looks into HTML file for <canvas>
  
  // Initialize the WebGL context 
  var gl = WebGLUtils.setupWebGL(canvas); // Using the utils
  
  // Check if WebGL is available and working
  if (!gl) {
      alert('Unable to initialize WebGL. Your browser may not support it.');
      return;
  }
  
  // Set the viewport to match the canvas size
  gl.viewport(0, 0, canvas.width, canvas.height);
  
  // Clear the canvas with cornflower blue color
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);  // RGBA values
  gl.clear(gl.COLOR_BUFFER_BIT);
}

// Execute and compile a given function in the window (page 76)
window.onload = main;

