let projects = { //object so its easier to change order if needed
	0: {
		img: "projects/ebnf.png",
		title: "EBNF Parser Generator",
		description: "A TypeScript tool that parses EBNF syntax and generates a TypeScript program capable of building an abstract syntax tree (AST) for a given input. It automates the creation of parsers from formal grammar definitions, making it useful for language design, interpreters, and compilers.",
		link: "https://github.com/johndoesstuff/ebnf-parser",
	},
	1: {
		img: "projects/x86raymarcher.png",
		title: "86x Assembly Raymarcher",
		description: "A simple raymarching engine written in x86 assembly, designed as a learning exercise in low-level programming. It renders basic 3D scenes using signed distance functions (SDFs) with a focus on minimalism and performance.",
		link: "https://github.com/johndoesstuff/asmRaymarcher",
	},
	2: {
		img: "projects/bas.png",
		title: "Tiny BASIC Interpreter",
		description: "A Tiny BASIC interpreter written in JavaScript that reads and executes programs from a file. It supports variables, arithmetic expressions, and basic control flow, demonstrating efficient parsing and execution of a minimal programming language. It follows the specification outlined in Dr. Dobb's Journal Vol. 1, no. 1. p. 9",
		link: "https://github.com/johndoesstuff/tinyBasicInterpreter",
	},
	3: {
		img: "projects/wte.png",
		title: "WTE Text Editor",
		description: "A lightweight text editor built in C, designed for simplicity and performance. It features essential text manipulation tools such as basic editing, saving, and opening files, as well as support for handling user input and text navigation. The editor uses standard console functionality to provide a fast, responsive environment ideal for quick coding sessions and text editing",
		link: "https://github.com/johndoesstuff/WTE-Text-Editor",
	},
}

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
	let projectCount = Object.keys(projects).length;
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
