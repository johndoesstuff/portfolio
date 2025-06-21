let projects = [
	{
		img: "mincc.png",
		title: "MinCC C Compiler",
		description: "Tokenizes, parses, and compiles a subset of the C language to LLVM IR implementing lexical analysis, recursive descent parsing, type checking, and semantic analysis to support variable declarations, control flow, expressions, and function definitions (and much more, check out the project page!). Pictured is a screenshot of it compiling and running a simple raymarching program I wrote in C.",
		link: "https://github.com/johndoesstuff/mincc",
	},
	{
		img: "ebnf.png",
		title: "EBNF Parser Generator",
		description: "A TypeScript tool that parses EBNF syntax and generates a TypeScript program capable of building an abstract syntax tree (AST) for a given input. It automates the creation of parsers from formal grammar definitions, making it useful for language design, interpreters, and compilers.",
		link: "https://github.com/johndoesstuff/ebnf-parser",
	},
	{
		img: "x86raymarcher.png",
		title: "86x Assembly Raymarcher",
		description: "A simple raymarching engine written in x86 assembly, designed as a learning exercise in low-level programming. It renders basic 3D scenes using signed distance functions (SDFs) with a focus on minimalism and performance.",
		link: "https://github.com/johndoesstuff/asmRaymarcher",
	},
	{
		img: "windtunnel.jpg",
		title: "HackFax 2025 Wind Tunnel",
		description: "For HackFax 2025 my team built a wind tunnel from scratch and I designed a custom UI for the physical wind tunnel system that measures drag and lift on airfoils using load cells and an anemometer. Built entirely from scratch with no external libraries, the interface communicates with the tunnel via the Web Serial API to stream real-time sensor data, control wind speed, and generate aerodynamic profiles at varying angles of attack.",
		link: "https://github.com/johndoesstuff/hackfax2025",
	},
	{
		img: "rubiksrays.png",
		title: "Rubiks Cube CLI",
		description: "To shapen my knowledge of C++ and the 3D rendering pipeline I created a fully functional Rubiks Cube that operates entirely in the terminal. The rendering process was written entirely from scratch other than matrix multiplication and character manipulation tools from GLM and FTXUI.",
		link: "https://github.com/johndoesstuff/rubiksrays",
	},
	{
		img: "portfolio.png",
		title: "Portfolio Website",
		description: "john-best.com is my personal portfolio showcasing my programming projects, technical skills, and experience in software development. I've tried to include various showcases of my skill in the backgrounds throughout this website, (try moving your mouse on the background of this page!).",
		link: "https://github.com/johndoesstuff/portfolio",
	},
	{
		img: "craymarcher.png",
		title: "C Raymarcher",
		description: "A real-time raymarching renderer written in C that runs directly in the terminal using ANSI escape codes for visual output. It simulates 3D scenes and calculates lighting and shadows dynamically. It also has smooth camera motion and a procedural lighting system. Optimized for performance, it updates the terminal display using a custom framebuffer in a purely text-based environment.",
		link: "https://github.com/johndoesstuff/cRaymarcher",
	},
	{
		img: "textgore.png",
		title: "TextGore",
		description: "This project was more made for fun because I love unicode and wanted to learn react. It's a simple web app that allows you to destroy and distort text based on various sliders and parameters. A useful utility if like me you enjoy making text more strange.",
		link: "https://github.com/johndoesstuff/textgore",
	},
	{
		img: "bas.png",
		title: "Tiny BASIC Interpreter",
		description: "A Tiny BASIC interpreter written in JavaScript that reads and executes programs from a file. It supports variables, arithmetic expressions, and basic control flow, demonstrating efficient parsing and execution of a minimal programming language. It follows the specification outlined in Dr. Dobb's Journal Vol. 1, no. 1. p. 9",
		link: "https://github.com/johndoesstuff/tinyBasicInterpreter",
	},
	{
		img: "wte.png",
		title: "WTE Text Editor",
		description: "A lightweight text editor built in C, designed for simplicity and performance. It features essential text manipulation tools such as basic editing, saving, and opening files, as well as support for handling user input and text navigation. The editor uses standard console functionality to provide a fast, responsive environment ideal for quick coding sessions and text editing",
		link: "https://github.com/johndoesstuff/WTE-Text-Editor",
	},
	{
		img: "tesseract.png",
		title: "Hypercube Wireframe Renderer",
		description: "This program is a real-time terminal-based renderer that visualizes an N-dimensional hypercube as a wireframe projection onto a 2D plane. It achieves this by iteratively rotating the hypercube through multiple dimensions and projecting it onto the screen using a perspective transformation. Also supporting arbitrary dimensions, it smoothly rotates the hypercube across every plane of rotation in the dimension space.",
		link: "https://github.com/johndoesstuff/hypercube-wireframe",
	},
	{
		img: "dsl.png",
		title: "DSL Tracker",
		description: "A lightweight C program that tracks the time since specified events. It allows users to add, remove, update, and clear events, storing them in a simple text file. The program continuously updates and displays the elapsed time for each event in real-time, formatted as years, days, hours, minutes, or seconds.",
		link: "https://github.com/johndoesstuff/dsl",
	},
	{
		img: "timeline.png",
		title: "Timeline Maker",
		description: "I wasn't able to find any program online that was able to make very simple timelines for comparing how long different periods of time were so I decided to hand code my own. This tools allows you to enter date ranges with titles and automatically adjusts and sorts the display for comparing different lengths of time.",
		link: "https://github.com/johndoesstuff/timelineMaker",
	}
]

function makeProject(img, title, description, link) {
	let divElem = document.createElement("div");
	divElem.classList.add("project");
	let imgElem = document.createElement("img");
	imgElem.src = img;
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
	for (let = 0; i < projectCount; i++) {
		let project = projects[i];
		document.getElementById("projects").appendChild(makeProject(project.img, project.title, project.description, project.link));
	}
}

createProjects();


//fluid simulation

window.backgroundArray = null;
window.backgroundValues = null;
window.backgroundBuffer = null;

function getBgSize() {
	let screenWidth = window.innerWidth;
	let screenHeight = document.documentElement.scrollHeight;
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

	const charWidth = charElement.offsetWidth/100;
	const charHeight = charElement.offsetHeight/100;

	const rows = Math.floor(screenHeight / charHeight);
	const cols = Math.floor(screenWidth / charWidth);

	document.body.removeChild(charElement);

	return { cols, rows };
}

function initializeBackground() {
	let bgSize = getBgSize();
	let col = bgSize.cols;
	let row = bgSize.rows;

	window.backgroundArray = JSON.parse(JSON.stringify(Array(row).fill(Array(col).fill("#"))));
	window.backgroundValues = JSON.parse(JSON.stringify(Array(row).fill(Array(col).fill(0))));
	window.backgroundBuffer = JSON.parse(JSON.stringify(Array(row).fill(Array(col).fill(0))));

	refreshBackground();
}

initializeBackground();

function refreshBackground() {
	background.innerText = window.backgroundValues.map(e => e.map(h => (h > 0.8 ? '#' : h > 0.5 ? '*' : h > 0.2 ? '-' : '.')).join("")).join("\n");
}

function addDrop(x, y, amount) {
	if (x >= 0 && x < window.backgroundArray[0].length && y >= 0 && y < window.backgroundArray.length) {
		backgroundValues[y][x] += amount;
	}
}

function updateFluid() {
	for (let y = 0; y < window.backgroundArray.length; y++) {
		for (let x = 0; x < window.backgroundArray[0].length; x++) {
			let myh = (1 + y + window.backgroundArray.length) % window.backgroundArray.length;
			let myl = (-1 + y + window.backgroundArray.length) % window.backgroundArray.length;
			let mxh = (1 + x + window.backgroundArray[0].length) % window.backgroundArray[0].length;
			let mxl = (-1 + x + window.backgroundArray[0].length) % window.backgroundArray[0].length;
			window.backgroundBuffer[y][x] = (
				window.backgroundValues[y][x] +
				window.backgroundValues[myl][x] + window.backgroundValues[myh][x] +
				window.backgroundValues[y][mxl] + window.backgroundValues[y][mxh]
			) / 5.1;
		}
	}
	[window.backgroundValues, window.backgroundBuffer] = [window.backgroundBuffer, window.backgroundValues];
}

function render() {
	addDrop(~~Math.min(Math.max(mouse.asciiX, 0), window.backgroundArray[0].length), ~~Math.min(Math.max(mouse.asciiY, 0), window.backgroundArray.length), 5);
	updateFluid()
	refreshBackground();

	//add random drop
	addDrop(~~(Math.random() * window.backgroundArray[0].length), ~~(Math.random() * window.backgroundArray.length), Math.random() * 100);

	requestAnimationFrame(render);
}

window.onresize = function() {
	initializeBackground();
}

let mouse = { x: 0, y: 0, asciiX: 0, asciiY: 0 };

window.onmousemove = function(e) {
	mouse.x = e.clientX;
	mouse.y = e.clientY+window.scrollY;

	mouse.asciiX = mouse.x / window.innerWidth * window.backgroundArray[0].length;
	mouse.asciiY = mouse.y / document.documentElement.scrollHeight * window.backgroundArray.length;
}

setTimeout(initializeBackground, 1000); //yes, its scuffed. i dont care

render();
