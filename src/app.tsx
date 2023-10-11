import { getInputSourceId, getPlaneId } from "@coconut-xr/natuerlich";
import { XCurvedPointer } from "@coconut-xr/xinteraction/react";
import {
  DynamicHandModel,
  HandBoneGroup,
  ImmersiveSessionOrigin,
  SpaceGroup,
  TrackedPlane,
  XR,
  useEnterXR,
  useHandPoses,
  useInputSources,
  useTrackedPlanes,
} from "@coconut-xr/natuerlich/react";
import { ThreeEvent } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  BackSide,
  BufferGeometry,
  CanvasTexture,
  Mesh,
  Triangle,
  Vector2,
  Vector3,
} from "three";
import { Sphere } from "@react-three/drei";

const options: XRSessionInit = {
  requiredFeatures: ["local-floor", "plane-detection"],
  optionalFeatures: ["hand-tracking"],
};

const triangleHelper = new Triangle();

export default function App() {
  const enterVR = useEnterXR("immersive-ar", options);
  useEffect(() => {
    const element = document.getElementById("enter-vr");
    if (element == null) {
      return;
    }
    element.style.display = "block";
    element.addEventListener("click", enterVR);
    return () => element.removeEventListener("click", enterVR);
  }, []);
  const planes = useTrackedPlanes();
  return (
    <>
      <XR />
      <ambientLight />
      <directionalLight position={[1, 1, 1]} />
      <ImmersiveSessionOrigin>
        <Hands />
      </ImmersiveSessionOrigin>
      {planes?.map((plane) => (
        <Wall key={getPlaneId(plane)} plane={plane} />
      ))}
    </>
  );
}

function Hands() {
  const inputSources = useInputSources();
  return (
    <>
      {inputSources.map((inputSource) =>
        inputSource.hand == null ? undefined : (
          <Hand
            key={getInputSourceId(inputSource)}
            hand={inputSource.hand}
            inputSource={inputSource}
          />
        )
      )}
    </>
  );
}

const shortLine = [new Vector3(0, 0, 0.03), new Vector3(0, 0, -0.025)];
const longLine = [new Vector3(0, 0, 0.06), new Vector3(0, 0, -0.06)];
//const geometry = new BufferGeometry().setFromPoints(longLine);

function Hand({
  inputSource,
  hand,
}: {
  inputSource: XRInputSource;
  hand: XRHand;
}) {
  const [rubber, setRubber] = useState(false);
  useHandPoses(
    hand,
    inputSource.handedness,
    useCallback((pose: string) => setRubber(pose === "fist"), []),
    {
      fist: "fist.handpose",
      point: "point.handpose",
    }
  );
  return (
    <Suspense>
      <group visible={false}>
        <DynamicHandModel hand={hand} handedness={inputSource.handedness}>
          <HandBoneGroup joint="index-finger-tip">
            {!rubber && (
              <XCurvedPointer
                id={getInputSourceId(inputSource)}
                points={shortLine}
              />
            )}
          </HandBoneGroup>
          <HandBoneGroup joint="wrist">
            {rubber && (
              <group
                rotation-y={
                  inputSource.handedness === "left" ? Math.PI / 2 : -Math.PI / 2
                }
                position-z={-0.07}
                position-y={-0.03}
              >
                <XCurvedPointer
                  id={-getInputSourceId(inputSource)}
                  points={longLine}
                />
              </group>
            )}
          </HandBoneGroup>
        </DynamicHandModel>
      </group>
    </Suspense>
  );
}

const canvasSize = 2048;

function Wall({ plane }: { plane: XRPlane }) {
  const canvas = useMemo(() => {
    const element = document.createElement("canvas");
    element.width = canvasSize;
    element.height = canvasSize;
    return element;
  }, []);
  const context = useMemo(() => canvas.getContext("2d")!, [canvas]);
  const texture = useMemo(() => new CanvasTexture(canvas), [canvas]);
  const lastPositionMap = useMemo(() => new Map<number, Vector2>(), []);
  return (
    <TrackedPlane
      plane={plane}
      onPointerMove={useCallback(
        (e: ThreeEvent<PointerEvent>) => {
          const point = new Vector2(
            Math.floor(e.uv!.x * canvasSize),
            canvasSize - Math.floor(e.uv!.y * canvasSize)
          );
          if (e.pointerId < 0) {
            //eraser
            context.beginPath();
            context.globalCompositeOperation = "destination-out";
            context.moveTo(point.x, point.y);
            context.arc(point.x, point.y, 25, 0, 2 * Math.PI);
            context.fill();
            texture.needsUpdate = true;
            return;
          }
          context.beginPath();
          const lastPoint = lastPositionMap.get(e.pointerId) ?? point;
          lastPositionMap.set(e.pointerId, point);
          context.globalCompositeOperation = "source-over";
          context.lineWidth = 4;
          context.moveTo(lastPoint.x, lastPoint.y);
          context.lineTo(point.x, point.y);
          context.stroke();
          texture.needsUpdate = true;
        },
        [context]
      )}
      onPointerLeave={useCallback(
        (e: ThreeEvent<PointerEvent>) => lastPositionMap.delete(e.pointerId),
        []
      )}
    >
      <meshBasicMaterial side={BackSide} map={texture} transparent />
    </TrackedPlane>
  );
}
