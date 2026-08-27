#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#define MAX_STEPS 40
#define MAX_DIST 25.0f  // == maxDist in render(); a hit past it shades to ' ' anyway
#define EPSILON 0.001f
#define WRAP 4.0f   // period of the sphere lattice
#define FOCAL 1.5f  // focal length / FOV

// ASCII shades
// const char shadings[] = " .,-+=%#";
// const char shadings[] = " .'`^,:;Il!i><~+_-?][}{1)(|\\/*tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const char shadings[] = " .,:-=+*#%@";

// background buffer (set dynamically)
char* backgroundArray;
int width, height;

// camera
typedef struct {
    float x, y, z;
} Vec3;
Vec3 cameraPos = {0, 0, -6};
Vec3 cameraDir = {0, 0, 0};

// utility functions
Vec3 normalize(Vec3 v) {
    float len = sqrtf(v.x * v.x + v.y * v.y + v.z * v.z);
    return (Vec3){v.x / len, v.y / len, v.z / len};
}

float dot(Vec3 a, Vec3 b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

Vec3 subtract(Vec3 a, Vec3 b) {
    return (Vec3){a.x - b.x, a.y - b.y, a.z - b.z};
}

// fold a coordinate onto the nearest lattice cell, giving [-WRAP/2, WRAP/2).
// identical to the old fmod(fmod(v, w) + w, w) dance, but floorf is a single
// wasm instruction where fmod is a libm call -- and this runs 3x per march step
static inline float repeat(float v) {
    return v - WRAP * floorf(v / WRAP + 0.5f);
}

// repeated wrapped sphere of radius 1, centred in every lattice cell
float SDF(Vec3 point) {
    float x = repeat(point.x);
    float y = repeat(point.y);
    float z = repeat(point.z);
    return sqrtf(x * x + y * y + z * z) - 1.0f;
}

// raymarch
int raymarch(Vec3 rayOrigin, Vec3 rayDir, Vec3* hitPoint, float* totalDist) {
    float t = 0;
    for (int i = 0; i < MAX_STEPS; i++) {
        if (t > MAX_DIST)
            return 0;
        Vec3 point = {rayOrigin.x + rayDir.x * t, rayOrigin.y + rayDir.y * t, rayOrigin.z + rayDir.z * t};
        float dist = SDF(point);
        if (dist < EPSILON) {
            *hitPoint = point;
            *totalDist = t;
            return 1;
        }
        t += dist;
    }
    return 0;
}

// rotation (x -> z -> y)
Vec3 rotate(Vec3 v, float rx, float ry, float rz) {
    float cx = cosf(rx), sx = sinf(rx);
    float cy = cosf(ry), sy = sinf(ry);
    float cz = cosf(rz), sz = sinf(rz);

    // Apply Y (yaw) first
    float x = v.x * cy + v.z * sy;
    float z = -v.x * sy + v.z * cy;
    float y = v.y;

    // Then X (pitch)
    float ty = y * cx - z * sx;
    z = y * sx + z * cx;
    y = ty;

    // Then Z (roll)
    float tx = x * cz - y * sz;
    y = x * sz + y * cz;
    x = tx;

    return (Vec3){x, y, z};
}

// main render
void render() {
    float aspectRatio = (float)width / (float)height;
    const int shades = sizeof(shadings) - 1;

    // rotate() only depends on the camera angles, so instead of calling it (and
    // its six trig calls) once per pixel, rotate the three basis vectors once
    // and build each ray as a linear combination of them -- rotation is linear,
    // so this is exactly the old rayDir
    Vec3 right = rotate((Vec3){1, 0, 0}, cameraDir.x, cameraDir.y, cameraDir.z);
    Vec3 up = rotate((Vec3){0, 1, 0}, cameraDir.x, cameraDir.y, cameraDir.z);
    Vec3 forward = rotate((Vec3){0, 0, 1}, cameraDir.x, cameraDir.y, cameraDir.z);

    for (int y = 0; y < height; y++) {
        float nY = 1.0f - (float)y / height * 2.0f;
        char* row = backgroundArray + y * width;

        for (int x = 0; x < width; x++) {
            float nX = ((float)x / width * 2.0f - 1.0f) * aspectRatio;

            // the basis is orthonormal, so the ray's length is known without
            // touching the rotated components
            float inv = 1.0f / sqrtf(nX * nX + nY * nY + FOCAL * FOCAL);
            Vec3 rayDir = {(nX * right.x + nY * up.x + FOCAL * forward.x) * inv,
                           (nX * right.y + nY * up.y + FOCAL * forward.y) * inv,
                           (nX * right.z + nY * up.z + FOCAL * forward.z) * inv};

            Vec3 hit;
            float dist;
            if (raymarch(cameraPos, rayDir, &hit, &dist)) {
                const float maxDist = 25.0f;  // distance at which it's fully "light"
                const float minDist = 5.0f;
                float t = (dist - minDist) / (maxDist - minDist);
                if (t < 0.0f)
                    t = 0.0f;
                if (t > 1.0f)
                    t = 1.0f;

                // smoothstep: 3t² – 2t³
                t = t * t * (3.0f - 2.0f * t);

                int idx = (int)((1.0f - t) * (shades - 1));
                row[x] = shadings[idx];
            } else {
                row[x] = ' ';
            }
        }
    }
}

// Exposed functions for WASM
#ifdef __EMSCRIPTEN__
#include <emscripten.h>
EMSCRIPTEN_KEEPALIVE
void init(int w, int h, char* buffer) {
    width = w;
    height = h;
    backgroundArray = buffer;
}
EMSCRIPTEN_KEEPALIVE
void update(double time) {
    // the lattice repeats every WRAP and the angles every turn, so folding both
    // keeps the floats small no matter how long the page has been open
    cameraPos.x = fmod(sqrt(2) * time / 20000.0, WRAP);
    cameraPos.y = fmod(sqrt(3) * time / 20000.0, WRAP);
    cameraDir.x = fmod(sqrt(2) * time / 40000.0, 2 * M_PI);
    cameraDir.y = fmod(sqrt(3) * time / 40000.0, 2 * M_PI);
    cameraDir.z = fmod(sqrt(4) * time / 40000.0, 2 * M_PI);

    render();
}
#endif

int main() {
    width = 120;
    height = 50;

    backgroundArray = malloc(width * height);
    if (!backgroundArray) {
        fprintf(stderr, "malloc failed\n");
        return 1;
    }

    printf("Raymarching infinite ASCII spheres... (Ctrl+C to quit)\n\n");

    double time = 0.0;
    while (1) {
        // Animate camera
        cameraPos.x = sin(time * 0.3) * 1.5;
        cameraPos.y = sin(time * 0.2) * 1.5;
        cameraDir.y = time * 0.5;             // yaw
        cameraDir.x = sin(time * 0.4) * 0.3;  // slight pitch

        render();

        // Print frame
        for (int y = 0; y < height; y++) {
            fwrite(backgroundArray + y * width, 1, width, stdout);
            putchar('\n');
        }

        fflush(stdout);
        // usleep(60000);  // ~16 fps
        time += 0.06;
    }

    free(backgroundArray);
    return 0;
}
