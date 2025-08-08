import InfoCenterFloor from "./floors/info_center";
import GalleryFloor from "./floors/gallery";
import GroundFloor from "./floors/ground";
import ModsFloor from "./floors/mods";
import RestaurantFloor from "./floors/restaurant";
import NotFoundFloor from "./floors/not_found";
import SheetMusicFloor from "./floors/sheet_music";
import SkyFarmFloor from "./floors/sky_farm";
import { fetchText } from "./helpers/reader";
import Floor from "./types/floor";
import { LazyLoader } from "./types/misc";

export const CONTENTS = new Map<number, LazyLoader<string>>();

export const FLOORS = new Map<string, Floor>();
export const STATUS_FLOORS = new Map<string, Floor>();

function addFloor(floor: Floor) {
	FLOORS.set(floor.id, floor);
}
function addStatusFloor(floor: Floor) {
	STATUS_FLOORS.set(floor.id, floor);
}

addFloor(new GroundFloor());
addFloor(new InfoCenterFloor());
addFloor(new ModsFloor());
addFloor(new SkyFarmFloor());
addFloor(new RestaurantFloor());
addFloor(new SheetMusicFloor());
addFloor(new GalleryFloor());

addStatusFloor(new NotFoundFloor());

for (const floor of Array.from(FLOORS.values()).concat(Array.from(STATUS_FLOORS.values())))
	CONTENTS.set(floor.num, new LazyLoader(() => fetchText(`/contents/${floor.num}-${floor.id}.html`)));

CONTENTS.set(1000, new LazyLoader(() => fetchText(`/contents/elevator/donation.html`)));
CONTENTS.set(1001, new LazyLoader(() => fetchText(`/contents/elevator/suggestion.html`)));