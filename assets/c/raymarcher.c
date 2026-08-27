#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#define MAX_STEPS 40
#define MAX_DIST 25.0f  // == maxDist in render(); a hit past it shades to ' ' anyway
#define EPSILON 0.001f
#define WRAP 4.0f   // period of the lattice
#define FOCAL 1.5f  // focal length / FOV

#define NORMAL_H 0.01f  // finite-difference step for the surface normal
#define AMBIENT 0.28f   // floor brightness, so faces turned away still read
#define EXPOSURE                                                                                                       \
    1.15f  // fog and lighting are both attenuations and compound;
           // this wins the top of the ramp back. tuned by
           // histogramming the ramp until every rung got used
#define SHAPES 4

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

// fixed world-space direction the light arrives from, pre-normalised. it leans
// back towards the camera (-z) so the faces we can see are the lit ones
const Vec3 LIGHT = {-0.396f, 0.693f, -0.601f};

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

// the primitive sitting in every lattice cell, chosen once per page load.
// each is a proper distance bound (never overestimates), which is what lets
// the marcher step by the returned value without tunnelling through a surface
int shape = 0;

static inline float sdSphere(Vec3 p) {
    return sqrtf(p.x * p.x + p.y * p.y + p.z * p.z) - 1.0f;
}

static inline float sdRoundBox(Vec3 p) {
    const float b = 0.72f, r = 0.22f;
    float qx = fabsf(p.x) - b, qy = fabsf(p.y) - b, qz = fabsf(p.z) - b;
    float ox = fmaxf(qx, 0.0f), oy = fmaxf(qy, 0.0f), oz = fmaxf(qz, 0.0f);
    float inside = fminf(fmaxf(qx, fmaxf(qy, qz)), 0.0f);
    return sqrtf(ox * ox + oy * oy + oz * oz) + inside - r;
}

static inline float sdTorus(Vec3 p) {
    const float R = 0.85f, r = 0.34f;
    float q = sqrtf(p.x * p.x + p.z * p.z) - R;
    return sqrtf(q * q + p.y * p.y) - r;
}

static inline float sdOctahedron(Vec3 p) {
    const float s = 1.35f;
    // the cheap bound rather than the exact form: still Lipschitz-1, no branches
    return (fabsf(p.x) + fabsf(p.y) + fabsf(p.z) - s) * 0.57735027f;
}

// the chosen primitive, repeated through every cell of the lattice
float SDF(Vec3 point) {
    Vec3 p = {repeat(point.x), repeat(point.y), repeat(point.z)};
    switch (shape) {
    case 1:
        return sdRoundBox(p);
    case 2:
        return sdTorus(p);
    case 3:
        return sdOctahedron(p);
    default:
        return sdSphere(p);
    }
}

// surface normal by central differences, tetrahedron variant -- 4 SDF probes
// rather than the 6 an axis-aligned difference would need
Vec3 normalAt(Vec3 p) {
    const float h = NORMAL_H;
    float a = SDF((Vec3){p.x + h, p.y - h, p.z - h});
    float b = SDF((Vec3){p.x - h, p.y - h, p.z + h});
    float c = SDF((Vec3){p.x - h, p.y + h, p.z - h});
    float d = SDF((Vec3){p.x + h, p.y + h, p.z + h});
    return normalize((Vec3){a - b - c + d, -a - b + c + d, -a + b - c + d});
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

                // half-lambert rather than plain max(dot, 0): it wraps the
                // falloff around the terminator, which the 11-step ramp reads
                // far better than a hard black hemisphere
                Vec3 n = normalAt(hit);
                float lambert = 0.5f + 0.5f * dot(n, LIGHT);
                float shade = (1.0f - t) * (AMBIENT + (1.0f - AMBIENT) * lambert) * EXPOSURE;

                int idx = (int)(shade * (shades - 1) + 0.5f);
                if (idx < 0)
                    idx = 0;
                if (idx > shades - 1)
                    idx = shades - 1;
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
    // init() runs again on every resize, so the shape is chosen here instead:
    // first frame only, seeded from the clock, and stable for the session
    static int chosen = 0;
    if (!chosen) {
        // time is Date.now(), ~1.8e12 -- casting that straight to unsigned is
        // out of range and undefined, and in wasm it saturates to UINT_MAX,
        // which would hand every visitor the same shape. fold it in first
        unsigned int h = (unsigned int)fmod(time, 4294967296.0);
        h ^= h >> 16;
        h *= 0x7feb352d;
        h ^= h >> 15;
        shape = h % SHAPES;
        chosen = 1;
    }

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
