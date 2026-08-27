#include <math.h>
#include <stdio.h>
#include <stdlib.h>

// Gray-Scott reaction diffusion, rendered as ASCII.
//
// Two imaginary chemicals share a wrapping grid. U is fed in everywhere at rate
// FEED, V consumes U to reproduce (U + 2V -> 3V), and V is removed at rate
// FEED + KILL. Both diffuse, U about twice as fast as V. Nothing on screen is
// authored: every blob, split and collapse falls out of those three rules
// competing. This particular corner of the parameter space is the chaotic one,
// so unlike most of Gray-Scott it never settles into a static pattern.

#define DU 0.16f
#define DV 0.08f
#define FEED 0.014f
#define KILL 0.054f
#define DT 1.0f

#define STEPS 12    // simulation steps per rendered frame
#define WARMUP 600  // steps burned during init, so the page never opens on an empty screen

// The simulation runs coarser than the character grid and gets bilinearly
// upsampled when rendering. Gray-Scott features are a fixed handful of cells
// wide, so a coarse grid makes them large enough to read as shapes instead of
// speckle, and the interpolation gives the shading ramp smooth gradients.
#define CELL 2.0f       // simulation cells per character, horizontally
#define MAX_CELLS 9000  // grid budget, so a 4K window costs about what a laptop does

// characters are roughly twice as tall as they are wide, so the grid is twice as
// dense vertically, otherwise every blob comes out squashed into an ellipse
#define VSCALE 2

const char shadings[] = " .,-+=%#";

static int ROWS, COLS;    // character grid
static int SROWS, SCOLS;  // simulation grid
static float *u, *v, *un, *vn;
static char* buffer;  // ROWS * (COLS + 1), each row newline terminated
static unsigned int rng = 1;
static float density;  // mean V from the last render, used to notice a dead grid

int get_rows() {
    return ROWS;
}

int get_cols() {
    return COLS;
}

char* get_buffer() {
    return buffer;
}

// xorshift32, so seeding stays reproducible from a seed handed in by JS
static float frand() {
    rng ^= rng << 13;
    rng ^= rng >> 17;
    rng ^= rng << 5;
    return (float)(rng & 0xFFFFFF) / (float)0x1000000;
}

// drop a colony of V, in character space
void seed(float x, float y, float radius) {
    if (!v)
        return;

    int cx = (int)(x * SCOLS / COLS);
    int cy = (int)(y * SROWS / ROWS);
    int r = (int)radius;

    for (int dy = -r; dy <= r; dy++) {
        for (int dx = -r; dx <= r; dx++) {
            if (dx * dx + dy * dy > r * r)
                continue;

            int px = ((cx + dx) % SCOLS + SCOLS) % SCOLS;
            int py = ((cy + dy) % SROWS + SROWS) % SROWS;

            u[py * SCOLS + px] = 0.25f;
            v[py * SCOLS + px] = 0.50f;
        }
    }
}

static void scatter(int colonies) {
    for (int i = 0; i < colonies; i++) {
        seed(frand() * COLS, frand() * ROWS, 1.0f + frand() * 3.0f);
    }
}

static void step() {
    for (int y = 0; y < SROWS; y++) {
        int yl = ((y - 1) + SROWS) % SROWS;
        int yh = (y + 1) % SROWS;

        for (int x = 0; x < SCOLS; x++) {
            int xl = ((x - 1) + SCOLS) % SCOLS;
            int xh = (x + 1) % SCOLS;

            int i = y * SCOLS + x;

            // 9 point laplacian, much less grid aligned than the 5 point one
            float lu = 0.20f * (u[yl * SCOLS + x] + u[yh * SCOLS + x] + u[y * SCOLS + xl] + u[y * SCOLS + xh]) +
                       0.05f * (u[yl * SCOLS + xl] + u[yl * SCOLS + xh] + u[yh * SCOLS + xl] + u[yh * SCOLS + xh]) -
                       u[i];
            float lv = 0.20f * (v[yl * SCOLS + x] + v[yh * SCOLS + x] + v[y * SCOLS + xl] + v[y * SCOLS + xh]) +
                       0.05f * (v[yl * SCOLS + xl] + v[yl * SCOLS + xh] + v[yh * SCOLS + xl] + v[yh * SCOLS + xh]) -
                       v[i];

            float reaction = u[i] * v[i] * v[i];

            un[i] = u[i] + (DU * lu - reaction + FEED * (1.0f - u[i])) * DT;
            vn[i] = v[i] + (DV * lv + reaction - (FEED + KILL) * v[i]) * DT;
        }
    }

    float* t;
    t = u, u = un, un = t;
    t = v, v = vn, vn = t;
}

// bilinear sample of V, wrapping at the edges like the simulation does
static float sample(float sx, float sy) {
    int x0 = (int)floorf(sx);
    int y0 = (int)floorf(sy);
    float fx = sx - x0;
    float fy = sy - y0;

    int x1 = ((x0 + 1) % SCOLS + SCOLS) % SCOLS;
    int y1 = ((y0 + 1) % SROWS + SROWS) % SROWS;
    x0 = (x0 % SCOLS + SCOLS) % SCOLS;
    y0 = (y0 % SROWS + SROWS) % SROWS;

    return v[y0 * SCOLS + x0] * (1 - fx) * (1 - fy) + v[y0 * SCOLS + x1] * fx * (1 - fy) +
           v[y1 * SCOLS + x0] * (1 - fx) * fy + v[y1 * SCOLS + x1] * fx * fy;
}

static void render() {
    const int shades = sizeof(shadings) - 2;
    float total = 0.0f;

    for (int y = 0; y < ROWS; y++) {
        char* row = buffer + y * (COLS + 1);

        for (int x = 0; x < COLS; x++) {
            float a = sample((x + 0.5f) * SCOLS / COLS, (y + 0.5f) * SROWS / ROWS);
            total += a;

            float t = a / 0.32f;  // 0.32 is about where V saturates
            if (t < 0.0f)
                t = 0.0f;
            if (t > 1.0f)
                t = 1.0f;
            t = t * t * (3.0f - 2.0f * t);  // smoothstep

            row[x] = shadings[(int)(t * shades + 0.5f)];
        }

        row[COLS] = '\n';
    }

    density = total / (ROWS * COLS);
}

void init(int rows, int cols, unsigned int randomSeed) {
    ROWS = rows < 1 ? 1 : rows;
    COLS = cols < 1 ? 1 : cols;
    rng = randomSeed ? randomSeed : 1u;

    float scale = CELL;
    float cells = (COLS / scale) * (ROWS * VSCALE / scale);
    if (cells > MAX_CELLS)
        scale *= sqrtf(cells / MAX_CELLS);

    SCOLS = (int)(COLS / scale);
    SROWS = (int)(ROWS * VSCALE / scale);
    if (SCOLS < 8)
        SCOLS = 8;
    if (SROWS < 8)
        SROWS = 8;

    // init runs again on every resize, so hand back the previous grid first
    free(u);
    free(v);
    free(un);
    free(vn);
    free(buffer);

    int n = SROWS * SCOLS;
    u = malloc(sizeof(float) * n);
    v = malloc(sizeof(float) * n);
    un = malloc(sizeof(float) * n);
    vn = malloc(sizeof(float) * n);
    buffer = malloc(ROWS * (COLS + 1));

    for (int i = 0; i < n; i++) {
        u[i] = 1.0f;
        v[i] = 0.0f;
        un[i] = 1.0f;
        vn[i] = 0.0f;
    }

    scatter(SCOLS / 6 + 1);

    for (int i = 0; i < WARMUP; i++) {
        step();
    }

    render();
}

void update() {
    for (int i = 0; i < STEPS; i++) {
        step();
    }

    render();

    // V can only be made by V, so a grid that empties out would stay empty
    if (density < 0.002f)
        scatter(SCOLS / 6 + 1);
}

#ifndef __EMSCRIPTEN__
int main() {
    init(40, 140, 20141218u);

    printf("\033[2J");
    while (1) {
        update();
        printf("\033[H");
        fwrite(buffer, 1, ROWS * (COLS + 1), stdout);
        fflush(stdout);
    }

    return 0;
}
#endif
