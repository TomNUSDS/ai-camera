import React, { useCallback, useEffect, useImperativeHandle, useRef, useState} from "react";
import {VideoConverter} from "./videoConverter.ts";
/**
 * WORK IN PROGRESS:
 * **/

export interface PhotoIdPreviewMethods {
  // returns video input name
  enableCamera: (newState: boolean) => string;
  // switch
  switchCameras: () => string;
  takeSnapshot: () => Promise<Blob | undefined>;  // blob url (could be sequence of snapshots)?
}

type VideoCapturerProps = {
  videoResolution?: "480p" | "720p";   // 640x480 | 1280x720
  videoSource?: string;
  targetFps?: number; // this is for the AI, not the video.
  width?: number;
  height?: number;
  svgOverlay?: string;
  className?: string;
};

/**
 * WORK IN PROGRESS:
 * Reimplement using shadowdom and native calls instead of react-webcam
 * https://gourav.io/blog/render-react
 * https://github.com/treshugart/react-shade/tree/master
 * /*
 *   TODO: this whole page approach is a hack. It needs to be broken out into
 *         components, but for the demo purpose, it's fine.
 *
 *   The layout is tricky.
 *
 *
 *        ┌───────────────────────────────────┐
 *        │┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼│   Page
 *        ├───────────────────────────────────┤     │
 *        │                                   │     │
 *        │                                ◄──┼─────┘
 *        │                                   │      Video
 *   ┌────┼───────────────────────────────────┼────┐   ┼ 1280x720
 *   │    │ ┌───────────────────────────────┐ │    │   │
 *   │    │ │                               │ │  ◄─┼───┘
 *   │    │ │                               │ │    │
 *   │    │ │                               │ │    │
 *   │    │ │                               │ │    │    Viewport
 *   │    │ │                               │ │    │       ┼ 600x600
 *   │    │ │                               │ │    │       │
 *   │    │ │                         ◄─────┼─┼────┼───────┘
 *   │    │ │                               │ │    │
 *   │    │ │                               │ │    │
 *   │    │ │                               │ │    │
 *   │    │ └───────────────────────────────┘ │    │
 *   └────┼───────────────────────────────────┼────┘
 *        │                                   │
 *        │                                   │
 *        └───────────────────────────────────┘
 *
 * Mobile can be smaller than 600px wide (e.g. 480×800, 640×1136).
 * We could require landscape mode or we can have the Viewport go
 * all the way to the edges and scale it. e.g. 480x480 or 640x640.
 *
 * We need to pass the
 **/

const hasGetUserMedia = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

export const _VideoCapturer = React.forwardRef<PhotoIdPreviewMethods, VideoCapturerProps>(
  (props, ref) => {
    const initOnceRef = useRef(false);
    // used to quickly take screenshots of video and pass resulting images to AI
    const [videoConverter, setVideoConverter] = useState<VideoConverter | null>(null);
    const {videoResolution, targetFps, width, height, svgOverlay, className} = {
      // defaults for optional params
      videoResolution: "720p",
      targetFps: 30,
      width: 600,
      height: 600,
      svgOverlay: "",
      className: "",
      // passed in override
      ...props
    };

    const clippingContainerRef = useRef<HTMLDivElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const trackRef = useRef<MediaStreamTrack | null>(null);
    const trackSettings = useRef<MediaTrackSettings | null>(null);
    const canvasOverlayRef = useRef<HTMLCanvasElement>(null);

    const svg2DPathRef = useRef<Path2D | null>(svgOverlay.length ? new Path2D(svgOverlay) : null);

    // Methods that can be called on component

    useImperativeHandle(
      ref,
      () => ({
        enableCamera: (newState) => {
          if (!initOnceRef) {
            return "";
          }

          if (!newState) {
            // stop
            streamRef.current?.getVideoTracks().map((track) => {
              streamRef.current?.removeTrack(track);
              track.stop();
            });
          } else {
            // start
          }

          return trackRef.current?.label || "";
        },

        switchCameras: () => {
          debugger;
          return trackRef.current?.label || "";
        },

        takeSnapshot: async () => {
          if (!initOnceRef) {
            return;
          }
          videoConverter?.render(true, false);
          return videoConverter?.getDataUrlSnapshot();
        }
      }));

    const initAsync = useCallback(async () => {
      const {width, height} = videoResolution === "480p" ? {width: 480, height: 640} : {width: 720, height: 1280};
      const viewWidth = props.width ?? width;
      const viewHieght = props.height ?? height;
      const clipview = clippingContainerRef.current;
      if (clipview) {
        clipview.style.width = `${viewWidth}px`;
        clipview.style.height = `${viewHieght}px`;
        clipview.style.overflow = "hidden";
        clipview.style.position = "abosolute";
      }


      const videoElem = videoRef.current;
      if (!videoElem) {
        return;
      }
      videoElem.width = width;
      videoElem.height = height;

      const overlayCanvas = canvasOverlayRef.current;
      if (overlayCanvas) {
        // todo: make sure to center the image in this canvas
        overlayCanvas.width = viewWidth;
        overlayCanvas.height = viewHieght;
      }

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: 'user',
          width: window.innerWidth > window.innerHeight ? {ideal: window.innerWidth} : undefined,
          height: window.innerWidth < window.innerHeight ? {ideal: window.innerHeight} : undefined,
        }
      };
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        if (!(err instanceof Error)) {
          console.log("Unexpected err", err);
          return;
        }
        if (err?.name === 'PermissionDeniedError' || err?.name === 'NotAllowedError') {
          console.log(`Camera Error: camera permission denied:`, err);
        } else if (err?.name === 'SourceUnavailableError') {
          console.log(`Camera Error: camera not available`, err);
        } else {
          console.log("Unexpected err", err);
        }
        return;
      }

      if (!streamRef.current) {
        console.log('Camera Error: stream empty');
        return;
      }

      videoElem.srcObject = streamRef.current;
      trackRef.current = streamRef.current.getVideoTracks()[0];
      const settings = trackRef.current.getSettings();
      if (settings.aspectRatio) {
        settings.aspectRatio = Math.trunc(100 * settings.aspectRatio) / 100;
      }
      trackSettings.current = settings;
      console.log(`Camera active: ${trackRef.current.label}`);
      console.log(`Camera settings:`, settings);

      videoElem.onloadeddata = async () => {
        // if successful
        setVideoConverter(new VideoConverter(videoElem, {
          width,
          height,
        }));
        videoElem.play();
        videoRef.current = videoElem;
      };
    }, [])

    useEffect(() => {
      if (initOnceRef.current) {
        return;
      }

      if (!hasGetUserMedia()) {
        // permissions rejected or no camera
        return;
      }

      if (!navigator.mediaDevices) {
        console.warn('Camera Error: access not supported');
        return;
      }
      initOnceRef.current = true; // don't run again.
      initAsync();
    }, [initOnceRef]);

    return <div ref={clippingContainerRef} className={"clipping-container"}>
      <canvas ref={canvasOverlayRef}></canvas>
      <video ref={videoRef}></video>
    </div>;
  });
