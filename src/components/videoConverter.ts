type VideoConverterProps = {
  width: number;
  height: number;
  viewportScale: number;
  viewportTranslateX: number;
  viewportTranslateY: number;
}

export type VideoConverterOptional = Partial<VideoConverterProps>;

export class VideoConverter {
  private readonly offscreenCanvas: OffscreenCanvas;
  private readonly ctx;
  private svg2DPath: Path2D | undefined;
  private readonly video: HTMLVideoElement;
  private props: VideoConverterProps;

  constructor(video: HTMLVideoElement, props?: VideoConverterOptional) {
    this.video = video;
    this.props = {
      // defaults
      width: video.videoWidth,
      height: video.videoHeight,
      viewportScale: 1.0,
      viewportTranslateX: 0,
      viewportTranslateY: 0,
      // overridden by params passed in
      ...props
    };

    this.offscreenCanvas = new OffscreenCanvas(this.props.width, this.props.height);
    // see https://developer.mozilla.org/en-US/docs/web/api/offscreencanvas/getcontext
    this.ctx = this.offscreenCanvas.getContext("2d", {
      willReadFrequently: true, // Firefox only
      antialias: false, // imageSmoothingEnabled=false
      depth: true,
      failIfMajorPerformanceCaveat: false, // useful to be true?
    });
  }

  render(mirrored: boolean = true, drawoverlay: boolean = false) {
    if (!this.ctx || this.video.videoWidth === 0 || this.video.videoHeight === 0) {
      return null;
    }

    const destWidth = this.props.width;
    const destHeight = this.props.height;
    const videoCenterX = this.video.videoWidth / 2;
    const videoCenterY = this.video.videoHeight / 2;
    const destCenterX = destWidth / 2;
    const destCenterY = destHeight / 2;

    const sx = videoCenterX - destCenterX + (this.props.viewportTranslateX);
    const sy = videoCenterY - destCenterY + (this.props.viewportTranslateY);
    // todo: handle mirror
    this.ctx.save();
    this.ctx.scale((mirrored ? -1 : 1) * this.props.viewportScale, this.props.viewportScale);
    this.ctx.drawImage(this.video,
      // source
      sx,
      sy,
      destWidth,
      destHeight,
      // destination
      mirrored ? this.props.width * -1 : 0,
      0,
      destWidth, // we kind of want 1:1
      destHeight);
    if (drawoverlay && this.svg2DPath) {
      this.ctx.fill(this.svg2DPath);
    }
    this.ctx.restore();
    return this.offscreenCanvas;
  }

  /**
   * make sure to call render first
   * @param quality 0.0 - 1.0
   */
  getDataUrlSnapshot(quality: number = 1.0) {
    // todo: restrict size down to just region we care about
    return this.offscreenCanvas.convertToBlob({type: "image/jpeg", quality})
  }

  getContext() {
    return this.ctx;
  }

  // make sure to call render first
  getImageData(sx = 0,
               sy = 0,
               width = this.props.width,
               height = this.props.height) {
    return this.ctx?.getImageData(sx, sy,
      width, height, {colorSpace: "srgb"});
  }
}
