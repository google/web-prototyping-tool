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

export default `
.token.punctuation {
  color: var(--pnct);
}

.token.operator {
  color: var(--red);
}

.token.string {
  color: var(--green);
}

.token.comment {
  color: var(--gray);
}

.token:is(.function, .keyword, .boolean, .number, .selector, .property, .tag, .attr-value) {
  color: var(--cd-primary-color);
}

.container {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--cd-border-radius-2);
  overflow: hidden;
  color: var(--text);
}
pre{
  font-size: var(--fontsize);
  line-height: 18px;
  
}
pre,code{
  padding:0; margin:0;
  font-family: var(--cd-mono-font);
}
`;
