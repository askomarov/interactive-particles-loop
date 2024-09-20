uniform sampler2D uPositions;
varying vec2 vUv;
varying vec4 vColor;

void main() {
  // vec4 pos = texture2D(uPositions, vUv);
  // gl_FragColor = vec4(1., 1., 1., 1.);
  gl_FragColor = vColor;
}
