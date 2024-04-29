import {RefObject, useRef} from "react";

export const OverlaySvg = (props: {
  svgString: string,
  className?: string,
  parentDivRef?: RefObject<HTMLDivElement> | null}) => {
  // this approach could allow us to override/customize the svg
  const svgdivref = useRef<HTMLDivElement>( null);
  const localref = props.parentDivRef || svgdivref;

  return <div
    ref={localref}
    className={props.className}
    key={"main-overlay"}
    dangerouslySetInnerHTML={{
      __html: props.svgString, // all elements inserted into svg MUST be DOMPurify.sanitize
    }}
  />
}
