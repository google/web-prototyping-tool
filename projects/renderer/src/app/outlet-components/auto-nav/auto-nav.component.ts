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

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  EventEmitter,
  Output,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import * as cd from 'cd-interfaces';

// V2 will support all NavItem types
type AutoNavItem = cd.IAutoNavItemUrl | cd.IAutoNavItemBoard;

@Component({
  selector: 'cdr-auto-nav',
  templateUrl: './auto-nav.component.html',
  styleUrls: ['./auto-nav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoNavComponent {
  public NavigationLinkType = cd.AutoNavLinkType;

  @Input() smallIcons = false;
  @Input() items: AutoNavItem[] = [];
  @Input() selectedIndex = -1;
  @Input() target?: string;

  @Output() selectNavItem = new EventEmitter<AutoNavItem>();
  @Output() selectedIndexChange = new EventEmitter<number>();

  @ViewChildren('btnRef') btns?: QueryList<ElementRef>;

  isNavItem(item: cd.IAutoNavItem): item is AutoNavItem {
    return item.type === cd.AutoNavItemType.Navigation;
  }

  get isAttachedToAPortal() {
    return this.target !== undefined;
  }

  canUpdateIndex(item: cd.IAutoNavItem) {
    const hasBoardRef = (item as cd.IAutoNavItemBoard).referenceId !== undefined;
    return this.isAttachedToAPortal && hasBoardRef;
  }

  onItemClick(item: cd.IAutoNavItem, idx: number) {
    if (!this.isNavItem(item)) return;

    if (this.canUpdateIndex(item)) {
      this.selectedIndexChange.emit(idx);
    }

    this.btns?.toArray()[idx]?.nativeElement.blur();

    this.selectNavItem.emit(item);
  }
}
