// Limited OpenStreetMap footprint snapshot for dependable local development. ODbL data.
import type { BuildingData } from "@/lib/buildings";

const point = (lat: number, lon: number) => ({ lat, lon });

export const OSM_BUILDING_SAMPLES: Record<string, BuildingData[]> = {
  bengaluru: [
    { id: "osm-52060140", height: 37.4, latitude: 12.97165, longitude: 77.59431, footprint: [point(12.971792, 77.594205), point(12.9714821, 77.5942809), point(12.9715016, 77.5944082), point(12.9717562, 77.5944422), point(12.971773, 77.5942471), point(12.9718, 77.5942391)] },
    { id: "osm-331183992", height: 20.4, latitude: 12.97077, longitude: 77.59734, footprint: [point(12.9705874, 77.5972296), point(12.9705688, 77.5974035), point(12.9709606, 77.5974478), point(12.9709793, 77.597274)] },
    { id: "osm-331183994", height: 15, latitude: 12.97048, longitude: 77.5967, footprint: [point(12.9707026, 77.5966649), point(12.9706816, 77.596807), point(12.9702476, 77.5967393), point(12.9702686, 77.5965973)] }
  ],
  hyderabad: [
    { id: "osm-356454997", height: 14, latitude: 17.38588, longitude: 78.48751, footprint: [point(17.3860115, 78.4873804), point(17.3860142, 78.4875454), point(17.3859323, 78.4875468), point(17.3859325, 78.4875653), point(17.3859061, 78.4875658), point(17.3859065, 78.4875924), point(17.3858488, 78.4875934), point(17.3858496, 78.4876446), point(17.3857492, 78.4876464), point(17.3857450, 78.4873851)] },
    { id: "osm-356455002", height: 17, latitude: 17.38525, longitude: 78.48756, footprint: [point(17.3853016, 78.4874401), point(17.3853490, 78.4876823), point(17.3851984, 78.4876961), point(17.3851799, 78.4874749)] },
    { id: "osm-356455005", height: 22, latitude: 17.38600, longitude: 78.48715, footprint: [point(17.3862269, 78.4869261), point(17.3862383, 78.4872009), point(17.3862113, 78.4873410), point(17.3857495, 78.4873620), point(17.3857473, 78.4872087), point(17.3860679, 78.4869300)] },
    { id: "osm-356455016", height: 11, latitude: 17.38565, longitude: 78.48750, footprint: [point(17.3856933, 78.4874276), point(17.3857027, 78.4875636), point(17.3856122, 78.4875705), point(17.3856028, 78.4874345)] },
    { id: "osm-356455144", height: 19, latitude: 17.38618, longitude: 78.48770, footprint: [point(17.3863820, 78.4876633), point(17.3863735, 78.4877782), point(17.3859803, 78.4877464), point(17.3859887, 78.4876315)] },
    { id: "osm-356455310", height: 15, latitude: 17.38557, longitude: 78.48766, footprint: [point(17.3856954, 78.4875932), point(17.3857015, 78.4877232), point(17.3854365, 78.4877369), point(17.3854304, 78.4876068)] },
    { id: "osm-356455328", height: 9, latitude: 17.38587, longitude: 78.48775, footprint: [point(17.3859295, 78.4877335), point(17.3859249, 78.4877937), point(17.3858049, 78.4877836), point(17.3858095, 78.4877234)] },
    { id: "osm-356555143", height: 12, latitude: 17.38435, longitude: 78.48800, footprint: [point(17.3845085, 78.4879427), point(17.3845175, 78.4880791), point(17.3842181, 78.4881007), point(17.3842092, 78.4879643), point(17.3843337, 78.4879553), point(17.3843303, 78.4879029), point(17.3843784, 78.4878994), point(17.3843818, 78.4879519)] },
    { id: "osm-356555300", height: 13, latitude: 17.38562, longitude: 78.48809, footprint: [point(17.3857210, 78.4880446), point(17.3856910, 78.4881789), point(17.3855311, 78.4881397), point(17.3855611, 78.4880054)] },
    { id: "osm-356555369", height: 20, latitude: 17.38643, longitude: 78.48712, footprint: [point(17.3866073, 78.4869783), point(17.3866064, 78.4872544), point(17.3865265, 78.4872541), point(17.3865268, 78.4871482), point(17.3863442, 78.4871475), point(17.3863439, 78.4872534), point(17.3862658, 78.4872531), point(17.3862667, 78.4869771)] }
  ],
  pune: [
    { id: "osm-217271041", height: 8, latitude: 18.51872, longitude: 73.8566, footprint: [point(18.5186353, 73.8565072), point(18.5188149, 73.8565082), point(18.518814, 73.8566947), point(18.5186344, 73.8566937)] },
    { id: "osm-327073026", height: 14, latitude: 18.51881, longitude: 73.85608, footprint: [point(18.518855, 73.8560561), point(18.518856, 73.8560996), point(18.5187611, 73.8561022), point(18.5187601, 73.8560587)] },
    { id: "osm-359996814", height: 17, latitude: 18.52002, longitude: 73.85727, footprint: [point(18.5200901, 73.8571914), point(18.5200725, 73.8573581), point(18.5199453, 73.8573432), point(18.5199629, 73.8571765)] }
  ],
  gurugram: [
    { id: "osm-348485458", height: 12, latitude: 28.4621, longitude: 77.02764, footprint: [point(28.4621647, 77.0276415), point(28.4620816, 77.0277104), point(28.4620359, 77.0276391), point(28.4621189, 77.0275702)] },
    { id: "osm-348485460", height: 16, latitude: 28.46203, longitude: 77.02753, footprint: [point(28.4621036, 77.0275662), point(28.462045, 77.0276159), point(28.4619653, 77.0274948), point(28.462023, 77.0274422)] },
    { id: "osm-348485478", height: 20, latitude: 28.46191, longitude: 77.02734, footprint: [point(28.4619768, 77.0273583), point(28.4619108, 77.0274206), point(28.461842, 77.0273263), point(28.461908, 77.027264)] }
  ],
  delhi: []
};
