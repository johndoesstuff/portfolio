#include <stdint.h>
#include <stdlib.h>

static int ROWS, COLS;
static float *values;
static float *buffer;

int get_rows() { return ROWS; }
int get_cols() { return COLS; }

void init(int rows, int cols) {
    ROWS = rows;
    COLS = cols;

    values = (float*)malloc(sizeof(float) * rows * cols);
    buffer = (float*)malloc(sizeof(float) * rows * cols);

    for (int i = 0; i < rows * cols; i++) {
        values[i] = 0.0f;
        buffer[i] = 0.0f;
    }
}

void add_drop(int x, int y, float amt) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
    values[y * COLS + x] += amt;
}

void update() {
    for (int y = 0; y < ROWS; y++) {
        int myh = (y + 1) % ROWS;
        int myl = (y - 1 + ROWS) % ROWS;

        for (int x = 0; x < COLS; x++) {
            int mxh = (x + 1) % COLS;
            int mxl = (x - 1 + COLS) % COLS;

            float v =
                values[y  * COLS + x] +
                values[myl* COLS + x] +
                values[myh* COLS + x] +
                values[y  * COLS + mxl] +
                values[y  * COLS + mxh];

            buffer[y * COLS + x] = v / 5.1f;
        }
    }

    float *tmp = values;
    values = buffer;
    buffer = tmp;
}

float *get_values() { return values; }
