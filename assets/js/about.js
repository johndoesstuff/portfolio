function update() {
    document.getElementById("programming-duration").innerText =
        String(Math.round((new Date() - new Date("Dec 18, 2014")) / (24 * 60 * 60 * 1000 * 365) * 1e8) / 1e8)
            .padEnd(11, 0);
    window.requestAnimationFrame(update);
}

update();

const johnFacts = [
    "Instead of using 3 dots to punctuate a pause like this... I like to use 2 like this.. I do this because I think 2 dots makes more sense than 3.",
    "I play a lot of piano! I have been playing piano for like 10 years now I think. This is almost certainly outdated as I am sure I will forget to update this but I am currently working on Rachmanninov's prelude in C# minor",
    "The first time I ever ate a tomato I threw up an hour later. I really don't like tomatoes.",
	"I find black holes super fascinating. I've been trying to learn general relativity on the side to create realistic renders of them.",
	"I like to go exploring in industrial areas. I find large machinery very beautiful and a testimate to human ingenuity.",
	"I don't like LLMs and modern AI because of the hardware requirements. I believe software begs to be free for everyone and to design such intensive algorithms is to kinda defeat the point.",
	"I collect spare / abandoned computers and try to stitch their parts together into frankensteinian amalgamations.",
	"As I am writing these I am sitting on my bed at 2:34am. My roommates have long since gone to bed but I took a longer nap than I would've liked after school today.",
	"I've spent 2 years of my life working as a grill cook at Chipotle. I don't regret it and I like to think I am a skilled cook now partly because of it, but I do wish I had more job experience outside of food service.",
	"I was (am currently but I'm sure I'll forget to update this) a teachers assistant for CS405, the law capstone for CS at GMU.",
	"I think if things are worth doing, they are worth doing well. I take pride in my work.",
	"If I had to go into a non-technical field I would love to work in archival sciences. I love archiving things and I cannot let anything go.",
	"My first ever computer was a Toshiba laptop running Windows XP with and ancient version of Photoshop.",
	"I like driving a lot and going on long road trips. I bring my camera with me and take pictures of the abandoned buildings I see as I go.",
	"I don't really play any video games. I really only play minesweeper. I am very good at it.",
	"I have an ever-growing collection of programming books. Whenever I see one I cannot stop myself - especially if it's C or Unix related.",
	"My favorite book of all time is Advanced Programming in the Unix Environment (2nd edition hardcover). I read it cover to cover and commonly reference it when working with C projects.",
	"I have a tie collection consisting now of around 60 ties. The more I get the harder it is to find ones that fill a need I don't already have filled.",
	"I enjoy wearing button up shirts because it makes me feel professional. I always fear I never know where the line is between serious and silly and I frequently think I tow it in odd ways.",
	"I have been told I use the word \"interface\" in conversation very frequently. I think it is an excellent word and is frankly underutilized by most people.",
	"I own a sewing machine but I was never able to get it working. It's a side load bobbin and I looked up the manual online but couldn't find anything helpful. Hopefully someday I can get it functional so I can taylor my clothes!",
	"One summer I got bored and decided to drive to California and back while living in my car. Some of the best 2 weeks of my life.",
	"A long time before I made a math/programming Youtube channel I ran a moderately popular Geometry Dash Youtube channel.. I will not say any more than that though as it is kindof cringe for me to look back on.",
	"I don't actually know how to factor. I was absent the day they taught us in 7th grade and I have made an active effort to avoid learning as part of a running joke. I am currently a math minor and have yet to need it for anything.",
	"APL is my least favorite programming language ever. I am sorry APL fans, there are objectively cool things about it, but I just find it insufferable to try and do anything with.",
	"When I use earbuds I only use the left one. This is because I always like to have at least one ear open for listening to the outside world.",
	"I am left handed. I have read that probably means something significant for me psychologically, but I am unsure what to really derive from it other than that writing with a pen is annoying.",
	"I have never sneezed 3 or more times in a row. I have only sneezed up to twice in a row. Every time I sneeze I secretly hope it is the time I get to finally achieve 3 in a row, but it never happens.",
	"I used to drink a lot of coffee but now it upsets my stomach and I can only drink tea. I brew one glass of black tea every morning before I do anything else.",
];

function randomJohnFact() {
    document.getElementById("john-fact").innerText =
        johnFacts[Math.floor(Math.random() * johnFacts.length)];
}
