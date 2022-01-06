import type * as cd from 'cd-interfaces';
import { Component, ChangeDetectionStrategy, AfterViewInit, Input } from '@angular/core';
import { OverlayInitService } from 'cd-common';
import { openUserProjects, openUserTeamsPage } from 'src/app/utils/user.utils';

@Component({
  selector: 'app-overflow-indicators',
  templateUrl: './overflow-indicators.component.html',
  styleUrls: ['./overflow-indicators.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverflowIndicatorsComponent implements AfterViewInit {
  @Input()
  overflowUsers: cd.IUserPresence[] = [];

  @Input()
  darkTheme = false;

  constructor(private _overlayInit: OverlayInitService) {}

  ngAfterViewInit() {
    this._overlayInit.componentLoaded();
  }

  trackByFn(_index: number, presence: cd.IUserPresence): string {
    return presence.sessionId;
  }

  openProjects(presence: cd.IUserPresence) {
    const email = presence?.user?.email;
    if (!email) return;
    openUserProjects(email);
  }

  openTeams(presence: cd.IUserPresence) {
    const email = presence?.user?.email;
    if (!email) return;
    openUserTeamsPage(email);
  }
}
