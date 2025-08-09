import * as THREE from "three";
import { SVGLoader, SVGResult } from "three/addons/loaders/SVGLoader.js";

export function getMidpoint(mesh: THREE.Mesh) {
	const middle = new THREE.Vector3();
	const geometry = mesh.geometry;

	geometry.computeBoundingBox();

	middle.x = (geometry.boundingBox!.max.x + geometry.boundingBox!.min.x) / 2;
	middle.y = (geometry.boundingBox!.max.y + geometry.boundingBox!.min.y) / 2;
	middle.z = (geometry.boundingBox!.max.z + geometry.boundingBox!.min.z) / 2;

	mesh.localToWorld( middle );
	return middle;
}

export function createSVGCenteredGroup(data: SVGResult, depthWrite = false) {
	const group = new THREE.Group();
	const meshes: THREE.Mesh[] = [];
	const center = new THREE.Vector3();
	for (const path of data.paths) {
		const material = new THREE.MeshBasicMaterial({
			color: path.color,
			side: THREE.DoubleSide,
			depthWrite
		});

		const shapes = SVGLoader.createShapes(path);

		const shapeCenter = new THREE.Vector3();
		for (const shape of shapes) {
			const geometry = new THREE.ShapeGeometry(shape);
			const mesh = new THREE.Mesh(geometry, material);
			shapeCenter.add(getMidpoint(mesh));
			meshes.push(mesh);
		}
		center.add(shapeCenter.multiplyScalar(1/shapes.length));
	}
	center.multiplyScalar(1/data.paths.length);
	for (const mesh of meshes)
		mesh.position.addVectors(mesh.position, center.clone().negate());

	group.add(...meshes);
	group.position.set(center.x, center.y, center.z);
	return group;
}

export function createSVGGroupWithCenter(data: SVGResult, center: THREE.Vector3) {
	const group = new THREE.Group();
	const meshes: THREE.Mesh[] = [];
	for (const path of data.paths) {
		const material = new THREE.MeshBasicMaterial({
			color: path.color,
			side: THREE.DoubleSide,
			depthWrite: false
		});

		const shapes = SVGLoader.createShapes(path);

		for (const shape of shapes) {
			const geometry = new THREE.ShapeGeometry(shape);
			const mesh = new THREE.Mesh(geometry, material);
			meshes.push(mesh);
		}
	}
	for (const mesh of meshes)
		mesh.position.addVectors(mesh.position, center.clone().negate());

	group.add(...meshes);
	return group;
}

export function randomBetween(min: number, max: number, int = true) {
	if (int) return Math.round(Math.random() * (max - min)) + min;
	return Math.random() * (max - min) + min;
}

export function clamp(val: number, min: number, max: number) {
	return Math.min(Math.max(val, min), max);
}