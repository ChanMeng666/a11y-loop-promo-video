import React from "react";

import { TYPE } from "../constants";
import {
  Beats,
  Eyebrow,
  Figure,
  Focused,
  Gap,
  Lead,
  Note,
  Stage,
  useInk,
} from "../components/Stage";
import { Counter } from "../components/Counter";

/**
 * Scene 2 — why this keeps happening. 0:13.5–0:31.5.
 *
 * On ink, because this is the problem and the film should feel it change
 * temperature here.
 *
 * Two beats, one number each. The previous cut put both statistics, a
 * headline, an eyebrow, six failure-class pills and a two-line source note on
 * screen simultaneously — six things competing while the narration said one.
 */

const First: React.FC = () => {
  const { accent, muted } = useInk();
  return (
    <>
      <Eyebrow>It isn’t that developers don’t care</Eyebrow>
      <Gap size="s" />
      <Focused at={26} style={{ alignSelf: "flex-start" }}>
        <Figure color={accent}>
          <Counter from={0} to={84} startFrame={8} durationInFrames={34} size={TYPE.figure} color={accent} />%
        </Figure>
      </Focused>
      <Gap />
      <Lead>of AI-generated web pages ship with accessibility failures.</Lead>
      <Gap size="s" />
      <Note>
        <span style={{ color: muted }}>Web4All 2024</span>
      </Note>
    </>
  );
};

const Second: React.FC = () => {
  const { fail, muted, fg } = useInk();
  return (
    <>
      <Eyebrow>And prompting doesn’t fix it</Eyebrow>
      <div style={{ display: "flex", gap: 100, alignItems: "flex-end" }}>
        <div>
          <Figure color={fail} size={150}>
            17.32%
          </Figure>
          <div style={{ fontSize: TYPE.body, color: fg, marginTop: 14 }}>
            asked for accessible code
          </div>
        </div>
        <div>
          <Figure color={muted} size={150}>
            15.93%
          </Figure>
          <div style={{ fontSize: TYPE.body, color: muted, marginTop: 14 }}>didn’t ask</div>
        </div>
      </div>
      <Gap />
      <Lead>Asking made it worse.</Lead>
      <Gap size="s" />
      <Note>Violation rate, Web4All 2025</Note>
    </>
  );
};

export const Why: React.FC = () => (
  <Stage ground="ink">
    <Beats
      beats={[
        { at: 0, node: <First /> },
        { at: 250, node: <Second /> },
      ]}
    />
  </Stage>
);
