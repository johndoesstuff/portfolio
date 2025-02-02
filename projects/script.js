let projects = { //object so its easier to change order if needed
	0: {
		img: "projects/placeholder.png",
		title: "Project Name",
		description: "Medium length blurb describing what the project does and why it's important. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam consectetur odio erat, in interdum dolor accumsan ut. Sed venenatis vitae felis in semper.",
	}
}

function makeProject(img, title, description) {
	let divElem = document.createElement("div");
	divElem.classList.add("project");
	let imgElem = document.createElement("img");
	imgElem.src = img;
	let titleElem = document.createElement("h2");
	titleElem.innerText = title;
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
		document.getElementById("projects").appendChild(makeProject(project.img, project.title, project.description));
	}
}

createProjects();
