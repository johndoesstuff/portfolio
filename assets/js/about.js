function update() {
    document.getElementById("programming-duration").innerText =
        String(Math.round((new Date() - new Date("Dec 18, 2014")) / (24 * 60 * 60 * 1000 * 365) * 1e8) / 1e8)
            .padEnd(11, 0);
    // scrollParallax();
    window.requestAnimationFrame(update);
}

function updateParallax() {
    let scrollY = window.scrollY;
    let pres = document.getElementsByTagName("pre");
    for (let i = 0; i < pres.length; i++) {
        let scrollC = (Math.sin(i + 1) / 2)
        let scrollO = 700 + Math.sin(Math.sqrt(2) * (i + 1)) * 500;
        pres[i].style.transform = `translate3d(0, -${scrollY * scrollC + scrollO}px, 0)`;
    }
    requestAnimationFrame(updateParallax);
}

requestAnimationFrame(updateParallax);

update();

const files = [ "index.html", "about.html", "home/script.js", "home/style.css", "about/script.js", "about/style.css" ];
let filesLoaded = 0;
let filesContent = [];

for (let i = 0; i < code.length * 2; i++) {
    let p = document.createElement("pre");
    p.innerHTML = hljs.highlightAuto(code[i % code.length].content).value;
    p.style.left = (i - code.length / 2) * window.innerWidth / code.length / 2 + "px";
    document.getElementById("background").appendChild(p);
}
