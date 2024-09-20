uniform float time;
uniform sampler2D uPositions;
varying vec2 vUv;
varying vec3 vPosition;
varying vec4 vColor;

void main() {
  vUv = uv;
  vec4 pos = texture2D( uPositions, uv);

  float angle = atan(pos.y, pos.x);
  vColor = 0.9*vec4(0.5 + 0.45*sin(angle + time*0.4));

  vec4 mvPostion = modelViewMatrix * vec4(pos.xyz, 1.);
  gl_PointSize = 2. * (1. / - mvPostion.z);
  gl_Position = projectionMatrix * mvPostion;
}
