import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { writeFileSync, mkdirSync } from "fs";

globalThis.FileReader = class FileReader {
  result = null;
  onload = null;
  onerror = null;
  readAsDataURL(blob) {
    Promise.resolve(blob.arrayBuffer()).then((buf) => {
      this.result =
        "data:application/octet-stream;base64," +
        Buffer.from(buf).toString("base64");
      this.onload?.({ target: this });
    });
  }
  readAsArrayBuffer(blob) {
    Promise.resolve(blob.arrayBuffer()).then((buf) => {
      this.result = buf;
      this.onload?.({ target: this });
    });
  }
};

mkdirSync("public/models/bottles", { recursive: true });

const mesh = new THREE.Mesh(
  new THREE.CylinderGeometry(0.2, 0.25, 1, 32),
  new THREE.MeshStandardMaterial({ color: 0x8b4513 }),
);

const exporter = new GLTFExporter();
console.log("start");

await new Promise((resolve, reject) => {
  exporter.parse(
    mesh,
    (result) => {
      console.log("got", result instanceof ArrayBuffer, result?.byteLength);
      writeFileSync("public/models/bottles/test.glb", Buffer.from(result));
      resolve();
    },
    reject,
    { binary: true },
  );
});

console.log("done");
