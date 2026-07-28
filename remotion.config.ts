/**
 * Remotion configuration.
 *
 * Note: when using the Node.js APIs, this file does not apply — pass options
 * directly to the APIs instead.
 *
 * All options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

// The palette is light and type-heavy, so PNG frames avoid JPEG ringing around
// small text and code. Slower to render, materially crisper.
Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer("angle");
