import * as THREE from "three";
import WebGL from "three/addons/capabilities/WebGL.js";
import { displayTexture, makeLift } from "./generators";
import { camera, currentFloor, DEBUG, floor, ratio, targetFloor } from "./states";
import { enableStylesheet, disableStylesheet } from "./helpers/css";
import { getConfig, writeConfig } from "./helpers/control";
import { FLOORS } from "./constants";
import "./handler";
import { realOrNotFoundFloor } from "./helpers/math";
import { FirstPersonControls } from "three/addons/controls/FirstPersonControls.js";

if (!WebGL.isWebGL2Available()) {
  alert("WebGL is not supported! You have lost your privilege to the R³ space.");
  const split = window.location.href.split("/");
  split.splice(3, 0, "2d");
  window.location.href = split.join("/");
}

const passedInFloor = ((Array.from(FLOORS.keys()).indexOf(window.location.pathname.split("/")[1] || "ground") + 1) || (404 + 1)) - 1;

const config = getConfig();
if (config.allowStorage) {
  config.answerStorage = true;
  writeConfig();
}
if (config.music) (document.getElementById("player") as HTMLAudioElement).play();

export const scene = new THREE.Scene();
const cam = camera(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)) as THREE.PerspectiveCamera;
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector(`#bg`)!
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// debugging
let controls: FirstPersonControls;
let clock: THREE.Clock;
if (DEBUG) {
  controls = new FirstPersonControls(cam, renderer.domElement);
  controls.movementSpeed = 150;
  controls.lookSpeed = 0.1;
  clock = new THREE.Clock();
}

export var midX: number, midY: number;

export const pointLight = new THREE.PointLight(0xfff8be, 450, 300, 1.2);
pointLight.position.y = cam.position.y = passedInFloor > 0 ? 1000 * passedInFloor : 0;
scene.add(pointLight);
export const obj = makeLift(scene, passedInFloor);
export const { doorL, doorR, buttonU, buttonD, sign, display, music, light, donation, suggestion } = obj;

// load target floor and unload the last one
export async function loadFloor() {
  floor()?.despawn(scene);
  const f = floor(realOrNotFoundFloor(targetFloor()))!;
  currentFloor(targetFloor());
	f.spawnWrapper(scene);
}

function resize() {
  cam.aspect = window.innerWidth / window.innerHeight;
  cam.updateProjectionMatrix();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.render(scene, cam);
  if (DEBUG) controls.handleResize();
  midX = window.innerWidth / 2;
  midY = window.innerHeight / 2;
  if (ratio(window.innerWidth / window.innerHeight) < 1) {
    enableStylesheet(document.getElementById("vertical"));
    disableStylesheet(document.getElementById("horizontal"));
  } else {
    enableStylesheet(document.getElementById("horizontal"));
    disableStylesheet(document.getElementById("vertical"));
  }
}
// only exception of event listener here
window.addEventListener("resize", () => resize());

function animate() {
  requestAnimationFrame(animate);

  if (DEBUG) controls.update(clock.getDelta());
  renderer.render(scene, cam);
}

resize();
animate();

(async () => {
  currentFloor(targetFloor(passedInFloor));
  const xm = new THREE.MeshStandardMaterial({ map: displayTexture(passedInFloor), transparent: true });
  xm.map!.needsUpdate = true;
  display.material.splice(4, 1, xm);
  loadFloor();
})();