// this has to be js because using ts pulls in all the libraries and the webasm fails?
// no idea what's going on, but we're just going to have to do t

import {SupportedModels, createDetector, FaceDetector} from "@tensorflow-models/face-detection";
import {MediaPipeFaceDetectorMediaPipeModelConfig} from "@tensorflow-models/face-detection/dist/mediapipe/types";
import {FaceDetectorInput} from "@tensorflow-models/face-detection/dist/types";
import {nextFrame} from "@tensorflow/tfjs-core";

const AIFaceOverlayFPS = 15; // this is the AI overlay drawing

// const path = () => (window.origin.includes("web.app") ? "/mediapipe/" : "https://cdn.jsdelivr.net/npm/@mediapipe/face_detection");

export const initFaceAi = async () => {
  try {
    const model = SupportedModels.MediaPipeFaceDetector;
    const detectorConfig: MediaPipeFaceDetectorMediaPipeModelConfig = {
      runtime: 'mediapipe',
      maxFaces: 1,
      modelType: 'short',
      solutionPath: "./mediapipe/",
      // these DO NOT WORK!
      // or 'base/node_modules/@mediapipe/face_detection' in npm.
      // solutionPath: '@mediapipe/face_detection',
    };
    return createDetector(model, detectorConfig);
  } catch (err) {
    console.log(err);
  }
}

// note: OffscreenCanvasRenderingContext2D has FEWER features than CanvasRenderingContext2D
export const estimateFaceAndDrawOverlay = async (input: FaceDetectorInput | null | undefined,
                                                 ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null | undefined,
                                                 width: number, height: number,
                                                 detector: FaceDetector) => {
  if (!input || !ctx) {
    return;
  }

  const facesResults = await detector?.estimateFaces(input);
  if (facesResults && facesResults.length) {
    const face = facesResults[0];
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    // not sure why the 20 fudge
    // ctx.setTransform(-1, 0, 0, 1, width, 0);

    {
      ctx.beginPath();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 5;
      ctx.rect(face.box.xMin, face.box.yMin, face.box.width, face.box.height);
      ctx.stroke();

      // center the eye circls around the points
      const eyeWidth = 5;
      const eyeHeight = 1;
      const rightEye = face.keypoints.filter((k) => k.name === "rightEye");
      const leftEye = face.keypoints.filter((k) => k.name === "leftEye");
      const nose = face.keypoints.filter((k) => k.name === "noseTip");

      if (rightEye.length > 0) {
        ctx.beginPath();
        ctx.ellipse(
          rightEye[0].x - (eyeWidth / 2),
          rightEye[0].y - (eyeHeight / 2),
          eyeWidth, eyeHeight,
          0, 0, 360);
        ctx.stroke();
      }
      if (leftEye.length > 0) {
        ctx.beginPath();
        ctx.ellipse(
          leftEye[0].x - (eyeWidth / 2),
          leftEye[0].y - (eyeHeight / 2),
          eyeWidth, eyeHeight,
          0, 0, 360);
        ctx.stroke();
      }
      if (nose.length > 0) {
        ctx.beginPath();
        ctx.ellipse(
          nose[0].x - (eyeWidth / 2),
          nose[0].y - (eyeHeight / 2),
          eyeWidth, eyeHeight,
          0, 0, 360);
        ctx.stroke();
      }

    }

    ctx.restore();
    //console.log("faces", facesResults);
  }
}

export type GetImageDataCallback = () => ImageData | undefined;

export class FaceDetectorTimer {
  // need to clean this up!
  private detectorInside: boolean | undefined;
  private detector: FaceDetector | undefined;
  private internval: number | undefined;

  stopDetecting() {
    if (this.internval) {
      clearInterval(this.internval);
      this.internval = undefined;
    }
  }

  // takePhotoCameraRef.current?.getDrawingCanvas();
  // getImageData()=> ImageData | undefined
  startDetecting(ctxAiOverlay: RenderingContext,
                 getImageData: GetImageDataCallback,
                 width: number,
                 height: number) {
    if (!(ctxAiOverlay instanceof CanvasRenderingContext2D)) {
      console.log(`ctxAiOverlay not instanceof CanvasRenderingContext2D`);
      return;
    }

    if (this.internval) {
      clearInterval(this.internval);
      this.internval = undefined;
    }

    this.internval = window.setInterval(async () => {
      if (this.detectorInside) {
        return;
      }
      this.detectorInside = true;
      await nextFrame();
      if (!this.detector) {
        this.detector = await initFaceAi();
      }
      if (!this.detector) {
        this.detectorInside = false;
        return;
      }

      // what happens if we don't return from interval before next interval?!?
      // grab the video csv and pass to recognizer.
      const imageData = getImageData();
      if (imageData) {
        await estimateFaceAndDrawOverlay(imageData, ctxAiOverlay, width, height, this.detector);
      }

      this.detectorInside = false;
    }, 1000 / AIFaceOverlayFPS); // target fps

    // clear out the interval using the id when unmounting the component
    return () => {
      this.stopDetecting();
    }
  }
}
