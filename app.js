let app, scrollTop = 0, cache = null;
const ANIMATION_SMOOTHNESS = 100;
let THRESHOLDS = [], FRAME_ANIMATIONS = [];
let aboutInfo = { minHeight: 0, range: 1, video: null };
let projectContainer = null;

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function queueFrame(frame = (time) => {}) {
    FRAME_ANIMATIONS.push(frame);
}

function animateFrames(time) {
    for (let i = 0; i < FRAME_ANIMATIONS.length; ++i) {
        FRAME_ANIMATIONS[i](time);
    }

    requestAnimationFrame(animateFrames);
}

async function loadCache(element, url) {
    if (cache == null) cache = await caches.open("siteCache");

    const res = await cache.match(url);
    if (res == undefined) {
        element.src = url;
        cache.add(url);
    } else {
        element.src = URL.createObjectURL(await res.blob());
    }
}

async function typeTitle() {
    const title = document.getElementById("title");
    const name = [ "S&thinsp; ", "A&thinsp; ", "A&thinsp; ", "R&thinsp; ", "U  ", "J  ", "A  ", 
                   "N&thinsp;&thinsp;&thinsp;    ", "S  ", "A  ", "T  ", "H &thinsp;", "E &thinsp;", "E &thinsp;", "S" ];

    for (let i = 0; i < name.length; ++i) {
        title.innerHTML += name[i];
        await sleep(110);
    }
}

async function startingAnimation() {
    const eclipse = document.getElementById("eclipse"), logo = document.getElementById("logo");
    app.style.overflow = "hidden";
    await sleep(800);
    typeTitle();
    await sleep(3200);

    logo.style.animation = "";
    logo.style.transformOrigin = "top";
    app.style.overflow = "";
    document.getElementById("title").style.animation = "";
    eclipse.style.animation = "";
    eclipse.style.transformOrigin = "";
}

function setHoverFilter() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const color = getComputedStyle(document.documentElement).getPropertyValue("--secondary-color").split(" ");

    svg.innerHTML = `<filter id="hoverColor" color-interpolation-filters="sRGB">
                        <!-- change last value of first row to r/255 -->
                        <!-- change last value of second row to g/255 -->
                        <!-- change last value of third row to b/255 -->
                        <feColorMatrix type="matrix" 
                            values="0 0 0 0 ${+color[0] / 255} 
                                    0 0 0 0 ${+color[1] / 255} 
                                    0 0 0 0 ${+color[2] / 255} 
                                    0 0 0 1 0" />
                    </filter>`;
    
    svg.style.height = "0";
    document.body.appendChild(svg);
}

function observeParagraph(paragraph, cb = (ev = new IntersectionObserverEntry()) => {}, root = app, margin = "0px 0px 0px 0px") {
    let observer = new IntersectionObserver(events => {
        for (let i = 0; i < events.length; ++i) {
            cb(events[i]);
        }
    }, { root: root, rootMargin: margin, threshold: THRESHOLDS });

    for (let i = 0; i < paragraph.childElementCount; ++i) {
        observer.observe(paragraph.children[i]);
    }

    return observer;
}

function animateAboutScroll() {
    const aboutHeading = about.firstElementChild;
    let observer = new IntersectionObserver(events => {
        for (let i = 0; i < events.length; ++i) {
            aboutInfo.video.style.opacity = events[i].intersectionRatio * 0.6;
        }
    }, { root: app, rootMargin: "-20% 0px -20% 0px", threshold: THRESHOLDS });

    observer.observe(aboutHeading);
    queueFrame(() => {
        aboutInfo.video.currentTime = 20 * (scrollTop - aboutInfo.minHeight) / aboutInfo.range;
    });
}

function animateAboutSection() {
    const about = document.getElementById("about");
    const aboutText = document.getElementById("aboutText");

    aboutInfo.video = document.getElementById("aboutVideo");
    aboutInfo.minHeight = about.offsetTop - about.scrollHeight - app.offsetTop;
    aboutInfo.range = about.parentElement.clientHeight + about.parentElement.offsetTop - app.offsetTop - aboutInfo.minHeight;

    aboutInfo.video.style.filter = "brightness(0.65) contrast(1.5)";

    observeParagraph(aboutText, ev => {
        if (ev.target == aboutText.firstElementChild && ev.boundingClientRect.bottom > ev.rootBounds.bottom + 10) {
            ev.target.style.opacity = 1;
            return;
        } else if (ev.target == aboutText.lastElementChild && ev.boundingClientRect.bottom < ev.rootBounds.bottom) {
            ev.target.style.opacity = 1;
            return;
        } 

        if (ev.intersectionRatio < 0.4) 
            ev.target.style.opacity = 0.25;
        else 
            ev.target.style.opacity = Math.min(1, 0.25 + 0.85 * Math.pow(ev.intersectionRatio, 5));
    }, app, "-30% 0% -40% 0%");

    animateAboutScroll();
}

function initThresholds() {
    for (let i = 0; i < ANIMATION_SMOOTHNESS; ++i) {
        THRESHOLDS[i] = i / ANIMATION_SMOOTHNESS; 
    }
}

let dynamicKeyframes = null;
function addAnimation(body) {
    if (!dynamicKeyframes) {
        dynamicKeyframes = document.createElement('style');
        document.head.appendChild(dynamicKeyframes);
    }
  
    dynamicKeyframes.sheet.insertRule(body, dynamicKeyframes.length);
}

async function fetchProjects() {
    const b = "thub_pat_11AULLZYY0h3bFX2xI4K1x_seE9z5VFQ1oGsHosCCfkjnUPasYs5JVDl5DsKWcbzaWMOJZPCKE4QZA9J3L";
    const req = await fetch("https://api.github.com/users/Saarujan-Sathees/repos", { 
        headers: { "User-Agent": "saarujan-sathees.github.io", "Authorization": `gi${b}` }
    });

    let data = await req.json();
    const skills = document.createElement("pre"), roadmap = document.getElementById("projectRoadmap"),
          container = document.createElement("div");

    skills.classList.add("projectHeader");
    skills.textContent = "Skills";
    container.classList.add("projectContainer");

    let langData, tile, title, description, languages;
    for (let i = 0; i < data.length; ++i) {
        if (data[i].name == "Saarujan-Sathees") data.splice(i, 1);
        if (data[i].name == "saarujan-sathees.github.io") data[i].name = "Portfolio Website";
    }

    const maxOffset = 10000, offsetDist = 10000, travelDistance = offsetDist * data.length + 0.8 * maxOffset, dir = [ "left", "right" ];
    for (let i = 0; i < data.length; ++i) {
        let langReq = await fetch(data[i].languages_url, { 
            headers: { "User-Agent": "saarujan-sathees.github.io", "Authorization": `gi${b}` }
        });

        langData = Object.keys(await langReq.json());
        tile = document.createElement("a");
        tile.href = data[i].html_url;
        tile.classList.add("projectTile");
        tile.style[dir[i % 2]] = "16vw";

        title = document.createElement("pre");
        title.classList.add("projectName");
        title.textContent = data[i].name.replaceAll("-", " ");

        description = document.createElement("p");
        description.classList.add("projectDescription");
        description.textContent = data[i].description;

        languages = document.createElement("ul");
        languages.style.marginTop = "0";
        languages.style.columns = "2";
        for (let i = 0; i < langData.length; ++i) {
            let lang = document.createElement("li");
            lang.classList.add("projectDescription");
            lang.style.width = "fit-content";
            lang.textContent = langData[i];
            languages.appendChild(lang);
        }

        offsets.push(maxOffset - (data.length - i) * offsetDist);
        addAnimation(`
            @keyframes project${i} {
                0% {
                    transform: translateZ(${offsets[i]}px);
                    opacity: ${0.1 + i / data.length};
                }

                ${112 / 2.55}% {
                    transform: translateZ(${offsets[i]}px);
                    opacity: ${0.1 + i / data.length};
                }

                100% {
                    transform: translateZ(${offsets[i] + travelDistance}px);
                    opacity: 1.25;
                }
            }    
        `);

        tile.appendChild(container.cloneNode());
        tile.style.animation = `1ms both running project${i}`;
        tile.style.animationTimeline = "--appScroll";
        tile.lastChild.appendChild(title);
        tile.lastChild.appendChild(description);
        tile.lastChild.appendChild(skills.cloneNode(true));
        tile.lastChild.appendChild(languages);
        projectContainer.appendChild(tile);
    }

    addAnimation(`
        @keyframes projectRoadmap {
            0% {
                transform: rotateX(90deg) scaleY(200) translate3d(0, 280px, 40px);
            }

            ${102 / 2.55}% {
                transform: rotateX(90deg) scaleY(200) translate3d(0, 280px, 40px);
            }

            ${112 / 2.55}% {
                transform: rotateX(90deg) scaleY(200) translate3d(0, 0, 40px);
            }

            100% {
                transform: rotateX(90deg) scaleY(200) translate3d(0, 280px, 40px);
            }
        }  
    `);

    roadmap.style.animation = `1ms both running projectRoadmap`;
    roadmap.style.animationTimeline = "--appScroll";
}

function loadMedia() {
    let images = document.getElementsByTagName("img");
    for (let i = 0; i < images.length; ++i) {
        if (images[i].dataset.src != undefined)
            loadCache(images[i], location.href + '/' + images[i].dataset.src);
    }

    let videos = document.getElementsByTagName("video");
    for (let i = 0; i < videos.length; ++i) {
        if (videos[i].firstElementChild.dataset.src != undefined)
            loadCache(videos[i], location.href + '/' + videos[i].firstElementChild.dataset.src);
    }
}

async function loadResume() {
    const res = await fetch(document.getElementById("resumeContainer").href);
    let body = await res.text(), start = body.indexOf("src=\"https://drive.google.com/drive-viewer") + 5;
    document.getElementById("resume").src = body.substring(start, body.indexOf("/>", start) - 1);
}

document.addEventListener("DOMContentLoaded", async () => {
    loadMedia();
    loadResume();
    initThresholds();
    app = document.getElementById("app");
    projectContainer = document.getElementById("projects");
    fetchProjects();
    setHoverFilter()
    animateAboutSection();
    requestAnimationFrame(animateFrames);
    await startingAnimation();
});
