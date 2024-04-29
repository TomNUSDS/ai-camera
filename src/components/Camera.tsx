import React, {useImperativeHandle, useRef} from "react";
import Webcam from "../webcam-react/react-webcam.tsx";
import {VideoConverter} from "./videoConverter.ts";
import {OverlaySvg} from "./OverlaySvg.tsx";
import {ShadowRender} from "./ShadowRender.tsx";

const videoConstraints: MediaTrackConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user"
};

export interface CameraMethods {
  getCameraEnabled: () => boolean;
  enableCamera: (newState: boolean) => string;
  switchCameras: () => string;
  takeSnapshot: (qualityLevel?: number) => Promise<Blob | undefined>;  // blob url (could be sequence of snapshots)?
  getImageData: () => ImageData | undefined;
  getDrawingCanvas: () => RenderingContext | undefined;
}

type CameraProps = {
  videoLoadedCallback?: (videoElem: HTMLVideoElement) => void;
  width: number;
  height: number;
  zoom?: number;
  // Complexity has to live somewhere
  // these are pushed up to the caller, but maybe they belong in this file?
  // they were embedded here, but less flexible?
  stylesSheet: string; // import stylesSheet from "./photoId.module.css?inline";
  styles: CSSModuleClasses; // import styles from "./photoId.module.css";

  svgString: string;
};

export const Camera = React.forwardRef<CameraMethods, CameraProps>(
  (props, forwardedRef) => {
    const {width, height, styles, stylesSheet} = props;

    // making reactive is problematic, just useRef it.
    const videoConverterRef = useRef<VideoConverter | null>(null);

    const webcamRef = useRef<Webcam>(null);
    const canvasAIRef = useRef<HTMLCanvasElement>(null);
    const svgContainerRef = useRef<HTMLDivElement>(null)
    const videoLoadOnce = useRef(false);

    const containerDivRef = useRef<HTMLDivElement>(null);
    const centerDivRef = useRef<HTMLDivElement>(null);

    // useResizeObserver(containerDivRef, (
    //   entry: ResizeObserverEntry
    // ) => {
    //   const newSize = entry.contentRect;
    //   let centerLeft = newSize.width / 2.0 - width / 2.0;
    //   let centerWidth = width;
    //   if (centerLeft < 0) {
    //     // we need to shrink the to fit.
    //     centerLeft = 0;
    //     centerWidth = newSize.width;
    //   }
    //   // CSP compliant
    //   const styleAttr = centerDivRef.current?.attributes.getNamedItem("style");
    //   if (styleAttr) {
    //     styleAttr.value = `width: ${centerWidth}px; left: ${centerLeft}px;`;
    //     centerDivRef.current?.attributes.setNamedItem(styleAttr);
    //   }
    // });

    const stylesSheetFull = `
    ${stylesSheet}
    
    .centerviewport {
      --videowidth: ${width}px; 
      --videoheight: ${height}px;
    }
    .clippingviewport {
      --videowidth: ${width}px; 
      --videoheight: ${height}px;
    }
    .video {
      --videowidth: ${width}px; 
      --videoheight: ${height}px;
    }
    `;
    // const debuggingCanvasRef = useRef<HTMLCanvasElement>(null);

    useImperativeHandle(
      forwardedRef,
      () => ({
        getCameraEnabled: () => {
          return !!(webcamRef.current?.video);
        },

        enableCamera: (newState) => {
          if (!newState) {
            videoConverterRef.current = null;
          }
          // heh, yeah
          return webcamRef.current?.stream?.getTracks()[0].label ?? "";
        },

        switchCameras: () => {
          console.error("Not implemented");
          // todo: rotate through available streams
          return webcamRef.current?.stream?.getTracks()[0].label ?? "";
        },

        takeSnapshot: async (qualityLevel?: number) => {
          if (!videoConverterRef.current) {
            return;
          }
          videoConverterRef.current.render(true, false);
          return videoConverterRef.current.getDataUrlSnapshot(qualityLevel);
        },

        getImageData: () => {
          videoConverterRef.current?.render(true);
          return videoConverterRef.current?.getImageData();
          // const canvas = videoConverterRef.current?.render(true);
          // const result = videoConverterRef.current?.getImageData();
          // if (DEBUG_DRAWING && canvas && debuggingCanvasRef.current) {
          //   const tempctx = debuggingCanvasRef.current.getContext("bitmaprenderer")
          //   if (tempctx) {
          //     const bitmap = canvas.transferToImageBitmap();
          //     tempctx.transferFromImageBitmap(bitmap);
          //   }
          // }
          // return result;
        },

        getDrawingCanvas: () => {
          const result = canvasAIRef.current?.getContext('2d', {
            willReadFrequently: true,
            antialias: false,
            depth: false
          });
          return result ?? undefined;
        }
      }));

    const cssScope800wide = width === 600 ? {['data-600x600-mode']: `'true'`} : {['data-600x800-mode']: `'true'`};

    // ShadowRender so we can do layout without concerns what happens with the
    // rest of dom/css tree
    return (
      <div key="container" ref={containerDivRef} className={styles.container} {...cssScope800wide}>
        <div key="center" className={styles.centerviewport} ref={centerDivRef}>
          <ShadowRender innerStyle={stylesSheetFull}>
            <div className={styles.clippingviewport}>
              <canvas
                ref={canvasAIRef}
                className={styles.aioverlay}
                width={width}
                height={height}/>
              <OverlaySvg
                parentDivRef={svgContainerRef}
                className={styles.svgoverlay}
                svgString={props.svgString}
              />
              <Webcam
                ref={webcamRef}
                audio={false}
                width={1280}
                height={720}
                $videoConstraints={videoConstraints}
                disablePictureInPicture={true}
                forceScreenshotSourceSize={true}
                isMirrored={true}
                screenshotFormat={"image/jpeg"}
                $screenshotQuality={1.0}
                className={styles.video}
                onVideoLoaded={(video) => {
                  if (!videoConverterRef.current && video && !videoLoadOnce.current) {
                    videoLoadOnce.current = true;
                    videoConverterRef.current = new VideoConverter(video, {
                      width, height
                    });
                    if (props.videoLoadedCallback) {
                      props.videoLoadedCallback(video);
                    }
                  }
                }}
              />
            </div>
          </ShadowRender>
        </div>
      </div>);
  });
