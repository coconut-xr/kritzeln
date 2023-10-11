//import { noEvents } from "@coconut-xr/xinteraction/react";
import { createRoot, extend } from "@react-three/fiber";
import { noEvents } from "@coconut-xr/xinteraction/react";
import * as THREE from "three";
import App from "./app.js";

extend(THREE);

const root = createRoot(document.getElementById("root") as HTMLCanvasElement);

// Configure the root, inject events optionally, set camera, etc
root.configure({
  //events: noEvents,
  camera: { position: [0, 0, 50] },
  dpr: window.devicePixelRatio,
  gl: { antialias: true, localClippingEnabled: true },
  events: noEvents,
});

// createRoot by design is not responsive, you have to take care of resize yourself
window.addEventListener("resize", () => {
  const { width, height } = document.body.getBoundingClientRect();
  root.configure({
    size: {
      top: 0,
      left: 0,
      width,
      height,
    },
    dpr: window.devicePixelRatio,
  });
});

// Trigger resize
window.dispatchEvent(new Event("resize"));

root.render(<App />);
