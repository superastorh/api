const fetch = require("node-fetch");
const express = require('express');
var cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(
    cors({
        credentials: true,
        origin: true
    })
);

app.options('*', cors());

app.get('/api/:name', async (req, res) => {
  let snap = await getSnap(req.params.name);
  res.send(softSnap(snap));
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

async function getSnap(name) {
  let snap = await fetch("http://api.snapcraft.io/v2/snaps/info/" + name, {
    method: "GET",
    headers: {
      "Snap-Device-Series": "16",
    },
  });
  return await snap.json();
}

function softSnap(responsJson) {
  let architecture = [...responsJson["channel-map"].map(
    (e) => e.channel.architecture
  )];
  architecture = architecture.filter(
    (element, index, array) => array.findIndex((e) => e === element) === index
  );
  let snaps = {};
  architecture.forEach((e) => (snaps[e] = []));
  responsJson["channel-map"].forEach((e) => {
    e.download.size = bytesToSize(e.download.size)
    snaps[e.channel.architecture].push(e);
  });
  responsJson["channel-map"] = snaps;
  return responsJson;
}

function bytesToSize(bytes) {
  var sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes == 0) return "0 Byte";
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
}

