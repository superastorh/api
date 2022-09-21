const axios = require("axios").default;
const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;

const snap = axios.create({
  baseURL: "https://api.snapcraft.io",
  headers: {
    "X-Ubuntu-Series": "16", // for v1
    "Snap-Device-Series": "16", // for v2
  },
});
app.use(
  cors({
    credentials: true,
    origin: true,
  })
);

app.options("*", cors());

app.get("/", (req, res) => {
  res.send({ status: true });
});

app.get("/snap/download/:name", async (req, res) => {
  try {
    let { data: info } = await snap.get("/v2/snaps/info/" + req.params.name);
    let { data: details } = await snap.get(
      "/api/v1/snaps/details/" + req.params.name
    );

    //
    res.send({
      details: {
        title: details.title,
        icon: details.icon_url,
        publisher: details.publisher,
        name: req.params.name,
      },
      download: downloadSize(info),
    });
  } catch (e) {
    res.sendStatus(404);
  }
});

app.get("/snap/search/:name", async (req, res) => {
  try {
    const result = await snap.get("/v2/snaps/find?q=" + req.params.name);
    // Get fist 10 result
    const snapsList = result.data.results.slice(0, 10);

    // Get icon for all snaps
    const snapsPromise = snapsList.map(async ({ name }) => {
      const { data: details } = await snap.get("/api/v1/snaps/details/" + name);

      return {
        title: details.title,
        name,
        icon: details.icon_url,
      };
    });

    //
    res.send(await Promise.all(snapsPromise));
  } catch (e) {
    res.sendStatus(404);
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

function downloadSize(snapInfo) {
  // Get support architecture in this snap
  const architectures = Array.from(snapInfo["channel-map"]).map(
    (e) => e.channel.architecture
  );

  // Create object of architecture
  // Type: { architecture: { title: string; size: string; url: string; }[] }
  const snaps = {};
  architectures.forEach((element) => (snaps[element] = []));

  //
  snapInfo["channel-map"].forEach((e) => {
    const snap = {
      name: "",
      size: "",
      url: "",
    };
    snap.name = e.channel.name;
    snap.size = bytesToSize(e.download.size);
    snap.url = e.download.url;

    // Add snap in result
    snaps[e.channel.architecture].push(snap);
  });

  //
  return snaps;
}

function bytesToSize(bytes) {
  var sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes == 0) return "0 Byte";
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + sizes[i];
}
