import initWasm from "/assets/c/build/fluid.js";

let projects =
    [
		{
			img : "topolang.png",
			title : "Topolang",
			description : "Esoteric language based on the 'topology' of images. Different contiguous blocks define sets which can be reduced in a lambda-calculus adjacent core. Do to it's structuring and implementation, it is the only programming language I know of that can be executed despite any distortions or topology-preserving transforms. Written in C++ and compiled to WASM using em++. Try it online. Right now. Click the link above. You know you want to..",
			link : "https://johndoesstuff.github.io/topolang/",
		},
        {
            img : "unibl.png",
            title : "UNIBL Assembler & Virtual Machine",
            description :
                "In an attempt to make a universal bootstrappable computational architecture I designed the UNIBL Assembler including a preprocessor and directives along with an assembler and virtual machine with a self defining standard library to initialize macros and stack calls. All of this was made using Bison, Yacc, and C.",
            link : "https://github.com/johndoesstuff/uniblvm",
        },
        {
            img : "rubiksrays.png",
            title : "Rubiks Cube CLI",
            description :
                "Fully functional Rubiks Cube with animations and whatnot entirely in your terminal! Written in C++ with a custom rendering process entirely from scratch (other than matrix multiplication and character manipulation tools from GLM and FTXUI). Try it *right now* by clicking the link above!!",
            link : "https://johndoesstuff.github.io/rubiksrays/",
        },
        {
            img : "mincc.png",
            title : "MinCC C Compiler",
            description :
                "Tokenizes, parses, and compiles a subset of the C language to LLVM IR implementing lexical analysis, recursive descent parsing, type checking, and semantic analysis to support variable declarations, control flow, expressions, and function definitions (and much more, check out the project page!). Pictured is a screenshot of it compiling and running a simple raymarching program I wrote in C.",
            link : "https://github.com/johndoesstuff/mincc",
        },
        {
            img : "ebnf.png",
            title : "EBNF Parser Generator",
            description :
                "A TypeScript tool that parses EBNF syntax and generates a TypeScript program capable of building an abstract syntax tree (AST) for a given input. It automates the creation of parsers from formal grammar definitions, making it useful for language design, interpreters, and compilers.",
            link : "https://github.com/johndoesstuff/ebnf-parser",
        },
        {
            img : "x86raymarcher.png",
            title : "86x Assembly Raymarcher",
            description :
                "A simple raymarching engine written in x86 assembly, designed as a learning exercise in low-level programming. It renders basic 3D scenes using signed distance functions (SDFs) with a focus on minimalism and performance.",
            link : "https://github.com/johndoesstuff/asmRaymarcher",
        },
        {
            img : "windtunnel.jpg",
            title : "HackFax 2025 Wind Tunnel",
            description :
                "For HackFax 2025 my team built a wind tunnel from scratch and I designed a custom UI for the physical wind tunnel system that measures drag and lift on airfoils using load cells and an anemometer. Built entirely from scratch with no external libraries, the interface communicates with the tunnel via the Web Serial API to stream real-time sensor data, control wind speed, and generate aerodynamic profiles at varying angles of attack.",
            link : "https://github.com/johndoesstuff/hackfax2025",
        },
        {
            img : "portfolio.png",
            title : "Portfolio Website",
            description :
                "john-best.com is my personal portfolio showcasing my programming projects, technical skills, and experience in software development. I've tried to include various showcases of my skill in the backgrounds throughout this website, (try moving your mouse on the background of this page!).",
            link : "https://github.com/johndoesstuff/portfolio",
        },
        {
            img : "craymarcher.png",
            title : "C Raymarcher",
            description :
                "A real-time raymarching renderer written in C that runs directly in the terminal using ANSI escape codes for visual output. It simulates 3D scenes and calculates lighting and shadows dynamically. It also has smooth camera motion and a procedural lighting system. Optimized for performance, it updates the terminal display using a custom framebuffer in a purely text-based environment.",
            link : "https://github.com/johndoesstuff/cRaymarcher",
        },
        {
            img : "textgore.png",
            title : "TextGore",
            description :
                "This project was more made for fun because I love unicode and wanted to learn react. It's a simple web app that allows you to destroy and distort text based on various sliders and parameters. A useful utility if like me you enjoy making text more strange.",
            link : "https://github.com/johndoesstuff/textgore",
        },
        {
            img : "bas.png",
            title : "Tiny BASIC Interpreter",
            description :
                "A Tiny BASIC interpreter written in JavaScript that reads and executes programs from a file. It supports variables, arithmetic expressions, and basic control flow, demonstrating efficient parsing and execution of a minimal programming language. It follows the specification outlined in Dr. Dobb's Journal Vol. 1, no. 1. p. 9",
            link : "https://github.com/johndoesstuff/tinyBasicInterpreter",
        },
        {
            img : "wte.png",
            title : "WTE Text Editor",
            description :
                "A lightweight text editor built in C, designed for simplicity and performance. It features essential text manipulation tools such as basic editing, saving, and opening files, as well as support for handling user input and text navigation. The editor uses standard console functionality to provide a fast, responsive environment ideal for quick coding sessions and text editing",
            link : "https://github.com/johndoesstuff/WTE-Text-Editor",
        },
        {
            img : "tesseract.png",
            title : "Hypercube Wireframe Renderer",
            description :
                "This program is a real-time terminal-based renderer that visualizes an N-dimensional hypercube as a wireframe projection onto a 2D plane. It achieves this by iteratively rotating the hypercube through multiple dimensions and projecting it onto the screen using a perspective transformation. Also supporting arbitrary dimensions, it smoothly rotates the hypercube across every plane of rotation in the dimension space.",
            link : "https://github.com/johndoesstuff/hypercube-wireframe",
        },
        {
            img : "dsl.png",
            title : "DSL Tracker",
            description :
                "A lightweight C program that tracks the time since specified events. It allows users to add, remove, update, and clear events, storing them in a simple text file. The program continuously updates and displays the elapsed time for each event in real-time, formatted as years, days, hours, minutes, or seconds.",
            link : "https://github.com/johndoesstuff/dsl",
        },
        {
            img : "timeline.png",
            title : "Timeline Maker",
            description :
                "I wasn't able to find any program online that was able to make very simple timelines for comparing how long different periods of time were so I decided to hand code my own. This tools allows you to enter date ranges with titles and automatically adjusts and sorts the display for comparing different lengths of time.",
            link : "https://github.com/johndoesstuff/timelineMaker",
        }
    ]

    function makeProject(img, title, description, link) {
        let divElem = document.createElement("div");
        divElem.classList.add("project");
        let imgElem = document.createElement("img");
        imgElem.src = "/assets/images/" + img;
        let titleElem = document.createElement("h2");
        let titleLink = document.createElement("a");
        titleLink.innerText = title;
        titleLink.href = link;
        titleElem.appendChild(titleLink);
        let descriptionElem = document.createElement("p");
        descriptionElem.innerText = description;
        divElem.appendChild(imgElem);
        divElem.appendChild(titleElem);
        divElem.appendChild(descriptionElem);
        return divElem;
    }

function createProjects() {
    let projectCount = projects.length;
    for (let i = 0; i < projectCount; i++) {
        let project = projects[i];
        document.getElementById("projects")
            .appendChild(makeProject(project.img, project.title, project.description, project.link));
    }
}

createProjects();

// Navier-Stokes fluid simulation, see assets/c/fluid.c. The WASM side writes the
// finished frame out as newline terminated rows, so rendering is one decode and
// one assignment rather than concatenating a string a character at a time.

let wasm;
let bufferPtr, bufferLen;
let gridRows = 0, gridCols = 0;

const decoder = new TextDecoder();
const backgroundElem = document.getElementById("background");
const mouse = {
    x : 0,
    y : 0,
    dx : 0,
    dy : 0,
    active : false
};

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
        // applied every frame rather than on movement, so a parked cursor keeps
        // feeding smoke into the flow instead of leaving it to drift away
        if (mouse.active) {
            const cols = wasm._get_cols();
            const rows = wasm._get_rows();

            wasm._add_force(mouse.x / window.innerWidth * cols, mouse.y / window.innerHeight * rows,
                            mouse.dx / window.innerWidth * cols, mouse.dy / window.innerHeight * rows);

            // momentum comes from the movement since the last frame, so spend it
            mouse.dx = 0;
            mouse.dy = 0;
        }

        wasm._update();
        backgroundElem.textContent = decoder.decode(wasm.HEAPU8.subarray(bufferPtr, bufferPtr + bufferLen));
    }

    requestAnimationFrame(renderFrame);
}

// the cursor drags the fluid: smoke where it is, momentum from how it moved
window.onmousemove =
    function(e) {
    if (mouse.active) {
        mouse.dx += e.clientX - mouse.x;
        mouse.dy += e.clientY - mouse.y;
    }

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
