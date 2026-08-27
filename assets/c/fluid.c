// shoutout claude. i don't even want to pretend like i wrote this

#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Stable Fluids: Jos Stam's semi-Lagrangian solver for the incompressible
// Navier-Stokes equations (SIGGRAPH 1999), rendered as ASCII smoke.
//
// Each frame advances the velocity field by diffusing it (the viscosity term),
// projecting it back onto a divergence free field (the pressure term, which is
// what actually makes the fluid incompressible) and advecting it along itself,
// then carries the smoke density through the resulting flow the same way. Both
// the diffusion and the pressure projection come down to a sparse linear solve,
// done here with Gauss-Seidel relaxation.
//
// Two things sit on top of the paper. Vorticity confinement puts back the small
// scale curl that semi-Lagrangian advection numerically smears away, without
// which the smoke goes limp within seconds. Buoyancy pushes dense cells upward,
// so plumes rise and roll over instead of just sitting where they were emitted.

#define PROJECT_ITERS 8  // Gauss-Seidel sweeps for the pressure solve
#define VISC_ITERS 4     // ...and for viscosity, where the matrix is nearly the identity

#define DT 0.15f            // timestep, in cells (the grid spacing is 1)
#define VISC 0.04f          // kinematic viscosity
#define DISSIPATION 0.985f  // smoke fade, so the screen settles instead of filling up
#define BUOYANCY 0.55f
#define VORTICITY 0.60f
#define TOP_FADE 0.14f  // the ceiling is open, see dens_step
#define EMITTERS 8
#define EMIT_DENSITY 1.6f
#define EMIT_SPEED 1.6f
#define MOUSE_FORCE 2.5f
#define OPACITY 0.8f  // smoke absorption per unit density, see render

// init primes the field with enough steps that the very first rendered frame
// already has smoke in it, so a re-init (a resize, say) can never leave the page
// looking blank. The rest of the fill happens over the following second, several
// steps per rendered frame, which costs no visible hitch.
#define PRIME 60
#define WARMUP 200
#define WARMUP_STEPS 3

#define DENSITY_FLOOR 0.02f  // below this the field is considered empty, see update

#define MAX_CELLS 12000  // grid budget, so a 4K window costs about what a laptop does
#define VSCALE 2         // characters are twice as tall as they are wide

#define IX(i, j) ((i) + (W + 2) * (j))
#define SWAP(a, b)                                                                                                     \
    {                                                                                                                  \
        float* tmp = a;                                                                                                \
        a = b;                                                                                                         \
        b = tmp;                                                                                                       \
    }

const char shadings[] = " .,-+=%#";

static int ROWS, COLS;  // character grid
static int W, H;        // simulation grid, interior cells only
static int SIZE;        // (W + 2) * (H + 2), including the boundary ring

static float *u, *v;         // velocity
static float *u0, *v0;       // velocity sources, then solver scratch
static float *dens, *dens0;  // smoke
static float* curl;
static char* frame;  // ROWS * (COLS + 1), each row newline terminated

static unsigned int rng = 1;
static float clock_t_;  // simulation time, drives the emitters
static int warmup_left;
static float density;  // mean smoke from the last render, used to notice an empty field

int get_rows() {
    return ROWS;
}

int get_cols() {
    return COLS;
}

char* get_buffer() {
    return frame;
}

static float frand() {
    rng ^= rng << 13;
    rng ^= rng >> 17;
    rng ^= rng << 5;
    return (float)(rng & 0xFFFFFF) / (float)0x1000000;
}

// b selects how a field reflects off the walls: 1 for horizontal velocity,
// 2 for vertical velocity, 0 for a scalar like smoke or pressure
static void set_bnd(int b, float* x) {
    for (int i = 1; i <= W; i++) {
        x[IX(i, 0)] = (b == 2) ? -x[IX(i, 1)] : x[IX(i, 1)];
        x[IX(i, H + 1)] = (b == 2) ? -x[IX(i, H)] : x[IX(i, H)];
    }
    for (int j = 1; j <= H; j++) {
        x[IX(0, j)] = (b == 1) ? -x[IX(1, j)] : x[IX(1, j)];
        x[IX(W + 1, j)] = (b == 1) ? -x[IX(W, j)] : x[IX(W, j)];
    }

    x[IX(0, 0)] = 0.5f * (x[IX(1, 0)] + x[IX(0, 1)]);
    x[IX(0, H + 1)] = 0.5f * (x[IX(1, H + 1)] + x[IX(0, H)]);
    x[IX(W + 1, 0)] = 0.5f * (x[IX(W, 0)] + x[IX(W + 1, 1)]);
    x[IX(W + 1, H + 1)] = 0.5f * (x[IX(W, H + 1)] + x[IX(W + 1, H)]);
}

static void lin_solve(int b, float* x, float* x0, float a, float c, int iters) {
    float inv = 1.0f / c;

    for (int k = 0; k < iters; k++) {
        for (int j = 1; j <= H; j++) {
            for (int i = 1; i <= W; i++) {
                x[IX(i, j)] =
                    (x0[IX(i, j)] + a * (x[IX(i - 1, j)] + x[IX(i + 1, j)] + x[IX(i, j - 1)] + x[IX(i, j + 1)])) * inv;
            }
        }
        set_bnd(b, x);
    }
}

static void diffuse(int b, float* x, float* x0, float rate) {
    float a = DT * rate;
    lin_solve(b, x, x0, a, 1.0f + 4.0f * a, VISC_ITERS);
}

// trace each cell backwards along the velocity field and sample where it came from
static void advect(int b, float* d, float* d0, float* uu, float* vv) {
    for (int j = 1; j <= H; j++) {
        for (int i = 1; i <= W; i++) {
            float x = i - DT * uu[IX(i, j)];
            float y = j - DT * vv[IX(i, j)];

            if (x < 0.5f)
                x = 0.5f;
            if (x > W + 0.5f)
                x = W + 0.5f;
            if (y < 0.5f)
                y = 0.5f;
            if (y > H + 0.5f)
                y = H + 0.5f;

            int i0 = (int)x, i1 = i0 + 1;
            int j0 = (int)y, j1 = j0 + 1;
            float s1 = x - i0, s0 = 1.0f - s1;
            float t1 = y - j0, t0 = 1.0f - t1;

            d[IX(i, j)] =
                s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) + s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)]);
        }
    }
    set_bnd(b, d);
}

// solve for the pressure whose gradient cancels the divergence, then subtract it
static void project(float* uu, float* vv, float* p, float* div) {
    for (int j = 1; j <= H; j++) {
        for (int i = 1; i <= W; i++) {
            div[IX(i, j)] = -0.5f * (uu[IX(i + 1, j)] - uu[IX(i - 1, j)] + vv[IX(i, j + 1)] - vv[IX(i, j - 1)]);
            p[IX(i, j)] = 0.0f;
        }
    }
    set_bnd(0, div);
    set_bnd(0, p);

    lin_solve(0, p, div, 1.0f, 4.0f, PROJECT_ITERS);

    for (int j = 1; j <= H; j++) {
        for (int i = 1; i <= W; i++) {
            uu[IX(i, j)] -= 0.5f * (p[IX(i + 1, j)] - p[IX(i - 1, j)]);
            vv[IX(i, j)] -= 0.5f * (p[IX(i, j + 1)] - p[IX(i, j - 1)]);
        }
    }
    set_bnd(1, uu);
    set_bnd(2, vv);
}

// push velocity back along the gradient of vorticity magnitude, restoring the
// curl that advection damps out
static void confine_vorticity() {
    for (int j = 1; j <= H; j++) {
        for (int i = 1; i <= W; i++) {
            curl[IX(i, j)] = 0.5f * ((v[IX(i + 1, j)] - v[IX(i - 1, j)]) - (u[IX(i, j + 1)] - u[IX(i, j - 1)]));
        }
    }

    for (int j = 2; j <= H - 1; j++) {
        for (int i = 2; i <= W - 1; i++) {
            float dx = 0.5f * (fabsf(curl[IX(i + 1, j)]) - fabsf(curl[IX(i - 1, j)]));
            float dy = 0.5f * (fabsf(curl[IX(i, j + 1)]) - fabsf(curl[IX(i, j - 1)]));
            float len = sqrtf(dx * dx + dy * dy) + 1e-5f;

            float c = curl[IX(i, j)] * VORTICITY * DT;
            u[IX(i, j)] += dy / len * c;
            v[IX(i, j)] -= dx / len * c;
        }
    }
}

static void splat(float* field, float cx, float cy, float radius, float amount) {
    int r = (int)radius + 1;

    for (int dy = -r; dy <= r; dy++) {
        for (int dx = -r; dx <= r; dx++) {
            int i = (int)cx + dx, j = (int)cy + dy;
            if (i < 1 || i > W || j < 1 || j > H)
                continue;

            float d2 = dx * dx + dy * dy;
            if (d2 > radius * radius)
                continue;

            field[IX(i, j)] += amount * expf(-d2 / (radius * radius) * 2.0f);
        }
    }
}

// the cursor drags the fluid: smoke where it is, momentum from how it moved
void add_force(float x, float y, float dx, float dy) {
    if (!u0)
        return;

    float cx = x * W / COLS;
    float cy = y * H / ROWS;
    float radius = H * 0.05f + 2.0f;

    splat(dens0, cx, cy, radius, EMIT_DENSITY * 0.9f);
    splat(u0, cx, cy, radius, dx * W / COLS * MOUSE_FORCE);
    splat(v0, cx, cy, radius, dy * H / ROWS * MOUSE_FORCE);
}

static void add_emitters() {
    for (int e = 0; e < EMITTERS; e++) {
        float phase = e * 2.399963f;  // golden angle, so the plumes stay out of step
        float cx = (e + 0.5f) / EMITTERS * W + sinf(clock_t_ * 0.31f + phase) * W * 0.05f;
        float cy = H - 1.5f;
        float radius = H * 0.05f + 1.5f;

        splat(dens0, cx, cy, radius, EMIT_DENSITY);
        splat(v0, cx, cy, radius, -EMIT_SPEED);
        splat(u0, cx, cy, radius, cosf(clock_t_ * 0.53f + phase) * 1.1f);
    }

    // an occasional puff off to the side, so the plumes never fall into a loop
    if (frand() < 0.04f) {
        float cx = frand() * W;
        float cy = H * (0.45f + frand() * 0.5f);
        splat(dens0, cx, cy, H * 0.05f + 1.5f, EMIT_DENSITY * 0.8f);
        splat(u0, cx, cy, H * 0.05f + 1.5f, (frand() - 0.5f) * 6.0f);
    }
}

static void add_source(float* x, float* s) {
    for (int i = 0; i < SIZE; i++) {
        x[i] += DT * s[i];
    }
}

static void vel_step() {
    add_source(u, u0);
    add_source(v, v0);

    for (int i = 0; i < SIZE; i++) {
        v[i] -= DT * BUOYANCY * dens[i];  // upward is -y
    }
    confine_vorticity();

    SWAP(u0, u);
    diffuse(1, u, u0, VISC);
    SWAP(v0, v);
    diffuse(2, v, v0, VISC);

    project(u, v, u0, v0);

    SWAP(u0, u);
    SWAP(v0, v);
    advect(1, u, u0, u0, v0);
    advect(2, v, v0, u0, v0);

    project(u, v, u0, v0);
}

static void dens_step() {
    add_source(dens, dens0);

    // no explicit diffusion term: semi-Lagrangian advection already smears the
    // smoke plenty, and adding more turns the plumes to fog
    SWAP(dens0, dens);
    advect(0, dens, dens0, u, v);

    for (int i = 0; i < SIZE; i++) {
        dens[i] *= DISSIPATION;
    }

    // the ceiling is open: smoke reaching the top is carried off rather than
    // piling up against the boundary into a flat haze
    int fade = H / 4 + 1;
    for (int j = 1; j <= fade; j++) {
        float k = 1.0f - TOP_FADE * (1.0f - (float)(j - 1) / fade);
        for (int i = 0; i <= W + 1; i++) {
            dens[IX(i, j)] *= k;
        }
    }
}

static float sample(float sx, float sy) {
    int i0 = (int)sx, j0 = (int)sy;
    float fx = sx - i0, fy = sy - j0;

    if (i0 < 0)
        i0 = 0;
    if (i0 > W)
        i0 = W;
    if (j0 < 0)
        j0 = 0;
    if (j0 > H)
        j0 = H;
    int i1 = i0 + 1, j1 = j0 + 1;

    return dens[IX(i0, j0)] * (1 - fx) * (1 - fy) + dens[IX(i1, j0)] * fx * (1 - fy) +
           dens[IX(i0, j1)] * (1 - fx) * fy + dens[IX(i1, j1)] * fx * fy;
}

static void render() {
    const int shades = sizeof(shadings) - 2;
    float total = 0.0f;

    for (int y = 0; y < ROWS; y++) {
        char* row = frame + y * (COLS + 1);

        for (int x = 0; x < COLS; x++) {
            float d = sample(0.5f + (x + 0.5f) * W / COLS, 0.5f + (y + 0.5f) * H / ROWS);
            total += d;

            // Beer-Lambert: thin smoke is nearly transparent and thick smoke
            // saturates, which spreads the shading ramp over the range the
            // density field actually occupies
            float t = 1.0f - expf(-d * OPACITY);

            row[x] = shadings[(int)(t * shades + 0.5f)];
        }

        row[COLS] = '\n';
    }

    density = total / (ROWS * COLS);
}

static void step() {
    add_emitters();
    vel_step();
    dens_step();

    // the swaps above left the source arrays holding solver scratch, so clear
    // them here rather than at the top of the frame: add_force writes into them
    // between updates
    memset(u0, 0, sizeof(float) * SIZE);
    memset(v0, 0, sizeof(float) * SIZE);
    memset(dens0, 0, sizeof(float) * SIZE);

    clock_t_ += DT * 0.1f;
}

void update() {
    int steps = 1;
    if (warmup_left > 0) {
        steps = WARMUP_STEPS;
        warmup_left -= WARMUP_STEPS;
    }

    for (int s = 0; s < steps; s++) {
        step();
    }

    render();

    // The emitters run every step, so the field should never empty out. This is
    // a backstop: if it somehow does, prime it again rather than leave the page
    // showing nothing.
    if (density < DENSITY_FLOOR) {
        for (int i = 0; i < PRIME; i++) {
            step();
        }
        render();
    }
}

void init(int rows, int cols, unsigned int randomSeed) {
    ROWS = rows < 1 ? 1 : rows;
    COLS = cols < 1 ? 1 : cols;
    rng = randomSeed ? randomSeed : 1u;
    clock_t_ = 0.0f;

    float scale = 1.0f;
    float cells = (float)COLS * ROWS * VSCALE;
    if (cells > MAX_CELLS)
        scale = sqrtf(cells / MAX_CELLS);

    W = (int)(COLS / scale);
    H = (int)(ROWS * VSCALE / scale);
    if (W < 8)
        W = 8;
    if (H < 8)
        H = 8;
    SIZE = (W + 2) * (H + 2);

    // init runs again on every resize, so hand back the previous grid first
    free(u);
    free(v);
    free(u0);
    free(v0);
    free(dens);
    free(dens0);
    free(curl);
    free(frame);

    u = calloc(SIZE, sizeof(float));
    v = calloc(SIZE, sizeof(float));
    u0 = calloc(SIZE, sizeof(float));
    v0 = calloc(SIZE, sizeof(float));
    dens = calloc(SIZE, sizeof(float));
    dens0 = calloc(SIZE, sizeof(float));
    curl = calloc(SIZE, sizeof(float));
    frame = malloc(ROWS * (COLS + 1));

    warmup_left = WARMUP;

    for (int i = 0; i < PRIME; i++) {
        step();
    }
    render();
}

#ifndef __EMSCRIPTEN__
int main() {
    init(40, 140, 20141218u);

    printf("\033[2J");
    while (1) {
        update();
        printf("\033[H");
        fwrite(frame, 1, ROWS * (COLS + 1), stdout);
        fflush(stdout);
    }

    return 0;
}
#endif
