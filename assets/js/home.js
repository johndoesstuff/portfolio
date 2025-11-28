import initWasm from "/assets/c/build/raymarcher.js";

let wasmModule;
let buffer;
let bufferView;
let width, height;

async function initRaymarcher() {
    wasmModule = await initWasm();

    const bgSize = getBgSize();
    width = bgSize.cols;
    height = bgSize.rows;

    // allocate in WASM memory
    const bufferPtr = wasmModule._malloc(width * height);

    // initialize WASM
    wasmModule._init(width, height, bufferPtr);

    // create a view to read WASM memory
    buffer = new Uint8Array(wasmModule.HEAPU8.buffer, bufferPtr, width * height);

    animate();
}

initRaymarcher().then(() => {
    animate();  // start animation after WASM is ready
});

function renderWasm(time) {
    wasmModule._update(time);  // updates camera + renders into WASM buffer

    // copy buffer into JS backgroundArray
    const flat = buffer;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            window.backgroundArray[y][x] = String.fromCharCode(flat[y * width + x]);
        }
    }
}

function resizeRaymarcher() {
    if (!wasmModule)
        return;

    const bgSize = getBgSize();
    width = bgSize.cols;
    height = bgSize.rows;

    // rebuild JS background array
    window.backgroundArray = Array.from({length : height}, () => Array.from({length : width}, () => " "));

    // free old WASM buffer if it exists
    if (buffer && buffer.byteOffset !== undefined) {
        wasmModule._free(buffer.byteOffset);
    }

    // allocate new buffer
    const bufferPtr = wasmModule._malloc(width * height);

    // re-init WASM state
    wasmModule._init(width, height, bufferPtr);

    // rebuild the typed array view
    buffer = new Uint8Array(wasmModule.HEAPU8.buffer, bufferPtr, width * height);

    refreshBackground();
}

let background = document.getElementById("background");

let shadings = " .,-+=%#".split("");

let unicodes = "{}[]()ITH|YO*/\\".split("");

window.backgroundArray = null;

document.getElementById("copyright-year").innerText = (new Date()).getFullYear();

function getBgSize() {
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

function initializeBackground() {
    const bgSize = getBgSize();
    const cols = bgSize.cols;
    const rows = bgSize.rows;

    // create rows independently (no shared references)
    window.backgroundArray = Array.from({length : rows}, () => Array.from({length : cols}, () => " "));

    if (!wasmModule)
        return;

    // allocate in WASM memory
    const bufferPtr = wasmModule._malloc(width * height);

    // initialize WASM
    wasmModule._init(width, height, bufferPtr);

    // create a view to read WASM memory
    buffer = new Uint8Array(wasmModule.HEAPU8.buffer, bufferPtr, width * height);
    refreshBackground();
}

initializeBackground();

function refreshBackground() {
    background.innerText = window.backgroundArray.map(e => e.join("")).join("\n");
}

// raymarcher
function animate() {
    if (!wasmModule)
        return;  // wait for WASM to load

    renderWasm(new Date().getTime());
    addMouseRandom();
    refreshBackground();

    window.requestAnimationFrame(animate);
}

window.onresize =
    function() {
    resizeRaymarcher();
}

// mouse effects

let mouse = {
    x : 0,
    y : 0,
    asciiX : 0,
    asciiY : 0
};

let particles = [];

window.onmousemove =
    function(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    mouse.asciiX = mouse.x / window.innerWidth * window.backgroundArray[0].length;
    mouse.asciiY = mouse.y / window.innerHeight * window.backgroundArray.length;
}

function addMouseRandom() {
    for (let i = 0; i < 3; i++) {
        addMouseParticle();
    }
    tickParticles();
    const xCon = window.backgroundArray[0].length / window.innerWidth;
    const yCon = window.backgroundArray.length / window.innerHeight;
    for (let i = 0; i < particles.length; i++) {
        let px = particles[i].x * xCon;
        let py = particles[i].y * yCon;
        px = ~~px;
        py = ~~py;
        px = Math.max(0, Math.min(px, window.backgroundArray[0].length - 1));
        py = Math.max(0, Math.min(py, window.backgroundArray.length - 1));
        window.backgroundArray[py][px] = particles[i].ch;
    }
}

function addMouseParticle() {
    const theta = Math.random() * 2 * Math.PI;
    const r = 50 * Math.random() * Math.random();
    let x = r * Math.cos(theta);
    let y = r * Math.sin(theta);
    x += mouse.x;
    y += mouse.y;
    const ch = unicodes[~~(Math.random() * unicodes.length)];

    particles.push({ch, x, y, xvel : 5 * (Math.random() - 0.5), yvel : 5 * (Math.random() - 0.5), lifetime : 0});
}

function tickParticles() {
    for (let i = 0; i < particles.length; i++) {
        particles[i].lifetime++;
        particles[i].x += particles[i].xvel;
        particles[i].y += particles[i].yvel;
        particles[i].xvel /= 1.02;
        particles[i].yvel /= 1.02;
        particles[i].yvel -= 0.3;
        if (Math.random() * 100 < particles[i].lifetime) {
            particles.splice(i, 1);
            i--;
        }
    }
}
