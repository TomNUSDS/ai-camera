// from: https://github.com/mozmorris/react-webcam/blob/master/LICENSE
import React from "react";

// polyfill based on https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
(function polyfillGetUserMedia() {
  if (typeof window === 'undefined') {
    return;
  }

  // Older browsers might not implement mediaDevices at all, so we set an empty object first
  // if (navigator.mediaDevices === undefined) {
  //   (navigator as any).mediaDevices = {};
  // }

  // Some browsers partially implement mediaDevices. We can't just assign an object
  // with getUserMedia as it would overwrite existing properties.
  // Here, we will just add the getUserMedia property if it's missing.
  if (navigator.mediaDevices?.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      // First get ahold of the legacy getUserMedia, if present
      const getUserMedia =
        navigator.webkitGetUserMedia ||
        navigator.getUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;

      // Some browsers just don't implement it - return a rejected promise with an error
      // to keep a consistent interface
      if (!getUserMedia) {
        return Promise.reject(
          new Error("getUserMedia is not implemented in this browser")
        );
      }

      // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
      return new Promise(function (resolve, reject) {
        getUserMedia.call(navigator, constraints || {}, resolve, reject);
      });
    };
  }
})();

function GetConstrainedULong(value: ConstrainULong | undefined):number {
  if (value === undefined) {
    return 0;
  }
  if (typeof value === "number") {
    return value;
  }
  return value?.ideal || value?.exact || 0;
}

function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

interface ScreenshotDimensions {
  width: number;
  height: number;
  mirrored: boolean;
}

interface ChildrenProps {
  getScreenshot: (screenshotDimensions?: ScreenshotDimensions) => string | null;
}
// {...props} passes some of these down to the video via `{...rest}` produces react warnings.
export type WebcamProps = Omit<React.HTMLProps<HTMLVideoElement>, "ref"> & {
  audio: boolean;
  audioConstraints?: MediaStreamConstraints["audio"];
  disablePictureInPicture: boolean;
  forceScreenshotSourceSize: boolean;
  imageSmoothing: boolean;
  isMirrored: boolean;
  minScreenshotHeight?: number;
  minScreenshotWidth?: number;
  onUserMedia: (stream: MediaStream) => void;
  onUserMediaError: (error: string | DOMException) => void;
  onVideoLoaded: (video: HTMLVideoElement) => void;
  screenshotFormat: "image/webp" | "image/png" | "image/jpeg";
  $screenshotQuality: number;
  $videoConstraints?: MediaStreamConstraints["video"]; // $ makes it a transient prop and not passed down to dom
  children?: (childrenProps: ChildrenProps) => Element;
}

interface WebcamState {
  hasUserMedia: boolean;
  src?: string;
}

export default class Webcam extends React.Component<WebcamProps, WebcamState> {
  static defaultProps: WebcamProps = {
    audio: false,
    disablePictureInPicture: false,
    forceScreenshotSourceSize: false,
    imageSmoothing: true,
    isMirrored: false,
    onUserMedia: () => {},
    onUserMediaError: () => {},
    onVideoLoaded: () => {},
    screenshotFormat: "image/webp",
    $screenshotQuality: 0.92,
  };

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private requestUserMediaId = 0;
  private unmounted = false;
  stream: MediaStream | null = null;
  video: HTMLVideoElement | null = null;

  constructor(props: WebcamProps) {
    super(props);
    this.state = {
      hasUserMedia: false
    };
  }

  componentDidMount() {
    const {state, props} = this;
    this.unmounted = false;

    if (!hasGetUserMedia()) {
      props.onUserMediaError("getUserMedia not supported");

      return;
    }

    if (!state.hasUserMedia) {
      this.requestUserMedia();
    }

    if (props.children && typeof props.children != 'function') {
      console.warn("children must be a function");
    }
  }

  componentDidUpdate(nextProps: WebcamProps) {
    const {props} = this;

    if (!hasGetUserMedia()) {
      props.onUserMediaError("getUserMedia not supported");

      return;
    }

    const audioConstraintsChanged =
      JSON.stringify(nextProps.audioConstraints) !==
      JSON.stringify(props.audioConstraints);
    const videoConstraintsChanged =
      JSON.stringify(nextProps.$videoConstraints) !==
      JSON.stringify(props.$videoConstraints);
    const minScreenshotWidthChanged =
      nextProps.minScreenshotWidth !== props.minScreenshotWidth;
    const minScreenshotHeightChanged =
      nextProps.minScreenshotHeight !== props.minScreenshotHeight;
    if (
      videoConstraintsChanged ||
      minScreenshotWidthChanged ||
      minScreenshotHeightChanged
    ) {
      this.canvas = null;
      this.ctx = null;
    }
    if (audioConstraintsChanged || videoConstraintsChanged) {
      this.stopAndCleanup();
      this.requestUserMedia();
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
    this.stopAndCleanup();
  }

  private static stopMediaStream(stream: MediaStream | null) {
    if (stream) {
      if (stream.getVideoTracks && stream.getAudioTracks) {
        stream.getVideoTracks().map(track => {
          stream.removeTrack(track);
          track.stop();
        });
        stream.getAudioTracks().map(track => {
          stream.removeTrack(track);
          track.stop()
        });
      } else {
        ((stream as unknown) as MediaStreamTrack).stop();
      }
    }
  }

  private stopAndCleanup() {
    const {state} = this;

    if (state.hasUserMedia) {
      Webcam.stopMediaStream(this.stream);

      if (state.src) {
        window.URL.revokeObjectURL(state.src);
      }
    }
  }

  getScreenshot(screenshotDimensions?: ScreenshotDimensions) {
    const {state, props} = this;

    if (!state.hasUserMedia) return null;

    const canvas = this.getCanvas(screenshotDimensions);
    return (
      canvas &&
      canvas.toDataURL(props.screenshotFormat, props.$screenshotQuality)
    );
  }

  getCanvas(screenshotDimensions?: ScreenshotDimensions) {
    const {state, props} = this;
    if (!this.video) {
      return null;
    }

    if (!state.hasUserMedia || !this.video.videoHeight) return null;

    if (!this.ctx) {
      let canvasWidth = this.video.videoWidth;
      let canvasHeight = this.video.videoHeight;
      if (!this.props.forceScreenshotSourceSize) {
        const aspectRatio = canvasWidth / canvasHeight;

        canvasWidth = props.minScreenshotWidth || this.video.clientWidth;
        canvasHeight = canvasWidth / aspectRatio;

        if (
          props.minScreenshotHeight &&
          canvasHeight < props.minScreenshotHeight
        ) {
          canvasHeight = props.minScreenshotHeight;
          canvasWidth = canvasHeight * aspectRatio;
        }
      }

      this.canvas = document.createElement("canvas");
      this.canvas.width = screenshotDimensions?.width || canvasWidth;
      this.canvas.height = screenshotDimensions?.height || canvasHeight;
      this.ctx = this.canvas.getContext("2d");
    }

    const {ctx, canvas} = this;

    if (ctx && canvas) {
      // adjust the height and width of the canvas to the given dimensions
      canvas.width = screenshotDimensions?.width || canvas.width;
      canvas.height = screenshotDimensions?.height || canvas.height;

      // mirror the screenshot
      const isMirrored = screenshotDimensions?.mirrored !== undefined ?
        screenshotDimensions?.mirrored :
        props.isMirrored;

      if (isMirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.imageSmoothingEnabled = props.imageSmoothing;
      const width = canvas.width;
      const height = canvas.height;
      // center of video, then offset by 50% of width
      const centerVideoX = GetConstrainedULong((props.$videoConstraints as MediaTrackConstraints).width ?? width)/2;
      const centerVideoY = GetConstrainedULong((props.$videoConstraints as MediaTrackConstraints).height ?? height)/2;
      const dx = centerVideoX - (canvas.width/2);
      const dy = centerVideoY - (canvas.height/2);

      // screenshotDimensions?.width || canvas.width,
      // screenshotDimensions?.height || canvas.height
      // image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number
      ctx.drawImage(this.video,
        dx, // sx
        dy, // sy
        width, //sw
        height, //sh
        0, //dx
        0, // dy
        width, // dw
        height, // dh
      );

      // invert mirroring
      if (isMirrored) {
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
      }
    }

    return canvas;
  }

  private requestUserMedia() {
    const {props} = this;

    const sourceSelected = (
      audioConstraints: boolean | MediaTrackConstraints | undefined,
      videoConstraints: boolean | MediaTrackConstraints | undefined,
    ) => {
      const constraints: MediaStreamConstraints = {
        video: typeof videoConstraints !== "undefined" ? videoConstraints : true
      };

      if (props.audio) {
        constraints.audio =
          typeof audioConstraints !== "undefined" ? audioConstraints : true;
      }

      this.requestUserMediaId++
      const myRequestUserMediaId = this.requestUserMediaId

      navigator.mediaDevices
        .getUserMedia(constraints)
        .then(stream => {
          if (this.unmounted || myRequestUserMediaId !== this.requestUserMediaId) {
            Webcam.stopMediaStream(stream);
          } else {
            this.handleUserMedia(null, stream);
          }
        })
        .catch(e => {
          this.handleUserMedia(e);
        });
    };

    if ("mediaDevices" in navigator) {
      sourceSelected(props.audioConstraints, props.$videoConstraints);
    } else {
      const optionalSource = (id: string | null) => ({optional: [{sourceId: id}]}) as MediaTrackConstraints;

      const constraintToSourceId = (constraint: MediaTrackConstraintSet | boolean | undefined): string | null => {
        if ((typeof constraint === "boolean") || constraint === undefined) {
          // technically, constraint=true from type decl but I'm not sure what that means.
          return null;
        }
        const {deviceId} = constraint;

        if (typeof deviceId === "string") {
          return deviceId;
        }

        if (Array.isArray(deviceId) && deviceId.length > 0) {
          return deviceId[0];
        }

        if (typeof deviceId === "object" && (deviceId as ConstrainDOMStringParameters).ideal) {
          const ideal = (deviceId as ConstrainDOMStringParameters).ideal; // can be string array
          if (Array.isArray(ideal)) {
            return ideal[0] || null;
          }
          return ideal || null;
        }

        return null;
      };

      // @ts-expect-error: deprecated api
      MediaStreamTrack.getSources(sources => {
        let audioSource: string | null = null;
        let videoSource: string | null = null;

        sources.forEach((source: MediaStreamTrack) => {
          if (source.kind === "audio") {
            audioSource = source.id;
          } else if (source.kind === "video") {
            videoSource = source.id;
          }
        });

        const audioSourceId = constraintToSourceId(props.audioConstraints);
        if (audioSourceId) {
          audioSource = audioSourceId;
        }

        const videoSourceId = constraintToSourceId(props.$videoConstraints);
        if (videoSourceId) {
          videoSource = videoSourceId;
        }

        sourceSelected(
          optionalSource(audioSource),
          optionalSource(videoSource)
        );
      });
    }
  }

  private handleUserMedia(err: string | DOMException | null, stream?: MediaStream) {
    const {props} = this;

    if (err || !stream) {
      this.setState({hasUserMedia: false});
      props?.onUserMediaError(err || "Missing media stream");
      console.error(err || "Missing media stream", err);
      return;
    }

    this.stream = stream;

    try {
      if (this.video) {
        this.video.srcObject = stream;
      }
      this.setState({hasUserMedia: true});
    } catch (error) {
      this.setState({
        hasUserMedia: true,
        src: stream.id || "" // was `window.URL.createObjectURL(stream) : "";` cannot turn a MediaStream in url like this
      });
    }

    props.onUserMedia(stream);
  }

  render() {
    const {state, props} = this;

    const {
      audio,
      // forceScreenshotSourceSize,
      disablePictureInPicture,
      // onUserMedia,
      // onUserMediaError,
      // screenshotFormat,
      // screenshotQuality,
      // minScreenshotWidth,
      // minScreenshotHeight,
      // audioConstraints,
      // videoConstraints,
      // imageSmoothing,
      isMirrored,
      style = {},
      children
    } = props;

    const videoStyle = isMirrored ? {...style, transform: `${style.transform || ""} scaleX(-1)`} : style;

    const childrenProps: ChildrenProps = {
      getScreenshot: this.getScreenshot.bind(this),
    };

    // todo: remove $ props from `rest`
    return (
      <>
        <video
          autoPlay
          disablePictureInPicture={disablePictureInPicture}
          src={state.src}
          muted={!audio}
          playsInline
          ref={ref => {
            this.video = ref;
            this.video?.addEventListener('loadeddata', function () {
              // @ts-ignore
              props?.onVideoLoaded(ref);
            }, {once: true}); // even with once it can get called multiple times.
          }}
          style={videoStyle}
          className={props.className}
        />
        {children && children(childrenProps)}
      </>
    );
  }
}
