const express = require("express");
const NodeGeocoder = require("node-geocoder");
const turf = require("@turf/turf");

const polygons = require("./data/polygons.json");
const PORT = 3001;

const app = express();
app.use(express.json());

app.post("/check_address", async (req, res, next) => {
  try {
    const { address, pointPolygon } = req.body;
    if (!address || !pointPolygon) {
      throw new Error("No ingresaste una direccion o el poligono");
    }

    const geocoderOptions = {
      provider: "openstreetmap",
    };
    const geocoder = NodeGeocoder(geocoderOptions);

    const geocoded = await geocoder.geocode(address);

    if (!geocoded || geocoded.length === 0) {
      throw new Error("No se pudo encontrar la direccion");
    }

    const point = turf.point([geocoded[0].longitude, geocoded[0].latitude]);

    const isValidAddress = turf.booleanPointInPolygon(
      point,
      turf.polygon([pointPolygon])
    );

    if (isValidAddress)
      return res.status(200).json({
        esta_dentro: isValidAddress,
      });

    if (!isValidAddress)
      return res.status(400).json({
        esta_dentro: isValidAddress,
        message: "No se encuentra dentro del poligono",
      });
  } catch (error) {
    console.log("ERROR: ", error);
    return res.status(400).json({ message: error.message });
  }
});

app.post("/check_address-v2", async (req, res, next) => {
  try {
    const address = req.body.address;
    if (!req.body.address) throw new Error("No ingresaste una direccion");

    const geocoderOptions = {
      provider: "openstreetmap",
    };
    const geocoder = NodeGeocoder(geocoderOptions);

    const geocoded = await geocoder.geocode(address);

    if (!geocoded || geocoded.length === 0) {
      throw new Error("No se pudo encontrar la direccion");
    }

    const point = turf.point([geocoded[0].longitude, geocoded[0].latitude]);

    let isValidAddress = false;
    for (let i = 0; polygons.features.length > i; i++) {
      const multiPolygon = polygons.features[i].geometry.coordinates;
      isValidAddress = turf.booleanPointInPolygon(
        point,
        turf.multiPolygon(multiPolygon)
      );

      if (isValidAddress)
        return res.status(200).json({
          esta_dentro: isValidAddress,
          city: polygons.features[i].properties.NAME_1,
        });
    }

    if (!isValidAddress)
      return res.status(400).json({
        esta_dentro: isValidAddress,
        message: "No se encuentra en los poligonos",
      });
  } catch (error) {
    console.log("ERROR: ", error);
    return res.status(400).json({ message: error.message });
  }
});

app.listen(3001, () => {
  console.log(`Listening on port: ${PORT}`);
});
