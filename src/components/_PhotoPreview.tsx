import React, {useImperativeHandle, useRef} from "react";


export interface PhotoPreviewMethods {
  setImage: (image: HTMLImageElement) => string | null;
}

export type PhotoPreviewProps = {
  width: number;
  height: number;
  quality: number
}

export const _PhotoPreview = React.forwardRef<PhotoPreviewMethods, PhotoPreviewProps>(
  (props, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);


    useImperativeHandle(
      ref,
      () => ({
        setImage: (image: HTMLImageElement): string | null => {
          const canvas = canvasRef.current;
          if (!canvas) {
            return null;
          }
          const context = canvas?.getContext('2d');
          if (!context) {
            return null;
          }
          context.drawImage(image, 0, 0, props.width, props.height, props.width / 2, props.height / 2, props.width, props.height);
          const url = canvas.toDataURL("image/jpeg", props.quality);
          return url;
        }
      }), [canvasRef]);

    return <>
      <canvas ref={canvasRef} id="snapshot" width={`${props.width}px`} height={`${props.height}px`}></canvas>
    </>;
  });
