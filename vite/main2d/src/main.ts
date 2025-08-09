import { FLOORS } from './constants';
import { getConfig, isMusic, isSmoothScroll, toggleMusic, toggleSmoothScroll, wait, writeConfig } from './helpers/control';
import { disableStylesheet, enableStylesheet } from './helpers/css';
import { clamp, realOrNotFoundFloor } from './helpers/math';
import { fetchText } from './helpers/reader';
import { floor } from './states';
import { LazyLoader } from './types/misc';

const page = window.location.pathname.split("/").pop();
let currentFloor = ((Array.from(FLOORS.keys()).indexOf(page == "2d" || !page ? "ground" : page) + 1) || (404 + 1)) - 1, targetFloor = currentFloor;
let moving = 0; // 1 means up, -1 means down, 0 means not moving
let state = 0; // 0 inside, 1 opening, 2 zooming, 3 htmling, 4 backing, 5 stay, 6 closing
let elevatorScale = 1; // scale for resizing

// setup element references
const background = document.querySelector<HTMLDivElement>("#background")!;
const elevator = document.querySelector<HTMLDivElement>("#elevator")!;
const info = document.querySelector<HTMLDivElement>("#info")!;
const closer = document.querySelector<HTMLDivElement>("#closer")!;
const upButton = document.querySelector<SVGTextPathElement>("#up-button")!;
const downButton = document.querySelector<SVGTextPathElement>("#down-button")!;
const floorButton = document.querySelector<SVGGElement>("#display")!;
const leftDoor = document.querySelector<SVGRectElement>("#left-door")!;
const rightDoor = document.querySelector<SVGRectElement>("#right-door")!;
const floorDisplay = document.querySelector<SVGTSpanElement>("#floor")!;
const musicButton = document.querySelector<SVGGElement>("#speaker-button")!;
const musicLight = document.querySelector<SVGCircleElement>("#speaker-light")!;
const donationBox = document.querySelector<SVGGElement>("#donation")!;
const suggestionBox = document.querySelector<SVGGElement>("#suggestion-box")!;
const smoothScroll = document.querySelector<SVGGElement>("#smooth-scroll")!;
const yesSmooth = document.querySelector<SVGPathElement>("#yes-smooth")!;
const noSmooth = document.querySelector<SVGPathElement>("#no-smooth")!;

// elevator content
const donationContent = new LazyLoader(() => fetchText("/contents/elevator/donation.html"));
const suggestionContent = new LazyLoader(() => fetchText("/contents/elevator/suggestion.html"));

// update floor display
function updateDisplay() {
  if (moving > 0) floorDisplay.innerHTML = "▲";
  else if (moving < 0) floorDisplay.innerHTML = "▼";
  else if (targetFloor == 0) floorDisplay.innerHTML = "G";
  else if (targetFloor < 0 || targetFloor >= FLOORS.size) floorDisplay.innerHTML = "?";
  else floorDisplay.innerHTML = "" + targetFloor;
}

// load target floor and unload the last one
async function loadFloor() {
  floor().unloadSvg(background);
  const f = floor(realOrNotFoundFloor(targetFloor));
  currentFloor = targetFloor;
  background.innerHTML = await f.svg.get();
  f.loadSvg(background);
}

// initial load
loadFloor().then(updateDisplay);

// toggle the closing button for content
async function toggleCloser() {
  if (closer.classList.contains("hidden")) {
    closer.classList.remove("hidden");
    await wait(20);
    closer.classList.remove("visuallyhidden");
  } else {
		function onTransitionEnd() {
			closer.classList.add('hidden');
			closer.removeEventListener("transitionend", onTransitionEnd);
		}
    closer.addEventListener("transitionend", onTransitionEnd);
    closer.classList.add("visuallyhidden");
  }
}

// toggle html content of current floor
export async function toggleContent(html?: string, noFunc = false) {
  if (info.classList.contains("hidden")) {
    if (html) info.innerHTML = html;
    else info.innerHTML = await floor().content.get();
    if (!noFunc) {
			floor().loadContent(info);
			floor().functionContent = true;
		}
    info.classList.remove("hidden");
    await wait(20);
    info.classList.remove("visuallyhidden");
    toggleCloser();
  } else {
    toggleCloser();
		noFunc = !floor().functionContent;
    if (!noFunc) {
			floor().unloadContent(info);
			floor().functionContent = false;
		}
    info.innerHTML = "";
    if (!noFunc) threeToFive();
		function onTransitionEnd() {
			info.classList.add('hidden');
			info.removeEventListener("transitionend", onTransitionEnd);
		}
    info.addEventListener("transitionend", onTransitionEnd);
    info.classList.add("visuallyhidden");
  }
}

// transition from state 0 to 3
async function anyToThree() {
  if (state == 0) {
    const audio = new Audio('/assets/sounds/lift.mp3');
    audio.play();
    state = 1;
    leftDoor.style.transform = "translateX(-25%)";
    rightDoor.style.transform = "translateX(25%)";
    await wait(1500);
  }
  state = 2;
  // in case touch offset is happening
  elevator.style.transitionDuration = "";
  elevator.style.transitionTimingFunction = "";
  background.style.transitionDuration = "";
  background.style.transitionTimingFunction = "";
  const rect = leftDoor.getBoundingClientRect();
  const scale = Math.max(window.innerWidth / (rect.width * 2), window.innerHeight / rect.height);
  elevatorScale = scale;
  elevator.style.transform = `scale(${scale}, ${scale})`;
  background.style.transform = "scale(1.2, 1.2)";
  await wait(1500);
  state = 3;
  elevator.classList.add("hidden");
  if (!floor().disableContent) toggleContent();
  floor().enter();
}

// transition from state 3 to 5
async function threeToFive() {
  elevator.classList.remove("hidden");
  await wait(500);
  state = 4;
  elevator.style.transform = "";
  background.style.transform = "";
  elevatorScale = 1;
  await wait(1500);
  state = 5;
}

// transition from state 5 to 0
async function fiveToZero() {
  state = 6;
  leftDoor.style.transform = "";
  rightDoor.style.transform = "";
  await wait(1500);
  state = 0;
}

let clickOnButton = false;
const buttonPress = (button: SVGElement) => {
  clickOnButton = true;
  button.style.fill = "#f7eb93";
};
const buttonRelease = (button: SVGElement, deltaFloor: number) => {
  button.style.fill = "#bbbbbb";
  targetFloor = deltaFloor > 0 ? Math.min(FLOORS.size - 1, targetFloor + deltaFloor) : Math.max(0, targetFloor + deltaFloor);
  updateDisplay();
};
const buttonCancel = (button: SVGElement) => {
  clickOnButton = false;
  button.style.fill = "#bbbbbb";
};
// up button handlers
upButton.onmousedown = () => buttonPress(upButton);
upButton.ontouchstart = () => buttonPress(upButton);
upButton.onclick = () => buttonRelease(upButton, 1);
upButton.onmouseleave = () => buttonCancel(upButton);

// down button handlers
downButton.onmousedown = () => buttonPress(downButton);
downButton.ontouchstart = () => buttonPress(downButton);
downButton.onclick = () => buttonRelease(downButton, -1);
downButton.onmouseleave = () => buttonCancel(downButton);

// floor button handler
floorButton.onmousedown = () => clickOnButton = true;
floorButton.ontouchstart = () => clickOnButton = true;
floorButton.onclick = async () => {
  if (moving) return;
  moving = targetFloor - currentFloor;
  updateDisplay();
  if (moving) {
    await fiveToZero();
    await loadFloor();
    await wait(500 + 200 * Math.abs(moving));
    history.pushState({ floor: targetFloor }, "", (window.location.pathname.startsWith("/2d") ? "/2d/" : "/") + (targetFloor == 0 ? "" : Array.from(FLOORS.keys())[targetFloor]));
    moving = 0;
    updateDisplay();
    anyToThree();
  }
}

// more button handlers
musicButton.onmousedown = () => clickOnButton = true;
musicButton.ontouchstart = () => clickOnButton = true;
musicButton.onclick = () => {
	if (toggleMusic()) musicLight.style.fill = "#5acd9c";
	else  musicLight.style.fill = "#103525";
};
if (isMusic()) musicLight.style.fill = "#5acd9c";

donationBox.onmousedown = () => clickOnButton = true;
donationBox.ontouchstart = () => clickOnButton = true;
donationBox.onclick = async () => {
	toggleContent(await donationContent.get(), true);
};

suggestionBox.onmousedown = () => clickOnButton = true;
suggestionBox.ontouchstart = () => clickOnButton = true;
suggestionBox.onclick = async () => {
	toggleContent(await suggestionContent.get(), true);
};

const smoothScrollStyle = (enabled: boolean) => {
	if (enabled) {
		yesSmooth.style.stroke = "#ffffff";
		noSmooth.style.stroke = "#777777";
	} else {
		yesSmooth.style.stroke = "#777777";
		noSmooth.style.stroke = "#ffffff";
	}
};
smoothScroll.onmousedown = () => clickOnButton = true;
smoothScroll.ontouchstart = () => clickOnButton = true;
smoothScroll.onclick = () => smoothScrollStyle(toggleSmoothScroll());
smoothScrollStyle(isSmoothScroll());

// touch handlers for mobile support
let touch = { ix: 0, x: 0, offset: 0 };
let canTouch = false, mouseDown = false;
let maxTrans = 0;
const touchCheck = () => {
  if (!canTouch) return false;
  if (state == 2 || state == 4) {
    touch.offset = 0;
    return false;
  }
  return true;
}
const instantAnimate = () => {
  elevator.style.transitionDuration = "0s";
  elevator.style.transitionTimingFunction = "linear";
  background.style.transitionDuration = "0s";
  background.style.transitionTimingFunction = "linear";
}
window.ontouchstart = (evt) => {
  if (!touchCheck()) return;
  touch.x = touch.ix = Array.from(evt.touches).map(t => t.clientX).reduce((a, b) => a + b) / evt.touches.length;
  instantAnimate();
}
window.onmousedown = (evt) => {
  if (!touchCheck()) return;
  mouseDown = true;
  touch.x = touch.ix = evt.clientX;
  instantAnimate();
}
const resetAnimate = () => {
  touch.offset = clamp((touch.x - touch.ix) * 100 / window.innerWidth + touch.offset, -maxTrans, maxTrans);
  elevator.style.transitionDuration = "";
  elevator.style.transitionTimingFunction = "";
  background.style.transitionDuration = "";
  background.style.transitionTimingFunction = "";
}
window.ontouchend = (evt) => {
  if (touchCheck()) {
    if (evt.touches.length) touch.ix = Array.from(evt.touches).map(t => t.clientX).reduce((a, b) => a + b) / evt.touches.length;
    else resetAnimate();
  }
  // click-starter
  if (clickOnButton) clickOnButton = false;
  else if (touch.x == touch.ix && (state == 0 || state == 5) && info.classList.contains("hidden")) anyToThree();
}
window.onmouseup = () => {
  if (touchCheck()) {
    mouseDown = false;
    resetAnimate();
  }
  // click-starter
  if (clickOnButton) clickOnButton = false;
  else if (touch.x == touch.ix && (state == 0 || state == 5) && info.classList.contains("hidden")) anyToThree();
}
const translateBackground = () => {
  const offset = clamp((touch.x - touch.ix) * 100 / window.innerWidth + touch.offset, -maxTrans, maxTrans);
  if (state == 3) {
    elevator.style.transform = `scale(${elevatorScale}, ${elevatorScale})`;
    background.style.transform = `translateX(${offset}%) scale(1.2, 1.2)`;
  }
  else {
    elevator.style.transform = `translateX(${offset}%)`;
    background.style.transform = `translateX(${offset / 4}%)`;
  }
}
window.ontouchmove = (evt) => {
  if (!touchCheck()) return;
  touch.x = Array.from(evt.touches).map(t => t.clientX).reduce((a, b) => a + b) / evt.touches.length;
  translateBackground();
}
window.onmousemove = (evt) => {
  if (!touchCheck() || !mouseDown) return;
  touch.x = evt.clientX;
  translateBackground();
}

// resize handler
let resizeTimeout: NodeJS.Timeout | undefined = undefined;
function resize() {
  if (window.innerWidth / window.innerHeight < 1) {
    enableStylesheet(document.getElementById("vertical"));
    disableStylesheet(document.getElementById("horizontal"));
  } else {
    enableStylesheet(document.getElementById("horizontal"));
    disableStylesheet(document.getElementById("vertical"));
  }

  const newCanTouch = window.innerWidth / window.innerHeight < 1.25;
  const canTouchDiff = newCanTouch != canTouch;
  canTouch = newCanTouch;

  maxTrans = (8 / (window.innerWidth * 9 / window.innerHeight) - 0.5) * 100;

  if (state == 3) {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const rect = leftDoor.getBoundingClientRect();
      const scale = Math.max(window.innerWidth / (rect.width * 2), window.innerHeight / rect.height) * elevatorScale;
      elevatorScale = scale;
      elevator.style.transform = `scale(${scale}, ${scale})`;
      resizeTimeout = undefined;
    }, 100);

    if (canTouchDiff && !canTouch) background.style.transform = "scale(1.2, 1.2)";
  } else if (canTouchDiff && !canTouch) {
    elevator.style.transform = "";
    background.style.transform = "";
  }
}

// initial resizing
resize();
window.onresize = resize;

// storage reading
const config = getConfig();
if (config.allowStorage) {
  config.answerStorage = true;
  writeConfig();
}
if (config.music) (document.getElementById("player") as HTMLAudioElement).play();

// additional setup
closer.onclick = () => {
  toggleContent();
}
window.onkeydown = e => {
	if (e.key == "Escape" && !info.classList.contains("hidden")) toggleContent();
}

// pop history
window.onpopstate = async () => {
  targetFloor = history.state?.floor || 0;
  moving = targetFloor - currentFloor;
  updateDisplay();
  if (moving) {
    if (state == 3) {
      if (!info.classList.contains("hidden")) toggleContent();
      await threeToFive();
    }
    if (state == 5) await fiveToZero();
    await loadFloor();
    await wait(500 + 200 * Math.abs(moving));
    moving = 0;
    updateDisplay();
    anyToThree();
  }
}
