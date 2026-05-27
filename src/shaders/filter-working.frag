precision highp float;

uniform sampler2D tex0;
uniform vec2 texelSize;
uniform float u_time;
uniform float u_noise_intensity;
uniform float u_dither_intensity;

varying vec2 vTexCoord;

// Simple hash function for noise
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Bayer matrix lookup using texture coordinates
float bayer4x4(vec2 fragCoord) {
    vec2 pos = mod(fragCoord, 4.0);
    float x = floor(pos.x);
    float y = floor(pos.y);
    
    // Bayer 4x4 matrix values
    float value = 0.0;
    
    if (y < 1.0) {
        if (x < 1.0) value = 0.0;
        else if (x < 2.0) value = 8.0;
        else if (x < 3.0) value = 2.0;
        else value = 10.0;
    } else if (y < 2.0) {
        if (x < 1.0) value = 12.0;
        else if (x < 2.0) value = 4.0;
        else if (x < 3.0) value = 14.0;
        else value = 6.0;
    } else if (y < 3.0) {
        if (x < 1.0) value = 3.0;
        else if (x < 2.0) value = 11.0;
        else if (x < 3.0) value = 1.0;
        else value = 9.0;
    } else {
        if (x < 1.0) value = 15.0;
        else if (x < 2.0) value = 7.0;
        else if (x < 3.0) value = 13.0;
        else value = 5.0;
    }
    
    return value / 16.0;
}

void main() {
    vec2 uv = vTexCoord;
    vec4 color = texture2D(tex0, uv);
    
    // Add noise grain
    float noise = hash(uv * 1000.0 + u_time * 10.0);
    float grain = (noise - 0.5) * u_noise_intensity;
    color.rgb += vec3(grain);
    
    // Add dither pattern
    float dither = bayer4x4(gl_FragCoord.xy);
    color.rgb *= (1.0 - u_dither_intensity * dither);
    
    gl_FragColor = color;
}
