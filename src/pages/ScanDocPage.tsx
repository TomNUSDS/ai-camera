import {Button, Grid, GridContainer} from "@trussworks/react-uswds";
import {useCallback, useRef, useState} from "react";
import {FaceDetectorTimer} from "../ai/faceai.ts";
import {Camera, CameraMethods} from "../components/Camera.tsx";

// load styles twice. First time is standard embedding that uniquely names
// the Second is as a stylesheet that can be injected into the shadowdom
import styles from "../styles/photoId.module.css";
import stylesSheet from "../styles/photoId.module.css?inline";

const faceSvgString = `
<?xml version="1.0" encoding="UTF-8"?>
<svg id="a" xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
        <style>.b{fill:#231f20;}.b,.c{stroke-width:0px;}.c{fill:#fff;}</style>
    </defs>
    <path class="c"
          d="M590.44,322.95c-27.57,0-50-30.5-50-68s22.43-68,50-68,50,30.5,50,68-22.43,68-50,68ZM590.44,196.95c-22.06,0-40,26.02-40,58s17.94,58,40,58,40-26.02,40-58-17.94-58-40-58Z"/>
    <path class="b"
          d="M590.44,189.45c26.19,0,47.5,29.38,47.5,65.5s-21.31,65.5-47.5,65.5-47.5-29.38-47.5-65.5,21.31-65.5,47.5-65.5M590.44,315.45c23.43,0,42.5-27.14,42.5-60.5s-19.07-60.5-42.5-60.5-42.5,27.14-42.5,60.5,19.07,60.5,42.5,60.5M590.44,184.45c-14.31,0-27.67,7.55-37.62,21.27-9.6,13.23-14.88,30.72-14.88,49.23s5.28,36,14.88,49.23c9.95,13.72,23.31,21.27,37.62,21.27s27.67-7.55,37.62-21.27c9.6-13.23,14.88-30.72,14.88-49.23s-5.28-36-14.88-49.23c-9.95-13.72-23.31-21.27-37.62-21.27h0ZM590.44,310.45c-9.66,0-18.87-5.55-25.94-15.61-7.45-10.61-11.56-24.77-11.56-39.89s4.1-29.28,11.56-39.89c7.07-10.07,16.29-15.61,25.94-15.61s18.87,5.55,25.94,15.61c7.45,10.61,11.56,24.77,11.56,39.89s-4.1,29.28-11.56,39.89c-7.07,10.07-16.29,15.61-25.94,15.61h0Z"/>
    <path class="c" d="M507.44,376.95v-217h163v217h-163ZM660.44,366.95v-197h-143v197h143Z"/>
    <path class="b"
          d="M667.94,162.45v212h-158v-212h158M514.94,369.45h148v-202h-148v202M672.94,157.45h-168v222h168v-222h0ZM519.94,172.45h138v192h-138v-192h0Z"/>
    <path class="c" d="M93.44,520.95V78.95h613v442H93.44ZM696.44,510.95V88.95H103.44v422h593Z"/>
    <path class="b"
          d="M703.94,81.45v437H95.94V81.45h608M100.94,513.45h598V86.45H100.94v427M708.94,76.45H90.94v447h618V76.45h0ZM105.94,91.45h588v417H105.94V91.45h0Z"/>
    <rect class="c" x="103.54" y="438.97" width="592.7" height="9.96"/>
    <path class="b" d="M693.76,441.45v5H106.02v-5h587.74M698.72,436.49H101.07v14.92h597.65v-14.92h0Z"/>
</svg>`;

export const ScanDocPage = () => {
  const [captureEnable, setCaptureEnable] = useState<boolean>(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const takePhotoCameraRef = useRef<CameraMethods>(null);
  const WIDTH = 800;
  const HEIGHT = 600;

  const enableCamera = useCallback(() => {
    setCaptureEnable(true);
    takePhotoCameraRef.current?.enableCamera(true);
  }, []);

  const disableCamera = useCallback(() => {
    setCaptureEnable(false);
    takePhotoCameraRef.current?.enableCamera(false);
  }, []);


  const capturePhoto = useCallback(async () => {
    if (!takePhotoCameraRef.current) {
      alert("Camera isn't ready?")
      return;
    }

    const blob = await takePhotoCameraRef.current?.takeSnapshot(0.98);
    if (blob) {
      setImgSrc(URL.createObjectURL(blob));
    }
  }, [takePhotoCameraRef]);
  const faceDetectorTimer = new FaceDetectorTimer();

  return (
    <>
      <section className="usa-section">
        <GridContainer>
          <GridContainer>
            {
              captureEnable || (
                <>
                  <Grid row gap={"05"}><Grid col={12}>
                    <Button type={"button"} onClick={() => enableCamera()}>Start Camera</Button>
                  </Grid></Grid>
                  <Grid row gap={"05"}><Grid col={12} className={styles.viewport}>
                    <div className={styles.placeholder600x600}/>
                  </Grid></Grid>
                </>
              )
            }
          </GridContainer>

          {captureEnable && (
            <>
              <GridContainer>
                <Grid row gap={"05"}><Grid col={12}>
                  <Button accentStyle="warm" type={"button"} size={"big"} onClick={capturePhoto} key={"capture"}>
                    Take a picture 📷</Button>
                </Grid></Grid>
              </GridContainer>
              <GridContainer>
                <Grid row gap={"05"}><Grid col={12}>
                  <Button type={"button"} onClick={() => disableCamera()}>Turn off camera</Button>
                </Grid></Grid>
              </GridContainer>
              <GridContainer className={"fullwidth-grid-container"}>
                <Grid row gap={"05"}><Grid col={12} className={"grid600"}>
                  <Camera ref={takePhotoCameraRef}
                          width={WIDTH}
                          height={HEIGHT}
                          stylesSheet={stylesSheet}
                          styles={styles}
                          svgString={faceSvgString}
                          videoLoadedCallback={() => {
                                     if (takePhotoCameraRef.current) {
                                       const ctxAI = takePhotoCameraRef.current?.getDrawingCanvas();
                                       if (ctxAI) {
                                         setCaptureEnable(true);
                                         faceDetectorTimer.startDetecting(ctxAI,
                                           takePhotoCameraRef.current.getImageData, WIDTH, HEIGHT);
                                       }
                                     }
                                   }}
                  />
                </Grid></Grid>
              </GridContainer>
            </>)
          }
          <GridContainer>
            {imgSrc && (
              <>
                <Grid row gap={"05"}><Grid col={12}>
                  <div className={styles.viewport}>
                    <img src={imgSrc} alt="Preview photo"/>
                  </div>
                </Grid></Grid>
                <Grid row gap={"05"}><Grid col={12}>
                  <Button type={"button"}
                          onClick={() => {
                            setImgSrc(null);
                          }}
                  >Delete</Button>
                </Grid></Grid>
              </>
            )}

            {!imgSrc && (
              <Grid row gap={"05"}><Grid col={12}>
                <div className={styles.viewport}></div>
              </Grid></Grid>
            )}
          </GridContainer>
        </GridContainer>
      </section>
    </>);
}
