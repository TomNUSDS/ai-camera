import React, {ReactNode, useRef} from "react";
import {createPortal} from "react-dom";

/**
 * How to use:
 *
 * Styles: load styles twice. First time is standard embedding that uniquely names
 * the Second is as a stylesheet that can be injected into the shadowDom
 * for Vite, the `.module.` and `?inline` matter

 import styles from "./photoId.module.css";
 import stylesSheet from "./photoId.module.css?inline";
 ...
 return (<ShadowRender innerStyle={stylesSheet}>
 <div className={styles.mystylename}>
 <canvas ref={canvasAIRef} className={styles.aioverlay}/>
 ...
 </div>
 </ShadowRender>);

 * `createPortal` still uses the managed React.
 * It just MOVES the subtree to a different location in the DOM.
 * WARNING: This has UX focus implications, so it's best to embed render-only component
 * like canvas/video elements. NOT inputs/buttons.
 */
const ShadowContent = ({children, root}: {
  children: ReactNode,
  root: Element | DocumentFragment
}) => createPortal(children, root);

type ShadowRenderProps = {
  children: ReactNode;
  className?: string;
  innerStyle?: string;
};

export const ShadowRender: React.FC<ShadowRenderProps> = React.memo(({children, className, innerStyle}) => {
  const shadowRootRef = React.useRef<HTMLDivElement | null>(null);
  const [shadowRoot, setShadowRoot] = React.useState<ShadowRoot | null>(null);
  const useEffectOnce = useRef(false);

  React.useEffect(() => {
    if (shadowRoot || !shadowRootRef.current || useEffectOnce.current) {
      return;
    }
    useEffectOnce.current = true;
    const shadowRootElement = shadowRootRef.current.attachShadow({mode: 'open'});
    setShadowRoot(shadowRootElement);
  }, [shadowRoot]);

  return (
    <div ref={shadowRootRef} className={className}>{/* shadowroot attaches here */}
      {shadowRoot && (
        <ShadowContent root={shadowRoot}>
          <style dangerouslySetInnerHTML={{__html: innerStyle ?? ""}}/>
          {children}
        </ShadowContent>
      )}
    </div>
  );
});
