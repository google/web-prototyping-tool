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

// prettier-ignore
import { Input, OnChanges, SimpleChanges, OnInit, HostBinding, Optional, Inject, OnDestroy, ɵmarkDirty as markDirty, Directive, ComponentFactoryResolver, ViewContainerRef, ApplicationRef, ComponentRef, } from '@angular/core';
import { IMAGE_FALLBACK_URL_EXPORT_MODE, IMAGE_FALLBACK_URL } from 'cd-common/consts';
import { SnackbarComponent } from '../outlet-components/snackbar/snackbar.component';
import { rootIdsUpdated$ } from '../utils/renderer.utils';
import { getDependenciesOfSymbolInstance } from '../utils/dependency.utils';
import { IOutletAutoNavEvent, IOutletOutputEvent } from '../utils/interfaces';
import { Subscription } from 'rxjs';
import { auditTime, filter } from 'rxjs/operators';
import { areObjectsEqual } from 'cd-utils/object';
import { rendererState } from '../state.manager';
import { generateMergedStyles } from './outlet.utils';
import { DOCUMENT } from '@angular/common';
import * as utils from 'cd-common/utils';
import * as cd from 'cd-interfaces';

export const OUTLET_OUTPUT_EVENT = 'co-output-event';
export const OUTLET_BOARD_APPEARS_EVENT = 'co-board-appears';
export const OUTLET_AUTO_NAV_EVENT = 'co-auto-nav-event';

@Directive()
class SnackbarManagerDirective implements OnDestroy {
  private _snackbarComponent?: ComponentRef<SnackbarComponent>;
  private _snackbarSubscription = Subscription.EMPTY;

  constructor(
    protected _resolver: ComponentFactoryResolver,
    protected _viewRef: ViewContainerRef,
    @Optional() @Inject(DOCUMENT) protected doc?: Document
  ) {}

  ngOnDestroy(): void {
    this._snackbarSubscription.unsubscribe();
  }

  destroySnackbar = (appRef: ApplicationRef) => {
    const { _snackbarComponent } = this;
    if (!_snackbarComponent) return;
    appRef.detachView(_snackbarComponent.hostView);
    this._snackbarSubscription.unsubscribe();
    _snackbarComponent.destroy();
    _snackbarComponent.location.nativeElement.remove();
    this._snackbarComponent = undefined;
  };

  showSnackBar(action: cd.IActionBehaviorSnackbar, appRef: ApplicationRef) {
    if (!this.doc) return;
    // Ignore if current snackbar action equals this action, we're already showing it
    // This could occur if a snackbar appears on mouseover
    if (this._snackbarComponent?.instance.details?.id === action.id) return;

    this.destroySnackbar(appRef);
    const factory = this._resolver.resolveComponentFactory(SnackbarComponent);
    const cmpRef = this._viewRef.createComponent(factory);
    cmpRef.instance.details = action;
    this.doc.body.appendChild(cmpRef.location.nativeElement);
    cmpRef.changeDetectorRef.detectChanges();
    this._snackbarComponent = cmpRef;
    this._snackbarSubscription = cmpRef.instance.closed.subscribe(() => {
      this.destroySnackbar(appRef);
    });
  }
}

@Directive()
export class OutletComponentDirective
  extends SnackbarManagerDirective
  implements OnChanges, OnInit, OnDestroy
{
  private _stylesMap: Record<string, cd.IStyleAttributes> = {};
  private _propertiesMap: cd.ElementPropertiesMap = {};

  private _mergedProperties?: cd.ElementPropertiesMap;
  private _mergedStyles?: Record<string, cd.IStyleAttributes>;

  private _dependencies = new Set<string>();
  private _subscription = new Subscription();
  private _ancestors: string[] = [];
  private _mergedAncestors: string[] = [];
  private _elementCount = 0;
  private _renderId?: string;

  public dataBindingRefreshTrigger = Symbol();

  /**
   * This is the id of the root element (board or symbol) that this OutletComponentDirective should render.
   *
   * The OutletManager will set this for a symbol or board when it is injected into an OutletDocument
   *
   * For portals or symbol instances, this will be bound to their referenceId property.
   */
  @Input()
  set renderId(renderId: string | undefined) {
    if (this._renderId === renderId) return;
    this._renderId = renderId;
    if (renderId) this.dispatchBoardAppears(renderId, this.instanceId);
  }
  get renderId() {
    return this._renderId;
  }

  /**
   * Input assets and design system for generating styles
   */
  @Input() assets: Record<string, cd.IProjectAsset> = {};
  @Input() designSystem?: cd.IDesignSystem;

  /**
   * Currently loaded datasets. Component bindings can lookup datasets from this object.
   */
  @Input() datasets: Record<string, cd.IBuiltInDataset> = {};

  /**
   * The actual JSON payload for each loaded dataset
   */
  @Input() loadedData: Record<string, any> = {};

  /**
   * Mark whether this outlet component is being used for a Board, Portal, Symbol, or Symbol Instance
   */
  @Input() outletType: cd.OutletType = cd.OutletType.Board;

  /**
   * A CSS class marker is used to mark elements that we will collect render rects for.
   *
   * We only add a marker to the inner root of a cd-outlet if the outlet is the direct child of a
   * board or symbol root. Otherwise, this outlet is an instance inside of an instance and should not
   * generate a render rect.
   *
   * The logic for setting this boolean is defined in the generated template.
   */
  @Input() addMarkerToInnerRoot = false;

  /**
   * Set by true by the OutletManager to signify that this OutletComponentDirective is the root component in
   * the outlet document.
   *
   * This flag will be used to determine value of addMarkerToInnerRoot for child outlet instances.
   * Only outlets that are direct children of the outlet root component will have
   * addMarkerToInnerRoot set to true.
   *
   * We also set outlet-root class in order to add styles.
   */
  @HostBinding('class.outlet-root')
  @Input()
  outletRoot = false;

  /**
   * We use the presence of this id to determine whether or not to add element marker class to child
   * elements. If a symbol or portal instance, we do not add the marker class to child elements.
   *
   * It is also used to set the data-instance attribute in the DOM to enable interactions events
   * to easily lookup if event occured inside of an instance
   */
  @Input() instanceId?: string;

  @Input()
  set ancestors(value: string[]) {
    this._ancestors = value;
  }
  get ancestors(): string[] {
    return this._mergedAncestors;
  }

  /**
   * If the component is a symbol instance, the property model will be passed
   * into instanceProps in order to merge overrides
   */
  @Input() instanceProps?: cd.ISymbolInstanceProperties;

  /**
   * Used to generate unique class names for elements when occurring multiple times in different
   * symbol instance or portals
   */
  @Input() elementClassPrefix?: string;

  @Input()
  set styleMap(map: cd.IStringMap<any>) {
    this._stylesMap = map;
  }
  get styleMap(): cd.IStringMap<any> {
    return this._mergedStyles || this._stylesMap || {};
  }

  @Input()
  set propertiesMap(props: cd.ElementPropertiesMap) {
    this._propertiesMap = props;
    this.updateElementCount(props);
  }
  get propertiesMap(): cd.ElementPropertiesMap {
    return this._mergedProperties || this._propertiesMap || {};
  }

  get imageFallbackUrl(): string {
    return rendererState.exportMode ? IMAGE_FALLBACK_URL_EXPORT_MODE : IMAGE_FALLBACK_URL;
  }

  /**
   * Some Material components don't update on initalization
   * This method checks new elements added or removed to mark for change detection
   */
  updateElementCount(props: cd.ElementPropertiesMap) {
    const count = Object.keys(props).length;
    if (this._elementCount === count) return;
    this._elementCount = count;
    this.markForChangeDetection();
  }

  markForChangeDetection() {
    markDirty(this);
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
    super.ngOnDestroy();
  }

  ngOnInit() {
    this._subscription.add(
      rendererState.dataBindingRefreshTrigger$.subscribe(this.updateRefreshToken)
    );
    // Only setup this subscription when this OutletComponentDirective is being used for a symbol instance
    // Only symbol instances contain overrides so this logic is only needed for them.
    if (this.outletType !== cd.OutletType.SymbolInstance) return;
    // when any root id is updated (board or symbol), check to see if we need to re-merge overrides
    const rootIdEvt$ = rootIdsUpdated$.pipe(
      // check and see if any of the updated rootIds are dependencies of this symbol instance
      filter((rootIds) => rootIds.some((id) => this._dependencies.has(id))),
      auditTime(24)
    );
    this._subscription.add(rootIdEvt$.subscribe(this._mergeInstanceOverrides));
  }

  updateRefreshToken = (token: any) => {
    this.dataBindingRefreshTrigger = token;
  };

  ngOnChanges(changes: SimpleChanges) {
    // Include both instanceId and renderId in ancestors array
    // This ensures the ancestor chain is unqiue even when there are multiple instances
    // with the same renderId (e.g. 2 portals that are projecting the same board)
    if (changes.ancestors || changes.renderId || changes.instanceId) {
      const { renderId, instanceId } = this;
      const updatedAncestors = [...this._ancestors];
      if (instanceId) updatedAncestors.push(instanceId);
      if (renderId) updatedAncestors.push(renderId);
      this._mergedAncestors = updatedAncestors;
    }

    // Only re-generate overrides on changes to instance property model or changes to styleMap.
    // Subsequent changes to the properties of child elements of a symbol can occur, but only
    // in isolation mode. Exiting isolation mode will cause complete re-rendering of all boards
    // and any symbol instances will subsequently be reinitialized to include those changes
    let mergeOverrides = false;

    if (this.instanceId && changes.styleMap) {
      mergeOverrides = !areObjectsEqual(
        changes.styleMap.previousValue,
        changes.styleMap.currentValue
      );
    }

    if (changes.instanceProps) {
      mergeOverrides = true;

      // Track dependencies of this symbol instance so that we know when to re-merge overrides
      this._dependencies = getDependenciesOfSymbolInstance(this.instanceProps, this._propertiesMap);
    }

    if (mergeOverrides) {
      this._mergeInstanceOverrides();
    }
  }

  private _distpatchEventToManager(eventId: string, detail: any) {
    const evt = new CustomEvent(eventId, { detail });
    this.doc?.dispatchEvent(evt);
  }

  /** Forward the event to a outlet-manager subscription, used by output events  */
  onOutputChange(value: any, elementId: string, inputBinding: string, writeValue = true) {
    const { instanceId } = this;
    const detail: IOutletOutputEvent = { value, elementId, inputBinding, instanceId, writeValue };
    this._distpatchEventToManager(OUTLET_OUTPUT_EVENT, detail);
  }

  dispatchBoardAppears(id: string, instanceId?: string) {
    this._distpatchEventToManager(OUTLET_BOARD_APPEARS_EVENT, { id, instanceId });
  }

  onAutoNavItemClick(
    navItem: cd.IAutoNavItemUrl | cd.IAutoNavItemBoard,
    autoNavInputs: cd.IAutoNavInputs
  ) {
    const { target } = autoNavInputs;
    const { ancestors } = this;
    const instanceId = ancestors[ancestors.length - 2];
    const detail: IOutletAutoNavEvent = { target, navItem, instanceId };
    this._distpatchEventToManager(OUTLET_AUTO_NAV_EVENT, detail);
  }

  trackByFn(_idx: number, id: string) {
    return id;
  }

  private _mergeInstanceOverrides = () => {
    const { instanceProps, _stylesMap, assets, designSystem } = this;
    if (!instanceProps || !_stylesMap || !designSystem || !assets) return;

    // always merge with latest properties in rendererState to ensure binding latest properties
    const mergedProps = utils.mergeInstanceOverrides(instanceProps, rendererState.mergedProperties);
    this._mergedProperties = mergedProps;

    const bindings: cd.IProjectBindings = { designSystem, assets };
    this._mergedStyles = generateMergedStyles(instanceProps, _stylesMap, mergedProps, bindings);
  };
}
