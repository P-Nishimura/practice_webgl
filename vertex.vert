attribute vec4 position;
attribute vec3 color;

uniform float time;
uniform vec2 mouse_position;
uniform vec2 res;
uniform mat4 mvpMatrix;

varying vec3 vColor;
varying float now_time;
varying vec2 mouse;
varying vec2 resolution;

void main() {
    vColor = color;
    now_time = time;
    resolution = res;
    mouse = mouse_position;

    gl_Position = mvpMatrix * position;
}