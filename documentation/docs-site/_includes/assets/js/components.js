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

const video_sheet = new CSSStyleSheet();
const video_styles = `
      :host{
        box-shadow: 0 0 0 1px #e6e6e6;
        border-radius: 0.375rem;
        display:flex;
        overflow: hidden;
        margin-top: 1.7777778em;
        margin-bottom: 1.7777778em;
      }
      video{
        max-width:100%;
        object-fit: contain;
      }
    `;
video_sheet.replace(video_styles);
class VideoPlayer extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });

    shadow.adoptedStyleSheets = [video_sheet];
    const video = document.createElement('video');
    video.loop = true;
    video.autoplay = true;
    video.muted = true;
    // const controls = document.createElement('div');

    shadow.appendChild(video);
    this._video = video;
  }

  static get observedAttributes() {
    return ['src', 'controls'];
  }

  /** Added to page */
  connectedCallback() {}

  disconnectedCallback() {}

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'src' && oldValue !== newValue) {
      this._video.src = newValue;
    }
  }
}

customElements.define('video-player', VideoPlayer);

class SpecLink extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    const sheet = new CSSStyleSheet();
    const styles = `
      a, a:visited{
        color: #7c828b;
        text-decoration: none;
        font-weight: 500;
        font-size: 0.9em;
        white-space: nowrap;
        margin-top: 1.66667em;
        margin-bottom: 0.666667em;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding-top: 4px;
      }
      
      a:hover{
        color: #1D4ED8;
      }

      :host { 
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
      }

      i {
        font-family: 'Google Material Icons';
        font-weight: normal;
        font-style: normal;
        font-size:18px;
        line-height: 1;
        direction: ltr;
        -webkit-font-smoothing: antialiased;
        letter-spacing: normal;
        text-transform: none;
        display: inline-block;
        white-space: nowrap;
        word-wrap: normal;
      }
    `;
    sheet.replace(styles);
    shadow.className = 'host';
    shadow.adoptedStyleSheets = [sheet];
    const link = document.createElement('a');
    const slot = document.createElement('slot');
    link.innerHTML = '<i>link</i> Spec';
    this.link = link;
    shadow.appendChild(slot);
    shadow.appendChild(link);
  }

  static get observedAttributes() {
    return ['src'];
  }

  /** Added to page */
  connectedCallback() {}

  disconnectedCallback() {}

  attributeChangedCallback(name, oldValue, newValue) {
  }
}

customElements.define('spec-link', SpecLink);
