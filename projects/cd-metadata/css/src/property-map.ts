/*
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-disable max-lines */

export default {
  'align-content': ['center', 'flex-end', 'flex-start', 'space-around', 'space-between', 'stretch'],
  'align-items': ['baseline', 'center', 'start', 'end', 'flex-end', 'flex-start', 'stretch'],
  'align-self': ['auto', 'start', 'center', 'end', 'baseline', 'flex-end', 'flex-start', 'stretch'],
  all: [],
  animation: [],
  'animation-delay': [],
  'animation-direction': ['alternate', 'alternate-reverse', 'normal', 'reverse'],
  'animation-duration': [],
  'animation-fill-mode': ['backwards', 'both', 'forwards', 'none'],
  'animation-iteration-count': ['infinite'],
  'animation-name': ['none'],
  'animation-play-state': ['paused', 'running'],
  'animation-timing-function': [
    'cubic-bezier()',
    'ease',
    'ease-in',
    'ease-in-out',
    'ease-out',
    'linear',
    'step-end',
    'step-start',
    'steps()',
  ],
  'backface-visibility': ['hidden', 'visible'],
  background: [],
  'background-attachment': ['fixed', 'local', 'scroll', 'inherit'],
  'background-blend-mode': [
    'color',
    'color-burn',
    'color-dodge',
    'darken',
    'difference',
    'exclusion',
    'hard-light',
    'hue',
    'lighten',
    'luminosity',
    'multiply',
    'normal',
    'overlay',
    'saturation',
    'screen',
    'soft-light',
  ],
  'background-clip': ['border-box', 'content-box', 'padding-box', 'inherit'],
  'background-color': ['inherit'],
  'background-image': [
    'image()',
    'linear-gradient()',
    'radial-gradient()',
    'repeating-linear-gradient()',
    'repeating-radial-gradient()',
    'url()',
  ],
  'background-origin': ['border-box', 'content-box', 'padding-box', 'inherit'],
  'background-position': ['left', 'center', 'right', 'bottom', 'top'],
  'background-repeat': ['no-repeat', 'repeat', 'repeat-x', 'repeat-y', 'round', 'space'],
  'background-size': ['auto', 'contain', 'cover'],
  border: [],
  'border-collapse': ['collapse', 'separate', 'inherit'],
  'border-color': ['inherit'],
  'border-spacing': ['inherit'],
  'border-style': [
    'dashed',
    'dotted',
    'double',
    'groove',
    'hidden',
    'inset',
    'none',
    'outset',
    'ridge',
    'solid',
    'inherit',
  ],
  'border-bottom': [],
  'border-bottom-color': ['inherit'],

  'border-bottom-left-radius': [],
  'border-bottom-right-radius': [],
  'border-bottom-style': [
    'dashed',
    'dotted',
    'double',
    'groove',
    'hidden',
    'inset',
    'none',
    'outset',
    'ridge',
    'solid',
    'inherit',
  ],
  'border-bottom-width': ['medium', 'thin', 'thick', 'inherit'],
  'border-image': ['url()'],
  'border-image-outset': [],
  'border-image-slice': [],
  'border-image-source': [],
  'border-image-repeat': ['repeat', 'round', 'space', 'stretch'],
  'border-image-width': ['auto'],
  'border-left': [],
  'border-left-color': ['inherit'],

  'border-left-style': [
    'dashed',
    'dotted',
    'double',
    'groove',
    'hidden',
    'inset',
    'none',
    'outset',
    'ridge',
    'solid',
    'inherit',
  ],
  'border-left-width': ['medium', 'thin', 'thick', 'inherit'],
  'border-radius': [],
  'border-right': [],
  'border-right-color': ['inherit'],

  'border-right-style': [
    'dashed',
    'dotted',
    'double',
    'groove',
    'hidden',
    'inset',
    'none',
    'outset',
    'ridge',
    'solid',
    'inherit',
  ],
  'border-right-width': ['medium', 'thin', 'thick', 'inherit'],
  'border-top': [],
  'border-top-color': ['inherit'],

  'border-top-left-radius': [],
  'border-top-right-radius': [],
  'border-top-style': [
    'dashed',
    'dotted',
    'double',
    'groove',
    'hidden',
    'inset',
    'none',
    'outset',
    'ridge',
    'solid',
    'inherit',
  ],
  'border-top-width': ['medium', 'thin', 'thick', 'inherit'],
  'border-width': ['medium', 'thin', 'thick', 'inherit'],
  'box-decoration-break': ['clone', 'slice'],
  'box-shadow': [],
  'box-sizing': ['border-box', 'content-box', 'inherit'],
  bottom: ['auto', 'inherit'],
  'break-after': [
    'always',
    'auto',
    'avoid',
    'avoid-column',
    'avoid-page',
    'avoid-region',
    'column',
    'left',
    'page',
    'region',
    'right',
  ],
  'break-before': [
    'always',
    'auto',
    'avoid',
    'avoid-column',
    'avoid-page',
    'avoid-region',
    'column',
    'left',
    'page',
    'region',
    'right',
  ],
  'break-inside': ['auto', 'avoid', 'avoid-column', 'avoid-page', 'avoid-region'],
  'caption-side': ['bottom', 'top', 'inherit'],
  'caret-color': ['auto'],

  clear: ['both', 'left', 'none', 'right', 'inherit'],
  clip: ['auto', 'inherit'],
  color: ['inherit'],

  columns: [],
  'column-count': [],
  'column-fill': ['auto', 'balance'],
  'column-gap': ['normal'],
  'column-rule': [],
  'column-rule-color': [],

  'column-rule-style': [
    'dashed',
    'dotted',
    'double',
    'groove',
    'hidden',
    'inset',
    'none',
    'outset',
    'ridge',
    'solid',
    'inherit',
  ],
  'column-rule-width': ['medium', 'thin', 'thick', 'inherit'],
  'column-span': ['all', 'none'],
  'column-width': ['auto', 'inherit'],
  content: [
    'attr()',
    'close-quote',
    'no-close-quote',
    'no-open-quote',
    'normal',
    'none',
    'open-quote',
    'inherit',
  ],
  'counter-increment': ['none', 'inherit'],
  'counter-reset': ['none', 'inherit'],
  cursor: [
    'copy',
    'crosshair',
    'default',
    'grab',
    'grabbing',
    'pointer',
    'move',
    'vertical-text',
    'cell',
    'context-menu',
    'alias',
    'progress',
    'no-drop',
    'not-allowed',
    'e-resize',
    'ne-resize',
    'nw-resize',
    'n-resize',
    'se-resize',
    'sw-resize',
    's-resize',
    'w-resize',
    'ew-resize',
    'ns-resize',
    'nesw-resize',
    'nwse-resize',
    'col-resize',
    'row-resize',
    'text',
    'wait',
    'help',
    'all-scroll',
    'zoom-in',
    'zoom-out',
  ],
  direction: ['ltr', 'rtl', 'inherit'],
  display: [
    'block',
    'contents',
    'flex',
    'flow-root',
    'grid',
    'inline',
    'inline-block',
    'inline-flex',
    'inline-grid',
    'inline-table',
    'list-item',
    'none',
    'run-in',
    'subgrid',
    'table',
    'table-caption',
    'table-cell',
    'table-column',
    'table-column-group',
    'table-footer-group',
    'table-header-group',
    'table-row',
    'table-row-group',
    'inherit',
  ],
  'empty-cells': ['hide', 'show', 'inherit'],
  filter: [
    'blur()',
    'brightness()',
    'contrast()',
    'custom()',
    'drop-shadow()',
    'grayscale()',
    'hue-rotate()',
    'invert()',
    'none',
    'opacity()',
    'sepia()',
    'saturate()',
    'url()',
  ],
  flex: ['auto', 'initial', 'none'],
  'flex-basis': ['auto'],
  'flex-direction': ['column', 'column-reverse', 'row', 'row-reverse'],
  'flex-flow': ['column', 'column-reverse', 'nowrap', 'row', 'row-reverse', 'wrap', 'wrap-reverse'],
  'flex-grow': [],
  'flex-shrink': [],
  'flex-wrap': ['nowrap', 'wrap', 'wrap-reverse'],
  float: ['left', 'right', 'none', 'inherit'],
  'flow-into': ['none'],

  'flow-from': ['none', 'inherit'],

  font: [],
  'font-display': ['auto', 'block', 'swap', 'fallback', 'optional'],
  'font-family': ['cursive', 'fantasy', 'inherit', 'monospace', 'sans-serif', 'serif'],
  'font-feature-settings': ['normal'],
  'font-kerning': ['auto', 'none', 'normal'],
  'font-language-override': ['normal'],
  'font-size': [],
  'font-size-adjust': ['auto', 'none'],
  'font-stretch': [
    'condensed',
    'expanded',
    'extra-condensed',
    'extra-expanded',
    'normal',
    'semi-condensed',
    'semi-expanded',
    'ultra-condensed',
    'ultra-expanded',
  ],
  'font-style': ['italic', 'normal', 'oblique'],
  'font-synthesis': ['none', 'style', 'weight'],
  'font-variant': ['normal', 'small-caps', 'inherit'],
  'font-variant-alternates': ['normal'],
  'font-variant-caps': [
    'normal',
    'small-caps',
    'all-small-caps',
    'petite-caps',
    'all-petite-caps',
    'unicase',
    'titling-caps',
  ],
  'font-variant-east-asian': ['normal'],
  'font-variant-ligatures': ['normal', 'none'],
  'font-variant-numeric': ['normal'],
  'font-variant-position': ['normal', 'sub', 'super'],
  'font-weight': [
    'bold',
    'bolder',
    'lighter',
    'normal',
    '100',
    '200',
    '300',
    '400',
    '500',
    '600',
    '700',
    '800',
    '900',
    'inherit',
  ],
  grid: [],
  'grid-area': [],
  'grid-auto-columns': [],
  'grid-auto-flow': ['row', 'column', 'dense'],
  'grid-auto-rows': [],
  'grid-column': ['auto'],
  'grid-column-end': [],
  'grid-column-gap': [],
  'grid-column-start': [],
  gap: [],
  'grid-row': ['auto'],
  'grid-row-end': [],
  'grid-row-start': [],
  'grid-row-gap': [],
  'grid-template': ['none'],
  'grid-template-areas': [],
  'grid-template-columns': ['auto'],
  'grid-template-rows': ['auto'],
  'hanging-punctuation': ['allow-end', 'first', 'force-end', 'last', 'none'],
  height: ['auto', 'inherit'],
  hyphens: ['auto', 'manual', 'none'],
  'image-orientation': [],
  'image-resolution': ['from-image', 'snap'],
  isolation: ['auto', 'isolate'],
  'justify-content': [
    'start',
    'center',
    'end',
    'flex-end',
    'flex-start',
    'space-around',
    'space-between',
  ],
  left: ['auto', 'inherit'],
  'letter-spacing': ['normal', 'inherit'],
  'line-height': ['normal', 'inherit'],
  'list-style': [
    'none',
    'inherit',
    'initial',
    'unset',
    'url()',
    'armenian',
    'circle',
    'decimal',
    'decimal-leading-zero',
    'disc',
    'georgian',
    'inside',
    'lower-alpha',
    'lower-greek',
    'lower-latin',
    'lower-roman',
    'outside',
    'square',
    'upper-alpha',
    'upper-latin',
    'upper-roman',
  ],
  'list-style-image': ['none', 'url()', 'inherit'],
  'list-style-position': ['inside', 'outside', 'inherit'],
  'list-style-type': [
    'armenian',
    'circle',
    'decimal',
    'decimal-leading-zero',
    'disc',
    'georgian',
    'lower-alpha',
    'lower-greek',
    'lower-latin',
    'lower-roman',
    'none',
    'square',
    'upper-alpha',
    'upper-latin',
    'upper-roman',
    'inherit',
  ],
  margin: ['auto', 'inherit'],
  'margin-bottom': ['auto', 'inherit'],
  'margin-left': ['auto', 'inherit'],
  'margin-right': ['auto', 'inherit'],
  'margin-top': ['auto', 'inherit'],
  'max-height': ['none', 'inherit'],
  'max-width': ['none', 'inherit'],
  'min-height': ['inherit'],
  'min-width': ['inherit'],
  'mix-blend-mode': [
    'color',
    'color-burn',
    'color-dodge',
    'darken',
    'difference',
    'exclusion',
    'hard-light',
    'hue',
    'lighten',
    'luminosity',
    'multiply',
    'normal',
    'overlay',
    'saturation',
    'screen',
    'soft-light',
  ],
  'object-fit': ['contain', 'cover', 'fill', 'none', 'scale-down'],
  'object-position': ['left', 'center', 'right', 'bottom', 'top'],
  opacity: ['inherit'],
  order: [],
  orphans: ['inherit'],
  outline: ['inherit'],
  'outline-color': ['invert', 'inherit'],

  'outline-offset': ['inherit'],
  'outline-style': [
    'dashed',
    'dotted',
    'double',
    'groove',
    'hidden',
    'inset',
    'none',
    'outset',
    'ridge',
    'solid',
    'inherit',
  ],
  'outline-width': ['medium', 'thin', 'thick', 'inherit'],
  overflow: ['auto', 'hidden', 'scroll', 'visible', 'inherit'],
  'overflow-x': ['auto', 'hidden', 'scroll', 'visible', 'inherit'],
  'overflow-y': ['auto', 'hidden', 'scroll', 'visible', 'inherit'],
  padding: ['inherit'],
  'padding-bottom': [],
  'padding-left': [],
  'padding-right': [],
  'padding-top': [],
  'page-break-after': ['always', 'auto', 'avoid', 'left', 'right', 'inherit'],
  'page-break-before': ['always', 'auto', 'avoid', 'left', 'right', 'inherit'],
  'page-break-inside': ['auto', 'avoid', 'inherit'],
  perspective: ['none'],
  'perspective-origin': ['bottom', 'center', 'left', 'right', 'top'],
  'pointer-events': [
    'all',
    'auto',
    'fill',
    'inherit',
    'none',
    'painted',
    'stroke',
    'visible',
    'visibleFill',
    'visiblePainted',
    'visibleStroke',
  ],
  position: ['absolute', 'fixed', 'relative', 'static', 'sticky', 'inherit'],
  quotes: ['none', 'inherit'],
  'region-break-after': [
    'always',
    'auto',
    'avoid',
    'avoid-column',
    'avoid-page',
    'avoid-region',
    'column',
    'left',
    'page',
    'region',
    'right',
  ],
  'region-break-before': [
    'always',
    'auto',
    'avoid',
    'avoid-column',
    'avoid-page',
    'avoid-region',
    'column',
    'left',
    'page',
    'region',
    'right',
  ],
  'region-break-inside': ['auto', 'avoid', 'avoid-column', 'avoid-page', 'avoid-region'],
  'region-fragment': ['auto', 'break'],
  resize: ['both', 'horizontal', 'none', 'vertical', 'inherit'],
  right: ['auto', 'inherit'],
  'scroll-behavior': ['auto', 'smooth'],
  src: ['url()'],
  'shape-image-threshold': [],
  'shape-inside': [
    'auto',
    'circle()',
    'ellipse()',
    'inherit',
    'outside-shape',
    'polygon()',
    'rectangle()',
  ],
  'shape-margin': [],
  'shape-outside': [
    'none',
    'inherit',
    'circle()',
    'ellipse()',
    'polygon()',
    'inset()',
    'margin-box',
    'border-box',
    'padding-box',
    'content-box',
    'url()',
    'image()',
    'linear-gradient()',
    'radial-gradient()',
    'repeating-linear-gradient()',
    'repeating-radial-gradient()',
  ],
  'tab-size': [],
  'table-layout': ['auto', 'fixed', 'inherit'],
  'text-align': [
    'start',
    'end',
    'center',
    'left',
    'justify',
    'right',
    'match-parent',
    'justify-all',
    'inherit',
  ],
  'text-align-last': ['center', 'left', 'justify', 'right', 'inherit'],
  'text-decoration': ['line-through', 'none', 'overline', 'underline', 'inherit'],
  'text-decoration-color': [],

  'text-decoration-line': ['line-through', 'none', 'overline', 'underline'],
  'text-decoration-skip': ['edges', 'ink', 'none', 'objects', 'spaces'],
  'text-decoration-style': ['dashed', 'dotted', 'double', 'solid', 'wavy'],
  'text-emphasis': [],
  'text-emphasis-color': [],

  'text-emphasis-position': ['above', 'below', 'left', 'right'],
  'text-emphasis-style': [
    'circle',
    'dot',
    'double-circle',
    'filled',
    'none',
    'open',
    'sesame',
    'triangle',
  ],
  'text-indent': ['inherit'],
  'text-justify': ['auto', 'none', 'inter-word', 'inter-character', 'inherit'],
  'text-overflow': ['clip', 'ellipsis', 'inherit'],
  'text-shadow': [],
  'text-rendering': ['auto', 'geometricPrecision', 'optimizeLegibility', 'optimizeSpeed'],
  'text-transform': ['capitalize', 'full-width', 'lowercase', 'none', 'uppercase', 'inherit'],
  'text-underline-position': ['alphabetic', 'auto', 'below', 'left', 'right'],
  top: ['auto', 'inherit'],
  transform: [
    'matrix()',
    'matrix3d()',
    'none',
    'perspective()',
    'rotate()',
    'rotate3d()',
    'rotateX()',
    'rotateY()',
    'rotateZ()',
    'scale()',
    'scale3d()',
    'scaleX()',
    'scaleY()',
    'scaleZ()',
    'skewX()',
    'skewY()',
    'translate()',
    'translate3d()',
    'translateX()',
    'translateY()',
    'translateZ()',
  ],
  'transform-origin': ['bottom', 'center', 'left', 'right', 'top'],
  'transform-style': ['flat', 'preserve-3d'],
  transition: [],
  'transition-delay': [],
  'transition-duration': [],
  'transition-property': ['all', 'none'],
  'transition-timing-function': [
    'cubic-bezier()',
    'ease',
    'ease-in',
    'ease-in-out',
    'ease-out',
    'linear',
    'step-end',
    'step-start',
    'steps()',
  ],
  'unicode-bidi': ['bidi-override', 'embed', 'normal', 'inherit'],
  'unicode-range': [],
  'user-select': ['all', 'auto', 'contain', 'none', 'text'],
  'vertical-align': [
    'baseline',
    'bottom',
    'middle',
    'sub',
    'super',
    'text-bottom',
    'text-top',
    'top',
    'inherit',
  ],
  visibility: ['collapse', 'hidden', 'visible', 'inherit'],
  'white-space': ['normal', 'nowrap', 'pre', 'pre-line', 'pre-wrap', 'inherit'],
  widows: ['inherit'],
  width: ['auto', 'inherit'],
  'will-change': [
    'auto',
    'contents',
    'opacity',
    'scroll-position',
    'transform',
    'inherit',
    'initial',
    'unset',
  ],
  'word-break': ['normal', 'break-all', 'keep-all'],
  'word-spacing': ['normal', 'inherit'],
  'word-wrap': ['break-word', 'normal'],
  'z-index': ['auto', 'inherit'],
};