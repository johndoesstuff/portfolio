function update() {
	document.getElementById("programming-duration").innerText = String(Math.round((new Date() - new Date("Dec 18, 2014")) / (24 * 60 * 60 * 1000 * 365) * 1e8) / 1e8).padEnd(11, 0);
	window.requestAnimationFrame(update);
}

update();
