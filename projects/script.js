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
