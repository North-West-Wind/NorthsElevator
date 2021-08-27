

function makeLift(scene) {
    const { rectL, rectR, rectT, rectB, doorL, doorR } = makeDoors(scene);
    const { floor } = makeFloor(scene);
    const { wallFL, wallFR, wallFT, wallL, wallR, ceiling } = makeWalls(scene);
    const { base, buttonU, buttonD, display } = makeButtons(scene);
    const { sign } = makeSign(scene);
    const obj = { rectL, rectR, rectT, rectB, doorL, doorR, floor, wallFL, wallFR, wallFT, wallL, wallR, ceiling, base, buttonU, buttonD, display, sign };
    return obj;
}

function makeDoors(scene) {
    const geometryS = new THREE.BoxGeometry(5, 50, 5);
    const material = new THREE.MeshStandardMaterial({ color: 0x777777 });
    const rectL = new THREE.Mesh(geometryS, material);
    const rectR = new THREE.Mesh(geometryS, material);
    rectL.position.set(-25, -5, -50);
    rectR.position.set(25, -5, -50);
    scene.add(rectL, rectR);

    const geometryT = new THREE.BoxGeometry(55, 5, 5);
    const rectT = new THREE.Mesh(geometryT, material);
    const rectB = new THREE.Mesh(geometryT, material);
    rectT.position.set(0, 22.5, -50);
    rectB.position.set(0, -32.49, -50);
    scene.add(rectT, rectB);

    const geometry = new THREE.BoxGeometry(25, 50, 2);
    const materialD = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const doorL = new THREE.Mesh(geometry, materialD);
    const doorR = new THREE.Mesh(geometry, materialD);
    doorL.position.set(-12.5, -5, -50);
    doorR.position.set(12.5, -5, -50);
    scene.add(doorL, doorR);
    return { rectL, rectR, rectT, rectB, doorL, doorR };
}

function makeFloor(scene) {
    const geometry = new THREE.BoxGeometry(80, 2, 100);
    const material = new THREE.MeshStandardMaterial({ color: 0x98f5a8 });
    const floor = new THREE.Mesh(geometry, material);
    floor.position.set(0, -31, 0);
    scene.add(floor);
    return { floor };
}

function makeWalls(scene) {
    const geometryF = new THREE.BoxGeometry(12.5, 80, 3);
    const material = new THREE.MeshStandardMaterial({ color: 0xfef0bc });
    const wallFL = new THREE.Mesh(geometryF, material);
    const wallFR = new THREE.Mesh(geometryF, material);
    wallFL.position.set(-33.5, -5, -50);
    wallFR.position.set(33.5, -5, -50);
    scene.add(wallFL, wallFR);

    const geometryFT = new THREE.BoxGeometry(55, 10, 3);
    const wallFT = new THREE.Mesh(geometryFT, material);
    wallFT.position.set(0, 30, -50);
    scene.add(wallFT);

    const geometryS = new THREE.BoxGeometry(3, 80, 100);
    const wallL = new THREE.Mesh(geometryS, material);
    const wallR = new THREE.Mesh(geometryS, material);
    wallL.position.set(-40, -5, 0);
    wallR.position.set(40, -5, 0);
    scene.add(wallL, wallR);

    const geometryC = new THREE.BoxGeometry(80, 2, 100);
    const ceiling = new THREE.Mesh(geometryC, material);
    ceiling.position.set(0, 36, 0);
    scene.add(ceiling);
    return { wallFL, wallFR, wallFT, wallL, wallR, ceiling };
}

function makeButtons(scene) {
    const geometryB = new THREE.BoxGeometry(5, 10, 0.5);
    const materialB = new THREE.MeshStandardMaterial({ color: 0xb4eafe });
    const base = new THREE.Mesh(geometryB, materialB);
    base.position.set(33.5, -5, -48.25);
    scene.add(base);

    const A = new THREE.Vector2(-1.5, -1);
    const B = new THREE.Vector2(1.5, -1);
    const C = new THREE.Vector2(0, 1);

    const height = 1;
    const geometry = new PrismGeometry([A, B, C], height);
    const materialU = new THREE.MeshStandardMaterial({ color: 0xbbbbbb });
    const materialD = new THREE.MeshStandardMaterial({ color: 0xbbbbbb });
    const buttonU = new THREE.Mesh(geometry, materialU);
    const buttonD = new THREE.Mesh(geometry, materialD);
    buttonU.position.set(33.5, -2.5, -48.25);
    buttonD.position.set(33.5, -7.5, -48.25);
    buttonD.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI);
    scene.add(buttonU, buttonD);

    const geometryD = new THREE.BoxGeometry(5, 5, 0.5);
    const xm = new THREE.MeshStandardMaterial({ map: displayTexture(0), transparent: true });
    xm.map.needsUpdate = true;
    const material = new THREE.MeshStandardMaterial({ color: 0x555555 });
    const materials = [
        material,
        material,
        material,
        material,
        xm,
        material
    ];
    const display = new THREE.Mesh(geometryD, materials);
    display.position.set(33.5, 5, -48.25);
    scene.add(display);
    return { base, buttonU, buttonD, display };
}

function makeSign(scene) {
    var x = document.createElement("canvas");
    var xc = x.getContext("2d");
    x.width = 360;
    x.height = 600;
    const posX = x.width / 6;
    const posY = x.height / 12;
    const mY = posY / 2;
    xc.fillStyle = "#eeeeee";
    xc.fillRect(0, 0, x.width, x.height);
    xc.fillStyle = "#cccccc";
    for (let i = 1; i < 11; i++) xc.fillRect(posX, posY * i + 10, Math.round(Math.random() * 180) + 60, 30);

    const geometry = new THREE.BoxGeometry(2, 25, 15);
    var xm = new THREE.MeshStandardMaterial({ map: new THREE.Texture(x), transparent: true });
    xm.map.needsUpdate = true;
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const materials = [
        material,
        xm,
        material,
        material,
        material,
        material
    ];
    const sign = new THREE.Mesh(geometry, materials);
    sign.position.set(39, 0, -30);
    scene.add(sign);
    return { sign };
}

function makeOutside(scene) {
    const { floor } = makeGroundFloor(scene);
    const { ocean, oakFloor, fishingRod, string, holder } = makeAutoFishFloor(scene);
    const { armorStand } = makeMoreBootsFloor(scene);
    return { floor, ocean, oakFloor, fishingRod, string, holder, armorStand };
}

function createRain(scene, amount) {
    const rains = [];
    const geometryR = new THREE.SphereGeometry(0.25);
    const materialR = new THREE.MeshStandardMaterial({ color: 0x42a6e9 });
    for (let i = 0; i < amount; i++) {
        const rain = new THREE.Mesh(geometryR, materialR);
        rain.position.set(THREE.MathUtils.randFloatSpread(100), 100, -THREE.MathUtils.randFloatSpread(500) - 305);
        rains.push(rain);
        scene.add(rain);
    }
    return rains;
}

function displayTexture(floor) {
    var x = document.createElement("canvas");
    var xc = x.getContext("2d");
    x.width = x.height = 400;
    xc.fillStyle = "#555555";
    xc.fillRect(0, 0, x.width, x.height);
    xc.fillStyle = "black";
    xc.fillRect(20, 20, x.width - 40, x.height - 40);
    xc.fillStyle = "red";
    xc.font = "256px 'Courier New'";
    xc.textAlign = "center";
    xc.textBaseline = "middle";
    if (isNaN(floor)) xc.fillText(floor, x.width / 2, x.height / 2);
    else xc.fillText(floor <= 0 ? "G" : floor, x.width / 2, x.height / 2);
    return new THREE.Texture(x);
}

PrismGeometry = function (vertices, height) {
    var Shape = new THREE.Shape();
    (function f(ctx) {
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (var i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.lineTo(vertices[0].x, vertices[0].y);
    })(Shape);

    var settings = {};
    settings.amount = height;
    settings.bevelEnabled = false;
    return new THREE.ExtrudeGeometry(Shape, settings);
};

PrismGeometry.prototype = Object.create(THREE.ExtrudeGeometry.prototype);

function makeGroundFloor(scene) {
    const geometry = new THREE.BoxGeometry(55, 2, 500);
    const material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const floor = new THREE.Mesh(geometry, material);
    floor.position.set(0, -31, -300);
    scene.add(floor);
    return { floor };
}

const WATER_TEXTURES = [];
function makeAutoFishFloor(scene) {
    for (let i = 0; i < 32; i++) {
        const water = LOADER.load(`/assets/textures/water/water_still-00-${(i < 10 ? "0" : "") + i}.png`, texture => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.offset.set(0, 0);
            texture.repeat.set(100, 100);
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.LinearMipMapLinearFilter;
        });
        WATER_TEXTURES.push(water);
    }

    const geometryW = new THREE.BoxGeometry(1000, 10, 1000);
    const materialW = new THREE.MeshBasicMaterial({ map: WATER_TEXTURES[0], opacity: 0.4, transparent: true });
    materialW.map.needsUpdate = true;
    const ocean = new THREE.Mesh(geometryW, materialW);
    ocean.position.set(0, 946.5, -550);
    scene.add(ocean);

    const geometryF = new THREE.BoxGeometry(128, 16, 80);
    const oakF = LOADER.load("/assets/textures/oak_planks.png", texture => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.offset.set(0, 0);
        texture.repeat.set(8, 5);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.LinearMipMapLinearFilter;
    });
    const materialF = new THREE.MeshStandardMaterial({ map: oakF });
    const oakFloor = new THREE.Mesh(geometryF, materialF);
    oakFloor.position.set(0, 959.5, -90);
    scene.add(oakFloor);

    const geometryR = new THREE.BoxGeometry(3, 80, 3);
    const materialR = new THREE.MeshStandardMaterial({ color: 0xad7726 });
    const fishingRod = new THREE.Mesh(geometryR, materialR);
    fishingRod.position.set(56, 991.5, -122);
    fishingRod.setRotationFromAxisAngle(new THREE.Vector3(-1, 0, 0), Math.PI / 6);
    scene.add(fishingRod);

    const geometryS = new THREE.BoxGeometry(1, 80, 1);
    const materialS = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const string = new THREE.Mesh(geometryS, materialS);
    string.position.set(56, 984, -140);
    scene.add(string);

    const geometryH = new THREE.BoxGeometry(8, 16, 8);
    const materialH = new THREE.MeshStandardMaterial({ color: 0x7d4700 });
    const holder = new THREE.Mesh(geometryH, materialH);
    holder.position.set(56, 975.5, -118);
    scene.add(holder);

    var oceanCounter = 0;
    setInterval(() => {
        oceanCounter = ++oceanCounter % 32;
        const materialW = new THREE.MeshBasicMaterial({ map: WATER_TEXTURES[oceanCounter], opacity: 0.4, transparent: true });
        materialW.map.needsUpdate = true;
        ocean.material = materialW;
        renderer.render(scene, camera);
    }, 250);
    return { ocean, oakFloor, fishingRod, string, holder };
}

function makeMoreBootsFloor(scene) {
    const gltf = GLTF_LOADER.loadAsync("./assets/models/armor_stand.gltf");
    const armorStand = gltf.scene;
    armorStand.position.set(0, 2000, -100);
    scene.add(armorStand);

    return { armorStand };
}