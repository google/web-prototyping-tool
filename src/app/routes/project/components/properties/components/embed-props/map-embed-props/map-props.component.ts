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
  OnInit,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';

import { getPathAndParamsFromEmbedURL, buildSourceURL } from '../embed.utils';
import { BehaviorSubject, Observable, of, Observer, ReplaySubject } from 'rxjs';
import { queryParamsFromPropertiesMap } from 'cd-utils/url';
import { switchMap, map, takeUntil } from 'rxjs/operators';
import { loadScript } from 'cd-utils/dom';
import * as config from './map.config';
import * as cd from 'cd-interfaces';

let loadedMapsApi = false;

// eslint-disable-next-line no-var
declare var google: any;

@Component({
  selector: 'app-map-props',
  templateUrl: './map-props.component.html',
  styleUrls: ['./map-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPropsComponent implements OnInit, OnDestroy {
  private _src = '';
  private _destroyed = new ReplaySubject<void>(1);
  public hasLoadedMaps = loadedMapsApi;
  public placeSuggestions$ = new Observable<cd.ISelectItem[]>();
  public suggestionQuery$ = new BehaviorSubject<string>('');
  public isPlace = false;
  public query = config.DEFAULT_PLACE;
  public zoom = config.DEFAULT_ZOOM;
  public latitude = config.DEFAULT_LAT;
  public longitude = config.DEFAULT_LNG;

  @Input()
  set src(value: string) {
    this._src = value;
    this.extractParamsFromSource(value);
  }
  get src(): string {
    return this._src;
  }

  @Output() srcChange = new EventEmitter<string>();

  constructor(private _cdRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadAPI();
  }

  ngOnDestroy(): void {
    this._destroyed.next();
    this._destroyed.complete();
  }

  extractParamsFromSource(value: string) {
    const [path, queryString] = getPathAndParamsFromEmbedURL(value, config.GOOGLE_MAPS_EMBED_URL);
    const isPlace = path === config.MAPS_PLACE;
    const params = new URLSearchParams(queryString);
    this.isPlace = isPlace;
    const latlng = params.get(config.MapParam.Center)?.split(',').map(Number);
    this.latitude = latlng?.[0] || config.DEFAULT_LAT;
    this.longitude = latlng?.[1] || config.DEFAULT_LNG;
    this.query = params.get(config.MapParam.Query) || config.DEFAULT_PLACE;
    this.zoom = Number(params.get(config.MapParam.Zoom)) || config.DEFAULT_ZOOM;
  }

  loadAPI() {
    if (loadedMapsApi) return this._subscriptToPlaceSuggestions();
    loadScript(config.MAPS_JS_API).then(this.onScriptLoaded);
  }

  onScriptLoaded = () => {
    loadedMapsApi = true;
    this.hasLoadedMaps = true;
    this._subscriptToPlaceSuggestions();
    this._cdRef.markForCheck();
  };

  onModeChange(value: string) {
    const isPlace = value as unknown as boolean;
    if (isPlace) return this.updatePlaceSource(config.DEFAULT_PLACE);
    this.updateAreaSource(config.DEFAULT_ZOOM, config.DEFAULT_LAT, config.DEFAULT_LNG);
  }

  onQueryInputChange(e: Event) {
    const { value } = e.target as HTMLInputElement;
    this.suggestionQuery$.next(value);
  }

  updatePlaceSource(query: string) {
    const params = queryParamsFromPropertiesMap({
      [config.MapParam.Query]: query,
      [config.MapParam.Key]: config.MAPS_API_KEY,
    });
    const src = buildSourceURL(config.GOOGLE_MAPS_EMBED_URL, config.MAPS_PLACE, params);
    this.srcChange.emit(src);
  }

  updateAreaSource(zoom = config.DEFAULT_ZOOM, lat: number, lng: number) {
    const params = queryParamsFromPropertiesMap({
      [config.MapParam.Zoom]: zoom,
      [config.MapParam.Center]: [lat, lng].toString(),
      [config.MapParam.Key]: config.MAPS_API_KEY,
    });
    const src = buildSourceURL(config.GOOGLE_MAPS_EMBED_URL, config.MAPS_VIEW, params);
    this.srcChange.emit(src);
  }

  onQueryChange(item: string | cd.ISelectItem) {
    const query = (item as cd.ISelectItem).value || (item as string);
    this.updatePlaceSource(query);
  }

  onZoomChange(zoom: number) {
    this.updateAreaSource(zoom, this.latitude, this.longitude);
  }

  onLatitudeChange(latitude: number) {
    this.updateAreaSource(this.zoom, latitude, this.longitude);
  }

  onLongitudeChange(longitude: number) {
    this.updateAreaSource(this.zoom, this.latitude, longitude);
  }

  get autocomplete() {
    return google?.maps?.places?.AutocompleteService;
  }

  private _getAutocompleteService(): config.IAutocompleteService | undefined {
    const { autocomplete } = this;
    return autocomplete && new autocomplete();
  }

  private _convertSuggestionToSelectItem = ({
    description,
  }: config.IPlaceSuggestion): cd.ISelectItem => {
    return { title: description, value: description, icon: config.PLACE_DATA_ICON };
  };

  private _subscriptToPlaceSuggestions = () => {
    const autocomplete = this._getAutocompleteService();
    if (!autocomplete) return;

    this.placeSuggestions$ = this.suggestionQuery$.pipe(
      switchMap((input) => {
        if (!input) return of(null);

        // convert callback of autocomplete.getPlacePredictions into obersvable
        const response$: Observable<config.IPlaceSuggestion[]> = new Observable(
          (observer: Observer<config.IPlaceSuggestion[]>) => {
            autocomplete.getPlacePredictions({ input }, (response: config.IPlaceSuggestion[]) => {
              observer.next(response);
            });
          }
        );

        return response$;
      }),
      map((predictions) =>
        predictions ? predictions.map(this._convertSuggestionToSelectItem) : []
      ),
      takeUntil(this._destroyed)
    );
  };
}
