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

// prettier-ignore
import { Component, ChangeDetectionStrategy, Output, Input, EventEmitter, OnChanges, SimpleChanges, OnDestroy, ChangeDetectorRef, ViewChild, OnInit } from '@angular/core';
import { InteractionService } from 'src/app/routes/project/services/interaction/interaction.service';
import { FormatDataService } from 'src/app/services/formatting/formatting.service';
import { removeValueFromArrayAtIndex } from 'cd-utils/array';
import { TitleForActionPipe } from '../actions.pipe';
import { deepCopy } from 'cd-utils/object';
import { ReplaySubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { isNumber } from 'cd-utils/numeric';
import { LayoutAlignment, sizeMenuConfig } from 'cd-common/consts';
import { convertFromLayoutAlignment } from '../position.utils';
import { overlaySizeFromAction } from 'cd-common/utils';
import {
  AbstractOverlayControllerDirective,
  OverlayService,
  ConfirmationDialogComponent,
  ExpandedCodeEditorDirective,
} from 'cd-common';
import * as utils from '../action-panel.utils';
import * as config from '../action-panel.config';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-actions-card',
  templateUrl: './actions-card.component.html',
  styleUrls: ['./actions-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionsCardComponent
  extends AbstractOverlayControllerDirective
  implements OnChanges, OnDestroy, OnInit
{
  private _destroyed = new ReplaySubject<void>(1);
  private _codeIsValid = true; // used by runJS and postmessage in the future
  public readonly config = config;
  public readonly MAX_BOARD_SIZE = 8000;
  public readonly MAX_BORDER_RADIUS = 50;
  public readonly MAX_DELAY = 2000;
  public readonly MAX_PADDING = 200;
  public readonly MAX_DURATION = 8000;
  public readonly DrawerMode = cd.ActionDrawerMode;
  public readonly DrawerPosition = cd.ActionDrawerPosition;
  public readonly OverlayPosition = cd.ActionOverlayPosition;
  public readonly ActionResetMode = cd.ActionResetMode;
  public readonly ActionScrollMode = cd.ActionScrollMode;
  public readonly sizeMenuConfig = sizeMenuConfig;
  public boardMenu: cd.ISelectItem[] = [];
  public ActionType = cd.ActionType;
  public OutputPropertyType = cd.OutputPropertyType;
  public showTimeline = false;

  @Input() availablePortals: string[] = [];
  @Input() boards: cd.IBoardProperties[] = [];
  @Input() colorMenuData: ReadonlyArray<cd.ISelectItem> = [];
  @Input() currentRootId = '';
  @Input() designSystem?: cd.IDesignSystem;
  @Input() inputs: cd.IStringMap<any> = {};
  @Input() isRecording = false;
  @Input() model!: cd.ActionBehavior;
  @Input() outputsConfig: ReadonlyArray<cd.IOutputProperty> = [];
  @Input() portals: cd.ISelectItem[] = [];
  @Input() symbolChildren: cd.ISelectItem[] = [];

  @Output() modelChange = new EventEmitter<cd.ActionBehavior>();
  @Output() record = new EventEmitter<boolean>();
  @Output() remove = new EventEmitter<void>();
  @Output() storeAction = new EventEmitter<cd.ISelectItem>();
  @Output() copyAction = new EventEmitter<cd.ActionBehavior>();

  @ViewChild(ExpandedCodeEditorDirective, { read: ExpandedCodeEditorDirective })
  expandArea?: ExpandedCodeEditorDirective;

  constructor(
    private _formatterService: FormatDataService,
    private _cdRef: ChangeDetectorRef,
    private _interactionService: InteractionService,
    public overlayService: OverlayService
  ) {
    super(overlayService);
  }

  get isTriggerHover() {
    return this.model.trigger === cd.EventTrigger.Hover;
  }

  get isTriggerClick() {
    return this.model.trigger === cd.EventTrigger.Click;
  }

  ngOnInit(): void {
    if (this.model.type === cd.ActionType.RunJS) {
      this.onValidateJS(this.runJSScriptValue || '');
      this._cdRef.markForCheck();
    }

    if (this.model.type === cd.ActionType.PostMessage) {
      this.onValidateJSON(this.model?.target || '');
      this._cdRef.markForCheck();
    }
  }

  get isCodeEditorExpanded() {
    return !!this.expandArea?.expanded;
  }

  onExpandedCodeEditorClose() {
    this._cdRef.markForCheck();
  }

  expandTextArea() {
    const title = new TitleForActionPipe().transform(this.model.type, config.INTERACTION_TYPE_MENU);
    this.expandArea?.createExpandedTextArea(title);
  }

  set codeIsValid(valid: boolean) {
    if (this._codeIsValid === valid) return;
    this._codeIsValid = valid;
    this._cdRef.markForCheck();
  }
  get codeIsValid() {
    return this._codeIsValid;
  }

  ngOnDestroy(): void {
    this._destroyed.next();
    this._destroyed.complete();
    super.ngOnDestroy();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.boards || changes.currentRootId) {
      this.updateBoardMenu();
    }
  }

  onToggleTimeline() {
    this.showTimeline = !this.showTimeline;
  }

  updateBoardMenu() {
    const { boards, currentRootId } = this;
    this.boardMenu = boards
      .filter((board) => board.id !== currentRootId)
      .map(({ name: title, id: value }) => ({ title, value }));
  }

  get isActionSwapPortal() {
    return this.model.type === cd.ActionType.SwapPortal;
  }

  updateModel<T>(value: Partial<T>) {
    const update = { ...this.model, ...value } as cd.ActionBehavior;
    this.modelChange.emit(update);
  }

  onChildRefChange(item: cd.SelectItemOutput) {
    const { value: childRef } = item as cd.ISelectItem;
    this.updateModel({ childRef });
  }

  onTriggerChange(item: cd.SelectItemOutput) {
    const { value } = item as cd.ISelectItem;
    const trigger = value as cd.EventTriggerType;
    const outputBinding = utils.isOutputBinding(trigger);
    if (outputBinding) {
      const { outputsConfig, inputs } = this;
      const outputPartial = utils.buildActionOutputPartial(trigger, outputsConfig, inputs);
      this.updateModel(outputPartial);
    } else {
      // Remove output event from model
      const { outputEvent, ...model } = this.model;
      const update = { ...model, trigger };
      this.modelChange.emit(update);
    }
  }

  onSelectOutputEventChange(item: cd.SelectItemOutput) {
    this.onOutputEventChange((item as cd.ISelectItem).value);
  }

  onOutputEventChange(value: string) {
    const outputEvent = { ...this.model.outputEvent, value };
    this.updateModel({ outputEvent });
  }

  onOutputConditionChange(item: cd.SelectItemOutput) {
    const { value: condition } = item as cd.ISelectItem;
    const outputEvent = { ...this.model.outputEvent, condition };
    this.updateModel({ outputEvent });
  }

  onTargetChange(target: string) {
    this.updateModel({ target });
  }

  get modelAsNavigateToURL(): cd.IActionBehaviorNavigationToURL {
    return this.model as cd.IActionBehaviorNavigationToURL;
  }

  get openUrlInATab() {
    return !!this.modelAsNavigateToURL?.openInTab;
  }

  onURLWindowTargetChange(openInTab: number) {
    this.updateModel({ openInTab });
  }

  onDeleteClick() {
    const cmpRef = this.showModal<ConfirmationDialogComponent>(ConfirmationDialogComponent);
    cmpRef.instance.title = 'Remove action?';
    cmpRef.instance.confirm.pipe(takeUntil(this._destroyed)).subscribe(() => {
      this.remove.emit();
    });
  }

  onTargetBoardChange(item: cd.SelectItemOutput) {
    const { value } = item as cd.ISelectItem;
    if (this.isActionSwapPortal) {
      return this.updateSwapPortal({ value });
    }

    this.updateModel({ target: value });
  }

  onActiveValue(value: string) {
    this._interactionService.highlightElement(value);
  }

  onDelayChange(time?: number) {
    if (isNumber(time)) {
      this.updateModel({ delay: time });
    } else {
      const { delay, ...model } = this.model;
      this.modelChange.emit(model as cd.ActionBehavior);
    }
  }

  //////////////////////////
  //// Board Navigation ////
  //////////////////////////

  get topLevelNavigationStatus() {
    return (this.model as cd.IActionBehaviorNavigationToBoard)?.topLevelNavigation;
  }

  onTopLevelNavigationChange(topLevelNavigation: any) {
    this.updateModel({ topLevelNavigation });
  }

  /////////////////////
  //// Swap Portal ////
  /////////////////////

  get activePortalState(): cd.IActionStateChangePortal | undefined {
    return (this.model as cd.IActionBehaviorSwapPortal)
      .stateChanges?.[0] as cd.IActionStateChangePortal;
  }

  onPortalChange(item: cd.SelectItemOutput) {
    const { value: elementId } = item as cd.ISelectItem;
    this.updateSwapPortal({ elementId });
  }

  updateSwapPortal(update: Partial<cd.IActionStateChangePortal>) {
    const [state] = <cd.IActionStateChangePortal[]>(
      (this.model as cd.IActionBehaviorSwapPortal).stateChanges
    );
    const updatedState: cd.IActionStateChangePortal = { ...state, ...update };
    const stateChanges = [updatedState];
    this.updateModel({ stateChanges });
  }

  //////////////////
  //// Scrollto ////
  //////////////////

  get modelAsScrollTo(): cd.IActionBehaviorScrollTo {
    return this.model as cd.IActionBehaviorScrollTo;
  }

  onScrollModeChange(item: cd.SelectItemOutput) {
    const { value: mode } = item as cd.ISelectItem;
    this.updateModel({ mode });
  }

  onScrollVertAlignChange(item: cd.SelectItemOutput) {
    const { value: block } = item as cd.ISelectItem;
    this.updateModel({ block });
  }

  onScrollHorzAlignChange(item: cd.SelectItemOutput) {
    const { value: inline } = item as cd.ISelectItem;
    this.updateModel({ inline });
  }

  onScrollAnimationChange(animate: boolean) {
    this.updateModel({ animate });
  }

  /////////////////////
  //// Reset State ////
  /////////////////////

  get modelAsResetState(): cd.IActionBehaviorResetState {
    return this.model as cd.IActionBehaviorResetState;
  }

  onResetModeChange(item: cd.SelectItemOutput) {
    const { value: mode } = item as cd.ISelectItem;
    this.updateModel({ mode, target: null });
  }

  onResetTargetChildrenChange(targetChildren: boolean) {
    this.updateModel({ targetChildren });
  }
  ////////////////////////
  //// Present Drawer ////
  ////////////////////////

  get modelAsDrawerOpen(): cd.IActionBehaviorOpenDrawer {
    return this.model as cd.IActionBehaviorOpenDrawer;
  }

  onDrawerPositionChange(position: cd.ActionDrawerPosition) {
    this.updateModel({ position });
  }

  onDrawerModeChange(mode: cd.ActionDrawerMode) {
    this.updateModel({ mode });
  }

  onDrawerSizeChange(s?: number) {
    if (isNumber(s)) {
      this.updateModel({ size: s });
    } else {
      // Remove value if undefined
      const { size, ...model } = this.modelAsDrawerOpen;
      this.modelChange.emit(model as cd.ActionBehavior);
    }
  }

  get drawerBackdropColor(): cd.IValue | undefined {
    return this.modelAsDrawerOpen?.backdropColor;
  }

  onDrawerBackdropColorSelect(item: cd.SelectItemOutput) {
    const { id, value, action } = item as cd.ISelectItem;
    if (action) return this.storeAction.emit(item as cd.ISelectItem);
    const backdropColor = { id, value };
    this.updateModel({ backdropColor });
  }

  onDrawerBackdropColorChange(value: string) {
    const { backdropColor, ...model } = this.modelAsDrawerOpen;
    const update = { ...model, backdropColor: { value } };
    this.modelChange.emit(update);
  }

  get drawerShadow() {
    return this.modelAsPresentModalBehavior?.shadow;
  }

  onDrawerShadowChange(item: cd.SelectItemOutput) {
    const { value: shadow } = item as cd.ISelectItem;
    this.updateModel({ shadow });
  }

  //#region present overlay

  get modelAsPresentOverlayBehavior(): cd.IActionBehaviorPresentOverlay {
    return this.model as cd.IActionBehaviorPresentOverlay;
  }

  get overlayAnchor() {
    return this.modelAsPresentOverlayBehavior?.anchor;
  }

  get overlayAlign() {
    return this.modelAsPresentOverlayBehavior?.alignment;
  }

  get overlayPosition() {
    return this.modelAsPresentOverlayBehavior?.position;
  }

  get canShowOverlaySpacing() {
    return this.overlayPosition !== cd.ActionOverlayPosition.Center;
  }

  get overlaySpacing() {
    return this.modelAsPresentOverlayBehavior?.spacing ?? 0;
  }

  get isVerticalOverlayAlign() {
    const { position } = this.modelAsPresentOverlayBehavior;
    return (
      position === cd.ActionOverlayPosition.Top || position === cd.ActionOverlayPosition.Bottom
    );
  }

  get isCenterOverlayPosition() {
    return this.modelAsPresentOverlayBehavior.position === cd.ActionOverlayPosition.Center;
  }

  onOverlayBoardChange(layout: LayoutAlignment) {
    const [position, alignment] = convertFromLayoutAlignment(layout);
    this.updateModel({ position, alignment });
  }

  onAnchorChange(anchor: string) {
    this.updateModel({ anchor });
  }

  onClickOutsideOverlayChange(closeOnOutsideClick: boolean) {
    this.updateModel({ closeOnOutsideClick });
  }

  onSpacingChange(spacing: number) {
    this.updateModel({ spacing: Number(spacing) });
  }

  onOverlayAlignmentChange(item: cd.SelectItemOutput) {
    const { value: alignment } = item as cd.ISelectItem;
    this.updateModel({ alignment });
  }

  onOverlayPositionChange(item: cd.SelectItemOutput) {
    const { value: position } = item as cd.ISelectItem;
    const { alignment: align } = this.modelAsPresentOverlayBehavior;
    const alignment = utils.convertOverlayAlignment(position as cd.ActionOverlayPosition, align);
    this.updateModel({ position, alignment });
  }

  //#endregion

  get isCustomOverlaySize() {
    return this.overlaySize === cd.OverlaySize.Custom;
  }

  get overlaySize(): cd.OverlaySize {
    return overlaySizeFromAction(this.model as cd.IActionBehaviorGenericOverlay);
  }

  onOverlaySizeChange(item: cd.SelectItemOutput) {
    const { value: size } = item as cd.ISelectItem;
    this.updateModel({ size });
  }
  //#region present modal

  get modalAsGenericOverlay(): cd.IActionBehaviorPresentModal | cd.IActionBehaviorPresentOverlay {
    return this.model as cd.IActionBehaviorPresentModal | cd.IActionBehaviorPresentOverlay;
  }

  get modelAsPresentModalBehavior(): cd.IActionBehaviorPresentModal {
    return this.model as cd.IActionBehaviorPresentModal;
  }

  get modalBackgroundColor(): cd.IValue | undefined {
    return this.modelAsPresentModalBehavior?.backgroundColor;
  }

  onModalBkdColorSelect(item: cd.SelectItemOutput) {
    const { id, value, action } = item as cd.ISelectItem;
    if (action) return this.storeAction.emit(item as cd.ISelectItem);
    const backgroundColor = { id, value };
    this.updateModel({ backgroundColor });
  }

  get overlayShadow() {
    return this.modalAsGenericOverlay?.shadow;
  }

  onOverlayShadowChange(item: cd.SelectItemOutput) {
    const { value: shadow } = item as cd.ISelectItem;
    this.updateModel({ shadow });
  }

  get overlayBorderRadius() {
    return this.modalAsGenericOverlay?.borderRadius ?? 0;
  }

  onBorderRadiusChange(radius: number) {
    this.updateModel({ borderRadius: Number(radius) });
  }

  onModalBkdColorChange(value: string) {
    const { backgroundColor, ...model } = this.modelAsPresentModalBehavior;
    const update = { ...model, backgroundColor: { value } };
    this.modelChange.emit(update);
  }

  get overlayWidth() {
    return this.modalAsGenericOverlay?.width;
  }

  onOverlayWidthChange(w?: number) {
    if (isNumber(w)) {
      this.updateModel({ width: w });
    } else {
      const { width, ...model } = this.modalAsGenericOverlay;
      this.modelChange.emit(model as cd.ActionBehavior);
    }
  }

  get overlayHeight() {
    return this.modalAsGenericOverlay?.height;
  }

  onOverlayHeightChange(h?: number) {
    if (isNumber(h)) {
      this.updateModel({ height: h });
    } else {
      const { height, ...model } = this.modalAsGenericOverlay;
      this.modelChange.emit(model as cd.ActionBehavior);
    }
  }

  //#endregion

  //////////////////////////
  //// Recording State /////
  //////////////////////////

  onStartRecording() {
    this.record.emit(true);
  }

  onStopRecording() {
    this.record.emit(false);
  }

  get isToggleTriggerBoardAppear() {
    return this.model.trigger === cd.EventTrigger.BoardAppear;
  }

  get modelAsRecordStateBehavior(): cd.IActionBehaviorRecordState {
    return this.model as cd.IActionBehaviorRecordState;
  }

  get recordedStateChanges() {
    return this.modelAsRecordStateBehavior?.stateChanges;
  }

  onToggleChange(toggle: boolean) {
    this.updateModel({ toggle });
  }

  onDeleteRecord(idx: number) {
    const changes = this.recordedStateChanges || [];
    const stateChanges = removeValueFromArrayAtIndex(idx, changes);
    this.updateModel({ stateChanges });
  }

  onDeleteMultipleRecord(indexes: number[]) {
    const changes = this.recordedStateChanges || [];
    const stateChanges = changes.reduce<cd.IActionStateChange[]>((acc, item, idx) => {
      const hasIndex = indexes.includes(idx);
      if (hasIndex) return acc;
      acc.push(item);
      return acc;
    }, []);
    this.updateModel({ stateChanges });
  }

  onUpdateRecord([idx, change]: [number, cd.IActionStateChange]) {
    if (!this.recordedStateChanges) return;
    const stateChanges = deepCopy(this.recordedStateChanges) || [];
    stateChanges[idx] = change;
    this.updateModel({ stateChanges });
  }

  //////////////////
  //// Snackbar ////
  //////////////////

  get modelAsSnackbarBehavior(): cd.IActionBehaviorSnackbar {
    return this.model as cd.IActionBehaviorSnackbar;
  }

  onSnackbarDurationChange(duration: number) {
    this.updateModel({ duration });
  }

  onSnackbarActionTitleChange(actionTitle: string) {
    this.updateModel({ actionTitle });
  }

  onSnackbarMessageChange(message: string) {
    this.updateModel({ message });
  }

  onSnackbarIconChange(icon: string) {
    this.updateModel({ icon });
  }

  onSnackbarDismissToggle(showDismissBtn: boolean) {
    this.updateModel({ showDismissBtn });
  }

  onSnackBarVertPositionChange(item: cd.SelectItemOutput) {
    const { value: verticalPosition } = item as cd.ISelectItem;
    this.updateModel({ verticalPosition });
  }

  onSnackBarHorzPositionChange(item: cd.SelectItemOutput) {
    const { value: horizontalPosition } = item as cd.ISelectItem;
    this.updateModel({ horizontalPosition });
  }
  ///////////////////////
  /// POST MESSAGE///////
  ///////////////////////

  formatJSON(value: string): Promise<string | false> {
    return this._formatterService?.formatJSON(value);
  }

  async onPostMessageTargetChange(value: string) {
    const formatted = await this.formatJSON(value);
    const validFormatting = formatted !== false;
    const validData = validFormatting && this._formatterService?.validateJSON(formatted as string);
    const valid = validData !== false;
    const target = valid ? String(formatted) : value;
    this.updateModel({ target });
    this.codeIsValid = valid;
    this._cdRef.detectChanges();
  }

  async onValidateJSON(text: string) {
    const formatted = await this.formatJSON(text);
    const validFormatting = formatted !== false;
    const validData = validFormatting && this._formatterService?.validateJSON(formatted as string);
    this.codeIsValid = validData !== false;
  }

  ///////////////////////
  //// Run JS ///////////
  ///////////////////////
  /** Will Return either a string (valid) or the False if invalid */
  formatJS(value: string): Promise<string | false> {
    return this._formatterService?.formatJS(value);
  }

  get runJSScriptValue() {
    return (this.model as cd.IActionBehaviorRunJS)?.value;
  }

  async onValidateJS(text: string) {
    const value = await this.formatJS(text);
    this.codeIsValid = value !== false;
    return value;
  }

  async onJSScriptChange(text: string) {
    const update = await this.onValidateJS(text);
    const value = update === false ? text : update;
    this.updateModel({ value });
    this._cdRef.detectChanges();
  }

  /////////////////////////
  //// Copy Action to  ////
  /////////////////////////

  onCopyAction() {
    this.copyAction.emit(this.model);
  }
}
