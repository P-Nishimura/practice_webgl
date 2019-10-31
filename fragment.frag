precision mediump float;

varying vec3 vColor;
varying float now_time;
varying vec2 mouse;
varying vec2 resolution;

void main()
{
    // この処理により、ピクセルの位置を -1.0 ~ 1.0 に正規化し、スクリーンの中心を(0.0, 0.0)にした座標系ができる
    vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

    float len = length(p);
    float speed = 1.0;
    float s = sin(len * 1.0 + now_time * speed);

    float len2 = length(p + vec2(sin(0.5 + now_time), 0));
    float t = sin(len2 * 10.0 - now_time * speed);

    float len3 = length(p + vec2(sin(-0.5 - now_time), 0));
    float b = sin(len3 * 10.0 - now_time * speed);

    float len4 = length(p + vec2(sin(-0.5 + now_time), 0));
    float y = sin(len4 * 10.0 - now_time * speed);

    float len5 = length(p + vec2(sin(0.5 - now_time), 0));
    float a = sin(len5 * 10.0 - now_time * speed);

    float lightPower = 0.3;
    float f = lightPower / abs(s);
    float g = lightPower - abs(t) + 0.1;
    float h = lightPower - abs(b) + 0.1;
    float i = lightPower / abs(y) + 0.05;
    float r = lightPower / abs(a) + 0.05;
    
    gl_FragColor = vec4(vec3(f + g + h + i + r) * vColor, 1.0);
}