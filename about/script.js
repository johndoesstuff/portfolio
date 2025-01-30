function update() {
	document.getElementById("programming-duration").innerText = String(Math.round((new Date() - new Date("Dec 18, 2014")) / (24 * 60 * 60 * 1000 * 365) * 1e8) / 1e8).padEnd(11, 0);
	scrollParallax();
	window.requestAnimationFrame(update);
}

function scrollParallax() {
	try {
		let scrolled = window.pageYOffset/2;
		document.getElementsByTagName("pre")[0].style.transform = `translateY(${scrolled}px)`;
	} catch (e) {}
}

update();

const files = ["index.html", "about.html", "home/script.js", "home/style.css", "about/script.js", "about/style.css"];
let filesLoaded = 0;
let filesContent = [];

files.forEach(f => fetch(f).then(e => e.text().then(i => {filesContent.push(i); filesLoaded++; checkFilesLoaded()})));

function checkFilesLoaded() {
	if (filesLoaded == files.length) {
		console.log("loaded!");
		let p = document.createElement("pre");
		p.innerHTML = hljs.highlightAuto(filesContent[5]).value;
		document.getElementById("background").appendChild(p);
	}
}

window.addEventListener("scroll", scrollParallax, { passive: true });
