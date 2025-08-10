import * as THREE from "three";
import { displayTexture, makeLift } from "./generators";
import { enableStylesheet, disableStylesheet } from "../helpers/css";
import { getConfig, writeConfig } from "../helpers/control";
import { FirstPersonControls } from "three/addons/controls/FirstPersonControls.js";
import { setupHandlers } from "./handle3d";
import Elevator from "../main";

export class Main3D extends Elevator {
	// THREE.js stuff
	scene = new THREE.Scene();
	pointLight = new THREE.PointLight(0xfff8be, 450, 300, 1.2);
	objects = makeLift(this.scene, this.passedInFloor);
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	private renderer = new THREE.WebGLRenderer({ canvas: document.querySelector(`#bg`)! });
	private controls?: FirstPersonControls;
	private clock?: THREE.Clock;

	// Math & logic stuff
	midX = 0;
	midY = 0;
	started = false;
	rotatedX = 0;
	rotatedY = 0;
	ratio = window.innerWidth / window.innerHeight;
	touched = false;
	lastTouched = 0;

	constructor() {
		super(false);
		const config = getConfig();
		if (config.allowStorage) {
		  config.answerStorage = true;
		  writeConfig();
		}
		if (config.music) (document.getElementById("player") as HTMLAudioElement).play();

		this.renderer.outputColorSpace = THREE.SRGBColorSpace;
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		// debugging
		if (Elevator.DEBUG) {
		  this.controls = new FirstPersonControls(this.camera, this.renderer.domElement);
		  this.controls.movementSpeed = 150;
		  this.controls.lookSpeed = 0.1;
		  this.clock = new THREE.Clock();
		}

		this.pointLight.position.y = this.camera.position.y = this.passedInFloor > 0 ? 1000 * this.passedInFloor : 0;
		this.scene.add(this.pointLight);

		// only exception of event listener here
		window.addEventListener("resize", () => this.resize());

		this.resize();
		this.animate();

		setupHandlers(this);
	}

	protected dynamicLoad() {
		this.floor.spawnWrapper(this.scene);
	}

	protected dynamicUnload() {
	  this.floor.despawn(this.scene);
	}

	private resize() {
	  this.camera.aspect = window.innerWidth / window.innerHeight;
	  this.camera.updateProjectionMatrix();
	  this.renderer.setPixelRatio(window.devicePixelRatio);
	  this.renderer.setSize(window.innerWidth, window.innerHeight);

	  this.renderer.render(this.scene, this.camera);
	  this.controls?.handleResize();
	  this.midX = window.innerWidth / 2;
	  this.midY = window.innerHeight / 2;
	  if ((this.ratio = window.innerWidth / window.innerHeight) < 1) {
	    enableStylesheet(document.getElementById("vertical"));
	    disableStylesheet(document.getElementById("horizontal"));
	  } else {
	    enableStylesheet(document.getElementById("horizontal"));
	    disableStylesheet(document.getElementById("vertical"));
	  }
	}

	private animate() {
	  requestAnimationFrame(() => this.animate());

	  this.controls?.update(this.clock?.getDelta() || 0);
	  this.renderer.render(this.scene, this.camera);
	}
}

export default async function init3D() {
	// Preload font for textures later
	await document.fonts.load('10pt "YosterIsland"');
	const main3d = new Main3D();

  const xm = new THREE.MeshStandardMaterial({ map: displayTexture(main3d.passedInFloor), transparent: true });
  xm.map!.needsUpdate = true;
  main3d.objects.display.material.splice(4, 1, xm);
  main3d.loadFloor();
}