let background = document.getElementById("background");

let shadings = " .,-+=%#".split("");

let unicodes = "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡ΢ΣΤΥΦΧΨΩΪΫάέήίΰαβγδεζηθικλμνξοπρςστυφχψωϊϋόύώЁЂЃЄЅІЇЈЉЊЋЌЍЎЏАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюяѐёђѓєѕіїјљњћќѝўџҐґỲỳ–—―‗‘’‚“”„†‡•…‰‹›‼‾⁄ⁿ₣₤₧€№™Ω⅛⅜⅝⅞←↑→↓↔↕∂∆∏∑−∙√∞∟∩∫≈≠≡≤≥⌂⌐⌠⌡─│┌┐└┘├┤┬┴┼═║╒╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡╢╣╤╥╦╧╨╩╪╫╬▀▄".split("");

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

	refreshBackground();
}

initializeBackground();

function refreshBackground() {
	background.innerText = window.backgroundArray.map(e => e.join("")).join("\n");
}

//raymarcher

let cameraPos = { x: 0, y: 0, z: -6 };
let cameraDir = { x: 0, y: 0, z: 0 };
const lightDir = { x: 1, y: -1, z: -1 };

function normalize(vec) {
	const length = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
	return { x: vec.x / length, y: vec.y / length, z: vec.z / length };
}

function dot(a, b) {
	return a.x * b.x + a.y * b.y + a.z * b.z;
}

function subtract(a, b) {
	return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function sphereSDF(point, sphereCenter, radius) {
	let dist = subtract(point, sphereCenter);
	return Math.sqrt(dist.x * dist.x + dist.y * dist.y + dist.z * dist.z) - radius;
}

function SDF(point) {
	point = subtract(point, { x: -2, y: -2, z: -2 });
	const wrap = 4
	point.x = (point.x % wrap + wrap) % wrap;
	point.y = (point.y % wrap + wrap) % wrap;
	point.z = (point.z % wrap + wrap) % wrap;
	point = subtract(point, { x: 2, y: 2, z: 2 });
	return sphereSDF(point, { x: 0, y: 0, z: 0 }, 1);
}

function raymarch(rayOrigin, rayDir, maxSteps, maxDist, epsilon) {
	let totalDistance = 0;

	for (let i = 0; i < maxSteps; i++) {
		const point = {
			x: rayOrigin.x + rayDir.x * totalDistance,
			y: rayOrigin.y + rayDir.y * totalDistance,
			z: rayOrigin.z + rayDir.z * totalDistance,
		}

		const dist = SDF(point, { x: 0, y: 0, z: 0 }, 1);

		if (dist < epsilon) {
			return { hit: true, point, steps: i, totalDistance };
		}

		if (totalDistance > maxDist) {
			return { hit: false };
		}

		totalDistance += dist;
	}

	return { hit: false };
}

function rotate(vector, x, y, z) {

	const sin = Math.sin;
	const cos = Math.cos;

	const xm = [
		[1, 0, 0],
		[0, cos(x), -sin(x)],
		[0, sin(x), cos(x)],
	]

	const ym = [
		[cos(y), 0, sin(y)],
		[0, 1, 0],
		[-sin(y), 0, cos(y)],
	]

	const zm = [
		[cos(z), -sin(z), 0],
		[sin(z), cos(z), 0],
		[0, 0, 1],
	]

	const r = (v, m) => ({
		x: v.x * m[0][0] + v.y * m[0][1] + v.z * m[0][2],
		y: v.x * m[1][0] + v.y * m[1][1] + v.z * m[1][2],
		z: v.x * m[2][0] + v.y * m[2][1] + v.z * m[2][2],
	})

	return r(r(r(vector, xm), zm), ym); //roll -> pitch -> yaw : x -> z -> y
}

function render() {
	const width = backgroundArray[0].length;
	const height = backgroundArray.length;

	const maxSteps = 30;
	const maxDist = 100;
	const epsilon = 1e-3;

	const aspectRatio = window.innerWidth / window.innerHeight;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {

			//normalize coordinates
			const nX = (x / width) * 2 - 1;
			const nY = 1 - (y / height) * 2;

			let rayDir = normalize({
				x: nX * aspectRatio, //adjust for aspect ratio
				y: nY,
				z: 1,
			})

			rayDir = rotate(rayDir, cameraDir.x, cameraDir.y, cameraDir.z);

			const result = raymarch(cameraPos, rayDir, maxSteps, maxDist, epsilon);

			if (result.hit) {
				const sigmoid = (x) => -((2 / (1 + Math.exp(x/7))) - 1);
				const lightIntensity = Math.max(0, 1-sigmoid(result.totalDistance));

				const ch = shadings[1 + ~~(lightIntensity*(shadings.length - 1))];
				backgroundArray[y][x] = ch;
			} else {
				backgroundArray[y][x] = " ";
			}
		}
	}
}

function animate() {
	render();
	addMouseRandom();
	refreshBackground();
	cameraPos.x = Math.sqrt(2)*(new Date).getTime()/2e4;
	cameraPos.y = Math.sqrt(3)*(new Date).getTime()/2e4;
	cameraDir.x = Math.sqrt(2)*(new Date).getTime()/4e4;
	cameraDir.y = Math.sqrt(3)*(new Date).getTime()/4e4;
	cameraDir.z = Math.sqrt(4)*(new Date).getTime()/4e4;
	window.requestAnimationFrame(animate);
}

window.onresize = function() {
	initializeBackground();
}

//mouse effects

let mouse = { x: 0, y: 0, asciiX: 0, asciiY: 0 };

let particles = [];

window.onmousemove = function(e) {
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
	const r = 50*Math.random()*Math.random();
	let x = r*Math.cos(theta);
	let y = r*Math.sin(theta);
	x += mouse.x;
	y += mouse.y;
	const ch = unicodes[~~(Math.random() * unicodes.length)];

	particles.push({ ch, x, y, xvel: 5*(Math.random() - 0.5), yvel: 5*(Math.random() - 0.5), lifetime: 0 });
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

render();
refreshBackground();
animate();

