target:
	emcc assets/c/fluid.c -O3 \
    -s EXPORTED_FUNCTIONS='["_init","_update","_add_drop","_get_values","_get_rows","_get_cols"]' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s EXPORT_ES6=1 \
    -s EXPORTED_RUNTIME_METHODS='["HEAPF32"]' \
    -o assets/c/build/fluid.js
	emcc assets/c/raymarcher.c -O3 \
    -s EXPORTED_FUNCTIONS='["_init","_update","_malloc","_free"]' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s EXPORT_ES6=1 \
    -s EXPORTED_RUNTIME_METHODS='["HEAPU8"]' \
    -o assets/c/build/raymarcher.js

format-dry:
	find . -regex '.*\.\(c\|js\)$$' \
	     -not -path '*/build/*' \
	     -not -name 'about_code.js' \
	     -not -name 'code.js' \
	     -exec clang-format --dry-run --Werror {} +

format:
	find . -regex '.*\.\(c\|js\)$$' \
	     -not -path '*/build/*' \
	     -not -name 'about_code.js' \
	     -not -name 'code.js' \
	     -exec clang-format -i {} +

