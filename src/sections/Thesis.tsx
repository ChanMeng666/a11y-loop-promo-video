import React from "react";

import { COLORS, TYPE, displayFamily } from "../constants";
import { Gap, Note, Stage } from "../components/Stage";
import { Terminal, CliCapture } from "../components/Terminal";
import contrastSelf from "../data/cli-contrast-self.json";

/**
 * Scene 3 — the thesis. 0:31–0:42.
 *
 * The wordmark, and the film checking its own accent colour with the tool it
 * is about. That is the whole beat.
 *
 * There is no logo. The project's drawn mark carried no meaning and the film
 * is stronger without it; the focus ring used everywhere else does the work a
 * logo would have done badly.
 *
 * The three thesis clauses used to be set here as well — but the narration
 * says them and the captions print them, so a third copy on screen was pure
 * duplication.
 */
export const Thesis: React.FC = () => (
  <Stage>
    <div
      style={{
        fontFamily: displayFamily,
        fontSize: 128,
        fontWeight: 700,
        letterSpacing: "-0.04em",
        color: COLORS.ink,
        lineHeight: 1,
      }}
    >
      a11y-loop
    </div>

    <Gap />

    <div style={{ width: 1180, height: 268 }}>
      <Terminal
        capture={contrastSelf as CliCapture}
        startFrame={34}
        typeCps={30}
        linesPerSecond={7}
        fontSize={TYPE.mono}
        showExit={false}
        lineRange={[0, 4]}
      />
    </div>

    <Gap size="s" />
    <Note>The colours in this video, checked with the tool in this video.</Note>
  </Stage>
);
