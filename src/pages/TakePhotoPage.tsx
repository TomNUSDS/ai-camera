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
<svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
        <style>
            .cls-1{stroke:#fff;}.cls-1,.cls-2{fill:#231f20;stroke-miterlimit:10;stroke-width:3px;}.cls-2{stroke:#f1f2f2;}
        </style>
    </defs>
    <path class="cls-1"
          d="M301.5,462.82c-41.93,0-81.28-21.33-110.82-60.06-29.32-38.45-45.47-89.51-45.47-143.79s16.15-105.35,45.47-143.79c29.54-38.73,68.89-60.06,110.82-60.06s81.28,21.33,110.82,60.06c29.32,38.45,45.47,89.52,45.47,143.79s-16.15,105.35-45.47,143.79c-29.54,38.73-68.89,60.06-110.82,60.06ZM301.5,62.11c-82.32,0-149.29,88.31-149.29,196.85s66.97,196.85,149.29,196.85,149.29-88.31,149.29-196.85S383.82,62.11,301.5,62.11Z"/>
    <rect class="cls-2" x="298" y="1.5" width="7" height="6"/>
    <path class="cls-2"
          d="M305,583.5h-7v-12h7v12ZM305,559.5h-7v-12h7v12ZM305,535.5h-7v-12h7v12ZM305,511.5h-7v-12h7v12ZM305,487.5h-7v-12h7v12ZM305,463.5h-7v-12h7v12ZM305,439.5h-7v-12h7v12ZM305,415.5h-7v-12h7v12ZM305,391.5h-7v-12h7v12ZM305,367.5h-7v-12h7v12ZM305,343.5h-7v-12h7v12ZM305,319.5h-7v-12h7v12ZM305,295.5h-7v-12h7v12ZM305,271.5h-7v-12h7v12ZM305,247.5h-7v-12h7v12ZM305,223.5h-7v-12h7v12ZM305,199.5h-7v-12h7v12ZM305,175.5h-7v-12h7v12ZM305,151.5h-7v-12h7v12ZM305,127.5h-7v-12h7v12ZM305,103.5h-7v-12h7v12ZM305,79.5h-7v-12h7v12ZM305,55.5h-7v-12h7v12ZM305,31.5h-7v-12h7v12Z"/>
    <rect class="cls-2" x="298" y="595.5" width="7" height="6"/>
    <rect class="cls-2" x="1.5" y="178.07" width="6" height="7"/>
    <path class="cls-2"
          d="M583.5,185.07h-12v-7h12v7ZM559.5,185.07h-12v-7h12v7ZM535.5,185.07h-12v-7h12v7ZM511.5,185.07h-12v-7h12v7ZM487.5,185.07h-12v-7h12v7ZM463.5,185.07h-12v-7h12v7ZM439.5,185.07h-12v-7h12v7ZM415.5,185.07h-12v-7h12v7ZM391.5,185.07h-12v-7h12v7ZM367.5,185.07h-12v-7h12v7ZM343.5,185.07h-12v-7h12v7ZM319.5,185.07h-12v-7h12v7ZM295.5,185.07h-12v-7h12v7ZM271.5,185.07h-12v-7h12v7ZM247.5,185.07h-12v-7h12v7ZM223.5,185.07h-12v-7h12v7ZM199.5,185.07h-12v-7h12v7ZM175.5,185.07h-12v-7h12v7ZM151.5,185.07h-12v-7h12v7ZM127.5,185.07h-12v-7h12v7ZM103.5,185.07h-12v-7h12v7ZM79.5,185.07h-12v-7h12v7ZM55.5,185.07h-12v-7h12v7ZM31.5,185.07h-12v-7h12v7Z"/>
    <rect class="cls-2" x="595.5" y="178.07" width="6" height="7"/>
    <rect class="cls-2" x="1.5" y="250.72" width="6" height="7"/>
    <path class="cls-2"
          d="M583.5,257.72h-12v-7h12v7ZM559.5,257.72h-12v-7h12v7ZM535.5,257.72h-12v-7h12v7ZM511.5,257.72h-12v-7h12v7ZM487.5,257.72h-12v-7h12v7ZM463.5,257.72h-12v-7h12v7ZM439.5,257.72h-12v-7h12v7ZM415.5,257.72h-12v-7h12v7ZM391.5,257.72h-12v-7h12v7ZM367.5,257.72h-12v-7h12v7ZM343.5,257.72h-12v-7h12v7ZM319.5,257.72h-12v-7h12v7ZM295.5,257.72h-12v-7h12v7ZM271.5,257.72h-12v-7h12v7ZM247.5,257.72h-12v-7h12v7ZM223.5,257.72h-12v-7h12v7ZM199.5,257.72h-12v-7h12v7ZM175.5,257.72h-12v-7h12v7ZM151.5,257.72h-12v-7h12v7ZM127.5,257.72h-12v-7h12v7ZM103.5,257.72h-12v-7h12v7ZM79.5,257.72h-12v-7h12v7ZM55.5,257.72h-12v-7h12v7ZM31.5,257.72h-12v-7h12v7Z"/>
    <rect class="cls-2" x="595.5" y="250.72" width="6" height="7"/>
</svg>`;

export const TakePhotoPage = () => {
  const [captureEnable, setCaptureEnable] = useState<boolean>(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const takePhotoCameraRef = useRef<CameraMethods>(null);
  const WIDTH = 600;
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

          {
            captureEnable && (
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
                            height={WIDTH}
                            width={HEIGHT}
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
