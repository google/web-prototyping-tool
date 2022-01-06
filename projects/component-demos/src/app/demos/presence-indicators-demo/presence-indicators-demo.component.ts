import type * as cd from 'cd-interfaces';
import { createId } from 'cd-utils/guid';
import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import firebase from 'firebase/app';
import 'firebase/firestore';

const createPresence = (): cd.IUserPresence => {
  return {
    user: {
      id: createId(),
      name: 'John Doe',
      email: 'somebody@somewhere.com',
      photoUrl: '',
      profileUrl: null,
    },
    projectId: 'Smy40jIKFwob5pSaTav3',
    sessionId: createId(),
    creationTime: firebase.firestore.Timestamp.now(),
    pollTime: firebase.firestore.Timestamp.now(),
  };
};

@Component({
  selector: 'app-presence-indicators-demo',
  template: `
    <button (click)="addPresentUser()" style="margin-right: 12px">Add user</button>
    <button (click)="removePresentUser()">Remove user</button>
    <app-presence-indicators
      [presentUsers]="presentUsers"
      style="position: absolute; top:320px; left:20px;"
    ></app-presence-indicators>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PresenceIndicatorsDemoComponent {
  constructor(private _cdRef: ChangeDetectorRef) {}

  presentUsers: cd.IUserPresence[] = [
    createPresence(),
    createPresence(),
    createPresence(),
    createPresence(),
  ];

  addPresentUser() {
    this.presentUsers = [...this.presentUsers, createPresence()];
    this._cdRef.markForCheck();
  }

  removePresentUser() {
    this.presentUsers = this.presentUsers.slice(0, -1);
    this._cdRef.markForCheck();
  }
}
