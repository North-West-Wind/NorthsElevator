import { getConfig, isMusic, isSmoothScroll, toggleMusic, toggleSmoothScroll, wait, writeConfig } from '../helpers/control';
import { disableStylesheet, enableStylesheet } from '../helpers/css';
import { clamp } from '../helpers/math';
import { Main2D } from './main2d';

export function setupHandlers(main2d: Main2D) {
	// initial load
	main2d.loadFloor().then(() => main2d.updateDisplay());

	let clickOnButton = false;
	const elevatorButtonSetup = (button: SVGElement, deltaFloor: number) => {
		button.onmousedown = () => {
		  clickOnButton = true;
		  button.style.fill = "#f7eb93";
		};
		button.ontouchstart = (e) => {
			e.preventDefault();
		  clickOnButton = true;
		  button.style.fill = "#f7eb93";
		};
		button.ontouchend = (e) => {
			e.preventDefault();
		  button.style.fill = "#bbbbbb";
		  main2d.targetFloor = deltaFloor > 0 ? Math.min(main2d.floors.size - 1, main2d.targetFloor + deltaFloor) : Math.max(0, main2d.targetFloor + deltaFloor);
		  main2d.updateDisplay();
		};
		button.onmouseup = () => {
		  button.style.fill = "#bbbbbb";
		  main2d.targetFloor = deltaFloor > 0 ? Math.min(main2d.floors.size - 1, main2d.targetFloor + deltaFloor) : Math.max(0, main2d.targetFloor + deltaFloor);
		  main2d.updateDisplay();
		};
		button.onmouseleave = () => {
		  clickOnButton = false;
		  button.style.fill = "#bbbbbb";
		};
	};
	// elevator button handlers
	elevatorButtonSetup(main2d.upButton, 1);
	elevatorButtonSetup(main2d.downButton, -1);

	const otherButtonSetup = (button: SVGElement) => {
		button.onmousedown = () => clickOnButton = true;
		button.ontouchstart = () => clickOnButton = true;
	};

	// floor button handler
	otherButtonSetup(main2d.floorButton);
	main2d.floorButton.onclick = async () => {
	  if (main2d.moving) return;
	  main2d.moving = main2d.targetFloor - main2d.currentFloor;
	  main2d.updateDisplay();
	  if (main2d.moving) {
	    await main2d.fiveToZero();
	    await main2d.loadFloor();
	    await wait(500 + 200 * Math.abs(main2d.moving));
	    history.pushState({ floor: main2d.targetFloor }, "", "/" + (main2d.targetFloor == 0 ? "" : Array.from(main2d.floors.keys())[main2d.targetFloor]));
	    main2d.moving = 0;
	    main2d.updateDisplay();
	    main2d.anyToThree();
	  }
	}

	// more button handlers
	otherButtonSetup(main2d.musicButton);
	main2d.musicButton.onclick = () => {
		if (toggleMusic()) main2d.musicLight.style.fill = "#5acd9c";
		else main2d.musicLight.style.fill = "#103525";
	};
	if (isMusic()) main2d.musicLight.style.fill = "#5acd9c";

	otherButtonSetup(main2d.donationBox);
	main2d.donationBox.onclick = async () => {
		main2d.toggleContent(undefined, () => main2d.contentByNum(1000));
	};

	otherButtonSetup(main2d.suggestionBox);
	main2d.suggestionBox.onclick = async () => {
		main2d.toggleContent(undefined, ()  => main2d.contentByNum(1001));
	};

	const smoothScrollStyle = (enabled: boolean) => {
		if (enabled) {
			main2d.yesSmooth.style.stroke = "#ffffff";
			main2d.noSmooth.style.stroke = "#777777";
		} else {
			main2d.yesSmooth.style.stroke = "#777777";
			main2d.noSmooth.style.stroke = "#ffffff";
		}
	};
	otherButtonSetup(main2d.smoothScroll);
	main2d.smoothScroll.onclick = () => smoothScrollStyle(toggleSmoothScroll());
	smoothScrollStyle(isSmoothScroll());

	otherButtonSetup(main2d.threeDimension);
	main2d.threeDimension.onclick = () => {
		if (getConfig().flat) {
			getConfig().flat = false;
			writeConfig();
		}
		const search = new URLSearchParams(window.location.search);
		search.delete("flat");
		window.location.href = window.location.pathname + search;
	};

	// touch handlers for mobile support
	let touch = { ix: 0, x: 0, offset: 0 };
	let canTouch = false, mouseDown = false;
	let maxTrans = 0;
	const touchCheck = () => {
	  if (!canTouch) return false;
	  if (main2d.state == 2 || main2d.state == 4) {
	    touch.offset = 0;
	    return false;
	  }
	  return true;
	}
	const instantAnimate = () => {
	  main2d.elevator.style.transitionDuration = "0s";
	  main2d.elevator.style.transitionTimingFunction = "linear";
	  main2d.background.style.transitionDuration = "0s";
	  main2d.background.style.transitionTimingFunction = "linear";
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
	  main2d.elevator.style.transitionDuration = "";
	  main2d.elevator.style.transitionTimingFunction = "";
	  main2d.background.style.transitionDuration = "";
	  main2d.background.style.transitionTimingFunction = "";
	}
	window.ontouchend = (evt) => {
	  if (touchCheck()) {
	    if (evt.touches.length) touch.ix = Array.from(evt.touches).map(t => t.clientX).reduce((a, b) => a + b) / evt.touches.length;
	    else resetAnimate();
	  }
	  // click-starter
	  if (clickOnButton) clickOnButton = false;
	  else if (touch.x == touch.ix && (main2d.state == 0 || main2d.state == 5) && main2d.info.classList.contains("hidden")) main2d.anyToThree();
	}
	window.onmouseup = () => {
	  if (touchCheck()) {
	    mouseDown = false;
	    resetAnimate();
	  }
	  // click-starter
	  if (clickOnButton) clickOnButton = false;
	  else if (touch.x == touch.ix && (main2d.state == 0 || main2d.state == 5) && main2d.info.classList.contains("hidden")) main2d.anyToThree();
	}
	const translateBackground = () => {
	  const offset = clamp((touch.x - touch.ix) * 100 / window.innerWidth + touch.offset, -maxTrans, maxTrans);
	  if (main2d.state == 3) {
	    main2d.elevator.style.transform = `scale(${main2d.elevatorScale}, ${main2d.elevatorScale})`;
	    main2d.background.style.transform = `translateX(${offset}%) scale(1.2, 1.2)`;
	  }
	  else {
	    main2d.elevator.style.transform = `translateX(${offset}%)`;
	    main2d.background.style.transform = `translateX(${offset / 4}%)`;
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

	  if (main2d.state == 3) {
	    if (resizeTimeout) clearTimeout(resizeTimeout);
	    resizeTimeout = setTimeout(() => {
	      const rect = main2d.leftDoor.getBoundingClientRect();
	      const scale = Math.max(window.innerWidth / (rect.width * 2), window.innerHeight / rect.height) * main2d.elevatorScale;
	      main2d.elevatorScale = scale;
	      main2d.elevator.style.transform = `scale(${scale}, ${scale})`;
	      resizeTimeout = undefined;
	    }, 100);

	    if (canTouchDiff && !canTouch) main2d.background.style.transform = "scale(1.2, 1.2)";
	  } else if (canTouchDiff && !canTouch) {
	    main2d.elevator.style.transform = "";
	    main2d.background.style.transform = "";
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
	window.onkeydown = e => {
		if (e.key == "Escape" && !main2d.info.classList.contains("hidden"))
			main2d.toggleContent(main2d.floor);
	}

	// pop history
	window.onpopstate = async () => {
	  main2d.targetFloor = history.state?.floor || 0;
	  main2d.moving = main2d.targetFloor - main2d.currentFloor;
	  main2d.updateDisplay();
	  if (main2d.moving) {
	    if (main2d.state == 3) {
	      if (!main2d.info.classList.contains("hidden"))
					main2d.toggleContent(main2d.floor);
	      await main2d.threeToFive();
	    }
	    if (main2d.state == 5) await main2d.fiveToZero();
	    await main2d.loadFloor();
	    await wait(500 + 200 * Math.abs(main2d.moving));
	    main2d.moving = 0;
	    main2d.updateDisplay();
	    main2d.anyToThree();
	  }
	}

}