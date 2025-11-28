#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#define MAX_STEPS 40
#define MAX_DIST 30
#define EPSILON 0.001

// ASCII shades
// const char shadings[] = " .,-+=%#";
// const char shadings[] = " .'`^,:;Il!i><~+_-?][}{1)(|\\/*tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const char shadings[] = " .,:-=+*#%@";

// background buffer (set dynamically)
char* backgroundArray;
int width, height;

// camera
typedef struct {
    double x, y, z;
} Vec3;
Vec3 cameraPos = {0, 0, -6};
Vec3 cameraDir = {0, 0, 0};

// utility functions
Vec3 normalize(Vec3 v) {
    double len = sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    return (Vec3){v.x / len, v.y / len, v.z / len};
}

double dot(Vec3 a, Vec3 b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

Vec3 subtract(Vec3 a, Vec3 b) {
    return (Vec3){a.x - b.x, a.y - b.y, a.z - b.z};
}

// SDF for a single sphere
double sphereSDF(Vec3 point, Vec3 center, double radius) {
    Vec3 d = subtract(point, center);
    return sqrt(d.x * d.x + d.y * d.y + d.z * d.z) - radius;
}

// repeated wrapped sphere
double SDF(Vec3 point) {
    point = subtract(point, (Vec3){-2, -2, -2});
    double wrap = 4;
    point.x = fmod(fmod(point.x, wrap) + wrap, wrap);
    point.y = fmod(fmod(point.y, wrap) + wrap, wrap);
    point.z = fmod(fmod(point.z, wrap) + wrap, wrap);
    point = subtract(point, (Vec3){2, 2, 2});
    return sphereSDF(point, (Vec3){0, 0, 0}, 1);
}

// raymarch
int raymarch(Vec3 rayOrigin, Vec3 rayDir, Vec3* hitPoint, double* totalDist) {
    double t = 0;
    for (int i = 0; i < MAX_STEPS; i++) {
        Vec3 point = {rayOrigin.x + rayDir.x * t, rayOrigin.y + rayDir.y * t, rayOrigin.z + rayDir.z * t};
        double dist = SDF(point);
        if (dist < EPSILON) {
            *hitPoint = point;
            *totalDist = t;
            return 1;
        }
        if (t > MAX_DIST)
            return 0;
        t += dist;
    }
    return 0;
}

// rotation (x -> z -> y)
Vec3 rotate(Vec3 v, double rx, double ry, double rz) {
    double cx = cos(rx), sx = sin(rx);
    double cy = cos(ry), sy = sin(ry);
    double cz = cos(rz), sz = sin(rz);

    // Apply Y (yaw) first
    double x = v.x * cy + v.z * sy;
    double z = -v.x * sy + v.z * cy;
    double y = v.y;

    // Then X (pitch)
    double ty = y * cx - z * sx;
    z = y * sx + z * cx;
    y = ty;

    // Then Z (roll)
    double tx = x * cz - y * sz;
    y = x * sz + y * cz;
    x = tx;

    return (Vec3){x, y, z};
}

// main render
void render() {
    double aspectRatio = (double)width / (double)height;

    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            double nX = (double)x / width * 2.0 - 1.0;
            double nY = 1.0 - (double)y / height * 2.0;

            Vec3 rayDir = (Vec3){nX * aspectRatio, nY, 1.5};  // 1.5 = focal length / FOV
            rayDir = rotate(rayDir, cameraDir.x, cameraDir.y, cameraDir.z);
            rayDir = normalize(rayDir);  // now normalize AFTER rotation

            Vec3 hit;
            double dist;
            int hitResult = raymarch(cameraPos, rayDir, &hit, &dist);

            if (hitResult) {
                double maxDist = 25.0;  // distance at which it's fully "light"
                double minDist = 5.0;
                double t = (dist - minDist) / (maxDist - minDist);
                if (t < 0.0)
                    t = 0.0;
                if (t > 1.0)
                    t = 1.0;

                // smoothstep: 3t² – 2t³
                t = t * t * (3.0 - 2.0 * t);

                int shades = sizeof(shadings) - 1;
                int idx = (int)((1.0 - t) * (shades - 1));
                backgroundArray[y * width + x] = shadings[idx];
            } else {
                backgroundArray[y * width + x] = ' ';
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
    cameraPos.x = sqrt(2) * time / 20000.0;
    cameraPos.y = sqrt(3) * time / 20000.0;
    cameraDir.x = sqrt(2) * time / 40000.0;
    cameraDir.y = sqrt(3) * time / 40000.0;
    cameraDir.z = sqrt(4) * time / 40000.0;

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
