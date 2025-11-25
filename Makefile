target:
	emcc assets/c/fluid.c -O3 \
    -s EXPORTED_FUNCTIONS='["_init","_update","_add_drop","_get_values","_get_rows","_get_cols"]' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s EXPORT_ES6=1 \
    -o assets/c/build/fluid.js
