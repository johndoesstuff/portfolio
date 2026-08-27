import initWasm from "/assets/c/build/reaction.js";

// Gray-Scott reaction diffusion, see assets/c/reaction.c. The WASM side writes
// the finished frame out as newline terminated rows, so rendering is one decode
// and one assignment rather than a per character loop.

let wasm;
let bufferPtr, bufferLen;
let gridRows = 0, gridCols = 0;

const mouse = {
    x : 0,
    y : 0,
    active : false
};

const decoder = new TextDecoder();
const backgroundElem = document.getElementById("background");

function getScreenSize() {
    let screenWidth = window.innerWidth;
    let screenHeight = window.innerHeight;
    let charElement = document.createElement("pre");
    charElement.innerText = ("M".repeat(100) + "\n").repeat(100);
    charElement.style.visibility = 'hidden';
    charElement.id = "charTester";
    charElement.style.whiteSpace = 'nowrap';
    charElement.style.position = 'absolute';
    charElement.style.fontFamily = 'monospace';
    charElement.style.margin = "0";
    charElement.style.padding = "0";
    charElement.style.border = "none";

    document.body.appendChild(charElement);

    const charWidth = charElement.offsetWidth / 100;
    const charHeight = charElement.offsetHeight / 100;

    const rows = Math.floor(screenHeight / charHeight);
    const cols = Math.floor(screenWidth / charWidth);

    document.body.removeChild(charElement);

    return {cols, rows};
}

function resize() {
    if (!wasm)
        return;

    const size = getScreenSize();

    // a resize event that did not actually change the character grid must not
    // reach _init, which would throw away the simulation and restart it empty
    if (size.rows === gridRows && size.cols === gridCols)
        return;

    gridRows = size.rows;
    gridCols = size.cols;

    wasm._init(size.rows, size.cols, Date.now() >>> 0);

    bufferPtr = wasm._get_buffer();
    bufferLen = wasm._get_rows() * (wasm._get_cols() + 1) - 1;  // drop the trailing newline
}

function renderFrame() {
    if (wasm) {
        // seeded every frame rather than on movement, so a parked cursor keeps
        // feeding its colony instead of leaving it to drift off
        if (mouse.active) {
            wasm._seed(mouse.x / window.innerWidth * wasm._get_cols(), mouse.y / window.innerHeight * wasm._get_rows(),
                       2);
        }

        wasm._update();
        backgroundElem.textContent = decoder.decode(wasm.HEAPU8.subarray(bufferPtr, bufferPtr + bufferLen));
    }

    requestAnimationFrame(renderFrame);
}

// the cursor drops colonies of V, which the simulation then grows on its own
window.onmousemove =
    function(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
}

    window.onresize = resize;

initWasm().then(module => {
    wasm = module;
    resize();
});

renderFrame();
