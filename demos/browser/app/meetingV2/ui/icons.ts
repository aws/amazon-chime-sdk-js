// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Icons are inlined at build time from lucide-static (ISC) via Vite `?raw` imports, so the
// single-file bundle stays self-contained and no icon sprite has to be served separately.
import activity from 'lucide-static/icons/activity.svg?raw';
import audioLines from 'lucide-static/icons/audio-lines.svg?raw';
import captions from 'lucide-static/icons/captions.svg?raw';
import captionsOff from 'lucide-static/icons/captions-off.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';
import chevronLeft from 'lucide-static/icons/chevron-left.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import circleDot from 'lucide-static/icons/circle-dot.svg?raw';
import clapperboard from 'lucide-static/icons/clapperboard.svg?raw';
import code from 'lucide-static/icons/code.svg?raw';
import copy from 'lucide-static/icons/copy.svg?raw';
import crown from 'lucide-static/icons/crown.svg?raw';
import ellipsis from 'lucide-static/icons/ellipsis.svg?raw';
import ellipsisVertical from 'lucide-static/icons/ellipsis-vertical.svg?raw';
import eye from 'lucide-static/icons/eye.svg?raw';
import eyeOff from 'lucide-static/icons/eye-off.svg?raw';
import fileVideo from 'lucide-static/icons/file-video.svg?raw';
import flipHorizontal from 'lucide-static/icons/flip-horizontal.svg?raw';
import focus from 'lucide-static/icons/focus.svg?raw';
import globe from 'lucide-static/icons/globe.svg?raw';
import hand from 'lucide-static/icons/hand.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import layoutGrid from 'lucide-static/icons/layout-grid.svg?raw';
import layoutPanelTop from 'lucide-static/icons/layout-panel-top.svg?raw';
import logOut from 'lucide-static/icons/log-out.svg?raw';
import messageSquare from 'lucide-static/icons/message-square.svg?raw';
import mic from 'lucide-static/icons/mic.svg?raw';
import micOff from 'lucide-static/icons/mic-off.svg?raw';
import pause from 'lucide-static/icons/pause.svg?raw';
import phoneOff from 'lucide-static/icons/phone-off.svg?raw';
import pin from 'lucide-static/icons/pin.svg?raw';
import pinOff from 'lucide-static/icons/pin-off.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import radio from 'lucide-static/icons/radio.svg?raw';
import screenShare from 'lucide-static/icons/screen-share.svg?raw';
import screenShareOff from 'lucide-static/icons/screen-share-off.svg?raw';
import send from 'lucide-static/icons/send.svg?raw';
import settings from 'lucide-static/icons/settings.svg?raw';
import slidersHorizontal from 'lucide-static/icons/sliders-horizontal.svg?raw';
import smile from 'lucide-static/icons/smile.svg?raw';
import sparkles from 'lucide-static/icons/sparkles.svg?raw';
import userCog from 'lucide-static/icons/user-cog.svg?raw';
import users from 'lucide-static/icons/users.svg?raw';
import video from 'lucide-static/icons/video.svg?raw';
import videoOff from 'lucide-static/icons/video-off.svg?raw';
import volume2 from 'lucide-static/icons/volume-2.svg?raw';
import volumeX from 'lucide-static/icons/volume-x.svg?raw';
import wifiLow from 'lucide-static/icons/wifi-low.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';

const ICONS = {
  activity,
  audioLines,
  captions,
  captionsOff,
  check,
  chevronDown,
  chevronLeft,
  chevronRight,
  circleDot,
  clapperboard,
  code,
  copy,
  crown,
  ellipsis,
  ellipsisVertical,
  eye,
  eyeOff,
  fileVideo,
  flipHorizontal,
  focus,
  globe,
  hand,
  info,
  layoutGrid,
  layoutPanelTop,
  logOut,
  messageSquare,
  mic,
  micOff,
  pause,
  phoneOff,
  pin,
  pinOff,
  play,
  radio,
  screenShare,
  screenShareOff,
  send,
  settings,
  slidersHorizontal,
  smile,
  sparkles,
  userCog,
  users,
  video,
  videoOff,
  volume2,
  volumeX,
  wifiLow,
  wifiOff,
  x,
};

export type IconName = keyof typeof ICONS;

/** Returns the SVG markup for an icon, stripped of the license comment, marked decorative. */
function iconSvg(name: IconName): string {
  return ICONS[name]
    .replace(/<!--[\s\S]*?-->/, '')
    .replace('<svg', '<svg aria-hidden="true" focusable="false"')
    .trim();
}

export function iconElement(name: IconName): SVGElement {
  const template = document.createElement('template');
  template.innerHTML = iconSvg(name);
  return template.content.firstElementChild as SVGElement;
}

/** Replace the icon inside a button, keeping any label text. */
export function setButtonIcon(button: HTMLElement, name: IconName): void {
  const existing = button.querySelector('svg');
  const next = iconElement(name);
  if (existing) {
    existing.replaceWith(next);
  } else {
    button.prepend(next);
  }
}

/** Fill every `<span data-icon="name">` placeholder in the subtree with its SVG. */
export function hydrateIcons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-icon]').forEach(placeholder => {
    const name = placeholder.dataset.icon as IconName;
    if (name in ICONS) {
      placeholder.replaceChildren(iconElement(name));
    }
  });
}
