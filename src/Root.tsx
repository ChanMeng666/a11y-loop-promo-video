import React from "react";
import { Composition } from "remotion";

import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./constants";
import { PromoVideo } from "./PromoVideo";

/**
 * Two masters from one timeline.
 *
 * `PromoVideo` is the film. `PromoVideoReducedMotion` is the same frames, same
 * audio, same captions, with wipes replaced by cross-fades, parallax off and
 * text arriving by opacity alone. Shipping a video that argues for
 * `prefers-reduced-motion` without offering a reduced-motion cut would be a
 * strange thing to do.
 */
export const Root: React.FC = () => (
  <>
    <Composition
      id="PromoVideo"
      component={PromoVideo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ reducedMotion: false }}
    />
    <Composition
      id="PromoVideoReducedMotion"
      component={PromoVideo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ reducedMotion: true }}
    />
  </>
);
