let app, scrollTop = 0, cache = null;
const ANIMATION_SMOOTHNESS = 100;
let THRESHOLDS = [], FRAME_ANIMATIONS = [];
let aboutInfo = { minHeight: 0, range: 1, video: null };
let projectInfo = { range: 1, offsetTop: 0, container: null };

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
    const title = document.getElementById("title"), logo = document.getElementById("logo");
    app.style.overflow = "hidden";
    logo.style.transform = "";
    await sleep(800);
    typeTitle();
    await sleep(3200);

    logo.style.animation = "";
    app.style.overflow = "";
    title.style.animationPlayState = "";
    title.style.top = "";
    title.style.paddingTop = "";
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

let roadmapInView = false;
async function animateProjectRoadmap() {
    const roadmap = document.getElementById("projectRoadmap");
    const viewSize = 0.4;

    let observer = new IntersectionObserver(events => {
        if (projectInfo.offsetTop > 3000) return;

        for (let i = 0; i < events.length; ++i) {
            roadmap.style.transform = `rotateX(90deg) scaleY(200) translateY(${280 * (1 - events[i].intersectionRatio / viewSize)}px)`;
            if (events[i].intersectionRatio >= viewSize) 
                roadmapInView = true;
            else 
                roadmapInView = false;
        }
    }, { root: app, rootMargin: `0px 0px -${(1 - viewSize) * 100}% 0px`, threshold: THRESHOLDS });

    observer.observe(projectInfo.container);    
}

async function fetchProjects() {
    animateProjectRoadmap();
    const b = "thub_pat_11AULLZYY0h3bFX2xI4K1x_seE9z5VFQ1oGsHosCCfkjnUPasYs5JVDl5DsKWcbzaWMOJZPCKE4QZA9J3L";
    const req = await fetch("https://api.github.com/users/Saarujan-Sathees/repos", { 
        headers: { "User-Agent": "saarujan-sathees.github.io", "Authorization": `gi${b}` }
    });

    const data = await req.json();
    const minOffset = -70000, maxOffset = 2000, range = minOffset - 4200, dir = [ "left", "right" ];
    const skills = document.createElement("pre"), roadmap = document.getElementById("projectRoadmap");
    skills.classList.add("projectHeader");
    skills.textContent = "Skills";
    projectInfo.range = projectInfo.container.parentElement.clientHeight - projectInfo.container.clientHeight;
    let projects = [], offsets = [], langData, tile, title, description, languages;

    for (let i = 0; i < data.length; ++i) {
        if (data[i].name == "Saarujan-Sathees") data.splice(i, 1);
        if (data[i].name == "saarujan-sathees.github.io") data[i].name = "Portfolio Website";
    }

    const offsetDist = (maxOffset - minOffset) / data.length;
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

        tile.appendChild(title);
        tile.appendChild(description);
        tile.appendChild(skills.cloneNode(true));
        tile.appendChild(languages);
        projectInfo.container.appendChild(tile);
        projects.push(tile);
        offsets.push(minOffset + i * offsetDist);

        await sleep(400);
    }

    let percentage = 0, distance;
    queueFrame(() => {
        percentage = Math.min(1, Math.max(0, projectInfo.offsetTop / projectInfo.range));
        if (roadmapInView) roadmap.style.transform = `rotateX(90deg) scaleY(200) translateY(${280 * percentage}px)`;
        for (let i = 0; i < projects.length; ++i) {
            distance = offsets[i] + 90000 * percentage;
            projects[i].style.opacity = Math.min(1, 1 - ((distance - 4200) / range));
            projects[i].style.transform = `translateZ(${distance}px)`;
        }
    });
}

function autopauseRayAnimations() {
    let elements = document.getElementById("eclipse").children;
    let observer = new IntersectionObserver(events => {
        for (let i = 0; i < events.length; ++i) {
            if (events[i].intersectionRatio < 0.01) {
                for (let j = 0; j < elements.length; ++j) {
                    elements[j].style.animationPlayState = "paused";
                }
            } else {
                for (let j = 0; j < elements.length; ++j) {
                    elements[j].style.animationPlayState = "";
                }
            }
        }
    }, { threshold: [0.005, 0.015] });

    observer.observe(elements[0].parentElement);
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
    projectInfo.container = document.getElementById("projects");
    app.addEventListener("scroll", ev => {
        scrollTop = app.scrollTop;
        projectInfo.offsetTop = projectInfo.container.offsetTop;
    }, { passive: true });
    
    fetchProjects();
    setHoverFilter()
    autopauseRayAnimations();
    animateAboutSection();
    requestAnimationFrame(animateFrames);
    await startingAnimation();
});
