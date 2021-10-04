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

/**
 * Key Event Reference
 * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
 *
 * List of available key values
 * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
 */

export const KEYS = {
  Meta: 'Meta',
  Alt: 'Alt',
  Shift: 'Shift',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  ArrowUp: 'ArrowUp',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Enter: 'Enter',
  Equals: '=',
  Escape: 'Escape',
  Minus: '-',
  Plus: '+',
  Space: ' ',
  Tab: 'Tab',
  Colon: ':',
  SemiColon: ';',
  At: '@',
} as const;

export const MouseButton = {
  Left: 0,
  Middle: 1,
  Right: 2,
} as const;

export const Modifier = {
  Ctrl: 'control',
  Shift: 'shift',
  Alt: 'alt',
} as const;

const MacShort = {
  Alt: '⌥',
  Ctrl: '⌘',
  Delete: '⌫',
  Shift: '⇧',
  Enter: '↵',
} as const;

const WinLinShort = {
  Alt: 'Alt',
  Ctrl: 'Ctrl',
  Delete: 'Del',
  Shift: 'Shift',
  Enter: '↵',
} as const;

const ArrowsKey = {
  ArrowRight: '→',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
} as const;

const KEY_SPLIT = ' ';

/* Check if the OS is Mac */
// Check existence of window first because we may use this module during
// testing in node
export const isMacOS = !!window && window.navigator.platform.includes('Mac');

/**
 * Takes a shortcut command and converts into
 * platform specific shorthand
 * @param value shortcut key
 */
export const parseShortcut = (value: string | string[]): string => {
  const val = Array.isArray(value) ? value[0] : value;
  const config = isMacOS ? MacShort : WinLinShort;
  return val
    .split(KEY_SPLIT)
    .map((item) => {
      // prettier-ignore
      switch (item) {
        case Modifier.Shift: return config.Shift;
        case Modifier.Alt: return config.Alt;
        case Modifier.Ctrl: return config.Ctrl;
        case KEYS.Delete: return config.Delete;
        case KEYS.Enter: return config.Enter;
        case KEYS.ArrowDown: return ArrowsKey.ArrowDown;
        case KEYS.ArrowRight: return ArrowsKey.ArrowRight;
        case KEYS.ArrowLeft: return ArrowsKey.ArrowLeft;
        case KEYS.ArrowUp: return ArrowsKey.ArrowUp;
        default: return item.toUpperCase();
      }
    })
    .join(KEY_SPLIT);
};

/**
 * Checks to see if a key matches a shortcut
 * @param key KeyboardEvent key
 * @param args list of shortcuts
 */
export const keyCheck = (key: string | undefined, ...args: string[]): boolean => {
  if (key === undefined) return false;
  return args.includes(key) || args.includes(key.toLowerCase());
};

/** Cross-platform check for control/command key pressed during even. */
export const isControlKeyPressed = ({ metaKey, ctrlKey }: MouseEvent | KeyboardEvent): boolean => {
  return isMacOS ? metaKey : ctrlKey;
};

/**
 * Similar to keyCheck but checks for shift and metakey
 * @param e Keyboard Event
 * @param args List of shortcuts
 */
export const keyEventCheck = (e: KeyboardEvent, ...args: string[]): boolean => {
  const { key, shiftKey } = e;

  // Use ⌘ on macOS and Ctrl on Windows & Linux
  const controlKey = isControlKeyPressed(e);

  for (const arg of args) {
    const keys = arg.split(KEY_SPLIT);
    const hasShift = keys.indexOf(Modifier.Shift) !== -1;
    const hasCtrl = keys.indexOf(Modifier.Ctrl) !== -1;

    if (hasShift !== shiftKey) continue;
    if (hasCtrl !== controlKey) continue;

    const lastKey = keys[keys.length - 1];
    if (keyCheck(key, lastKey)) {
      return true;
    }
  }

  return false;
};

export const keyIsArrowKey = (key: string): boolean => {
  return (
    key === KEYS.ArrowUp ||
    key === KEYS.ArrowDown ||
    key === KEYS.ArrowLeft ||
    key === KEYS.ArrowRight
  );
};

/** Is Shift, Control, or Alt. */
export const keyIsModifier = (key: string): boolean => {
  return key in Modifier;
};
