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

import type * as cd from 'cd-interfaces';
import * as consts from 'cd-common/consts';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import * as firestore from '@angular/fire/firestore';
import { PresenceService } from '../presence/presence.service';
import {
  parseRtcMessage,
  RtcMessage,
  RtcMessageChangeRequest,
  RtcMessageCursorPosition,
  RtcMessageHideCursor,
  RtcMessageSelection,
  RTC_CHANGE_REQUEST_MESSAGE,
  RTC_CURSOR_POSITION_MESSAGE,
  RTC_HIDE_CURSOR_MESSAGE,
  RTC_SELECTION_MESSAGE,
  stringifyRtcMessage,
} from './rtc.messages';
import { isDisconnected } from './rtc.utils';

const RTC_DATA_CHANNEL = 'cd_RtcDataChannel';
const RTC_CONFIG = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

@Injectable({
  providedIn: 'root',
})
export class RtcService {
  private peerConnectionLoggingEnabled = false;

  private _currentPresence?: cd.IUserPresence;
  private _usersMap = new Map<string, cd.IUserPresence>();
  private _cursorPositions = new Map<string, cd.IUserCursor>();
  private _peerSelectionMap = new Map<string, cd.IUserSelection>();

  private rtcConnections = new Map<string, RTCPeerConnection>();
  private rtcDataChannels = new Map<RTCPeerConnection, RTCDataChannel>();
  private openRtcDataChannels = new WeakMap<RTCDataChannel, boolean>();
  private answeredPeerConnections = new Set<RTCPeerConnection>();

  public peerCursors$ = new BehaviorSubject<cd.IUserCursor[]>([]);
  public peerSelection$ = new BehaviorSubject<cd.IUserSelection[]>([]);
  public peerChangeRequest$ = new Subject<RtcMessageChangeRequest>();

  constructor(private presenceService: PresenceService, private afs: firestore.AngularFirestore) {
    this.presenceService.currentPresence$.subscribe(this.onCurrentUserPresence);
    this.presenceService.otherPresentUsers$.subscribe(this.onOtherUsers);
  }

  onOtherUsers = (users: cd.IUserPresence[]) => {
    this._usersMap = new Map(users.map((u) => [u.sessionId, u]));
    this.clearAbsentUsers();
    this.sendRtcConnectionRequestsToExistingUsers();
  };

  onCurrentUserPresence = (currentPresence?: cd.IUserPresence) => {
    this._currentPresence = currentPresence;

    // Once our user presence is established:

    // 1. Send out RTC Connection requests to any users that are already present
    this.sendRtcConnectionRequestsToExistingUsers();

    // 2. Subscribe to all incoming connection requests
    this.respondToRtcConnectionRequests();

    // 3. Subscribe to all answers to requests that we create
    this.respondToRtcConnectionAnswers();
  };

  /**
   * Send connection requests to any users that were created before _currentUser.
   * This mechanism prevents 2 clients from both sending connection requests to each other
   */
  sendRtcConnectionRequestsToExistingUsers = async () => {
    this.rtcLog('RtcService: sendRtcConnectionRequestsToExistingUsers');

    const { _currentPresence } = this;
    if (!_currentPresence) return;

    const allUsers = Array.from(this._usersMap.values());
    const otherUsers = allUsers.filter((u) => u.sessionId !== _currentPresence.sessionId);
    const existingUsers = otherUsers.filter((u) => u.creationTime < _currentPresence.creationTime);
    const unConnectedUsers = existingUsers.filter((u) => !this.rtcConnections.has(u.sessionId));

    if (!unConnectedUsers.length) return;
    const rtcCollection = this.afs.collection<cd.IRtcConnectionRequest>(
      consts.FirebaseCollection.RtcConnections
    );

    for (const user of unConnectedUsers) {
      this.rtcLog('Initiating RTC connections to unconnected/existing users', unConnectedUsers);
      const peerConnection = new RTCPeerConnection(RTC_CONFIG);
      this.rtcConnections.set(user.sessionId, peerConnection);
      this.registerPeerConnectionListeners(peerConnection);

      // Create the data channel for sending messages before creating the offer (it is part of the offer)
      const dataChannel = peerConnection.createDataChannel(RTC_DATA_CHANNEL);
      this.addDataChannel(peerConnection, dataChannel);

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Add connection request to database
      const rtcDoc = rtcCollection.doc();

      rtcDoc.set({
        fromSessionId: _currentPresence.sessionId,
        toSessionId: user.sessionId,
        rtcOfferDesc: { sdp: offer.sdp, type: offer.type },
        rtcAnswerDesc: null,
      });

      // Collect ICE candidates
      peerConnection.addEventListener('icecandidate', (event) => {
        if (!event.candidate) return;
        this.rtcLog('Got candidate: ', event.candidate);

        // Add iceCandidate to a subcollection of fromUserIceCandidates
        const iceCandidate = event.candidate.toJSON();
        rtcDoc.collection(consts.FirebaseCollection.fromUserIceCandidates).add(iceCandidate);
      });
    }
  };

  respondToRtcConnectionRequests = () => {
    this.rtcLog('RtcService: respondToRtcConnectionRequests');

    const { _currentPresence } = this;
    if (!_currentPresence) return;

    const connectionRequestsToCurrentUser = this.afs.collection<cd.IRtcConnectionRequest>(
      consts.FirebaseCollection.RtcConnections,
      (ref) => {
        return ref.where('toSessionId', '==', _currentPresence.sessionId);
      }
    );

    connectionRequestsToCurrentUser.snapshotChanges().subscribe(async (snapshotChanges) => {
      for (const change of snapshotChanges) {
        const rtcDocRef = change.payload.doc.ref;
        const connectionRequest = change.payload.doc.data();
        if (this.rtcConnections.has(connectionRequest.fromSessionId)) continue;
        const peerConnection = new RTCPeerConnection(RTC_CONFIG);
        this.registerPeerConnectionListeners(peerConnection);
        this.rtcConnections.set(connectionRequest.fromSessionId, peerConnection);

        const offer = new RTCSessionDescription(connectionRequest.rtcOfferDesc);
        await peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        peerConnection.setLocalDescription(answer);

        // Listen for the data channel creation that the fromSessionId will create
        const { addDataChannel } = this;
        peerConnection.ondatachannel = function (e) {
          addDataChannel(peerConnection, e.channel);
        };

        // Add answer to connection request doc in database
        const rtcAnswerDesc = { sdp: answer.sdp, type: answer.type };
        const answerUpdate: Partial<cd.IRtcConnectionRequest> = { rtcAnswerDesc };
        rtcDocRef.update(answerUpdate);

        // Collect ICE candidates
        peerConnection.addEventListener('icecandidate', (event) => {
          if (!event.candidate) return;
          this.rtcLog('Got candidate: ', event.candidate);

          // Add iceCandidate to a subcollection of fromUserIceCandidates
          const iceCandidate = event.candidate.toJSON();
          rtcDocRef.collection(consts.FirebaseCollection.toUserIceCandidates).add(iceCandidate);
        });

        // Listen for Ice Candidates from remote
        rtcDocRef
          .collection(consts.FirebaseCollection.fromUserIceCandidates)
          .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((snapshotChange) => {
              if (snapshotChange.type !== 'added') return; // only add new iceCandidates
              const iceCandidate = new RTCIceCandidate(snapshotChange.doc.data());
              this.rtcLog('Adding ice candidate from fromUser', iceCandidate);
              peerConnection.addIceCandidate(iceCandidate);
            });
          });
      }
    });
  };

  respondToRtcConnectionAnswers = () => {
    this.rtcLog('RtcService: respondToRtcConnectionAnswers');

    const { _currentPresence } = this;
    if (!_currentPresence) return;
    const { sessionId } = _currentPresence;
    const answeredConnectionsToCurrentUserRequests = this.afs.collection<cd.IRtcConnectionRequest>(
      consts.FirebaseCollection.RtcConnections,
      (ref) => {
        return ref.where('fromSessionId', '==', sessionId).where('rtcAnswerDesc', '!=', null);
      }
    );

    answeredConnectionsToCurrentUserRequests
      .snapshotChanges()
      .subscribe(async (snapshotChanges) => {
        for (const change of snapshotChanges) {
          const docRef = change.payload.doc.ref;
          const connectionRequest = change.payload.doc.data();

          // lookup peerConnection that we already created to this user
          const peerConnection = this.rtcConnections.get(connectionRequest.toSessionId);
          if (
            !peerConnection ||
            !connectionRequest.rtcAnswerDesc ||
            this.answeredPeerConnections.has(peerConnection)
          ) {
            continue;
          }

          // add answer to peerConnection for this user
          this.rtcLog('Received answer to rtc connection request - calling setRemoteDescription');
          const answer = new RTCSessionDescription(connectionRequest.rtcAnswerDesc);
          this.answeredPeerConnections.add(peerConnection);
          await peerConnection.setRemoteDescription(answer);

          // Listen for Ice Candidates from remote
          // Need to wait until we have setRemoteDescription with answer before adding ice Candidates
          docRef
            .collection(consts.FirebaseCollection.toUserIceCandidates)
            .onSnapshot((snapshot) => {
              snapshot.docChanges().forEach((snapshotChange) => {
                if (snapshotChange.type !== 'added') return; // only add new iceCandidates
                const iceCandidateData = snapshotChange.doc.data();
                const iceCandidate = new RTCIceCandidate(iceCandidateData);
                this.rtcLog('Adding ice candidate from toUser', iceCandidate);
                peerConnection.addIceCandidate(iceCandidate);
              });
            });
        }
      });
  };

  addDataChannel = (peerConnection: RTCPeerConnection, dataChannel: RTCDataChannel) => {
    this.rtcLog('RtcService: addDataChannel');

    this.rtcDataChannels.set(peerConnection, dataChannel);
    const { rtcLog, onRtcMessageReceived, openRtcDataChannels } = this;

    dataChannel.onopen = function () {
      rtcLog('Data channel open');
      openRtcDataChannels.set(dataChannel, true);
    };

    dataChannel.onmessage = function (event) {
      onRtcMessageReceived(event.data);
    };

    dataChannel.onclose = function () {
      rtcLog('Data channel close');
      openRtcDataChannels.set(dataChannel, false);
    };
  };

  broadcastMessage = (message: RtcMessage) => {
    this.rtcLog('RtcService: broadcastMessage');

    const messageStr = stringifyRtcMessage(message);

    for (const channel of this.rtcDataChannels.values()) {
      if (!this.openRtcDataChannels.get(channel)) continue;
      channel.send(messageStr);
    }
  };

  broadcastCursorPositionMessage = (cursor: cd.IUserCursor) => {
    const { _currentPresence } = this;
    if (!_currentPresence) return;
    const message = new RtcMessageCursorPosition(_currentPresence.sessionId, cursor);
    this.broadcastMessage(message);
  };

  broadcastHideCursorMessage = () => {
    const { _currentPresence } = this;
    if (!_currentPresence) return;
    const message = new RtcMessageHideCursor(_currentPresence.sessionId);
    this.broadcastMessage(message);
  };

  broadcastSelectionMessage = (selection: cd.IUserSelection) => {
    const { _currentPresence } = this;
    if (!_currentPresence) return;
    const message = new RtcMessageSelection(_currentPresence.sessionId, selection);
    this.broadcastMessage(message);
  };

  broadcastChangeRequestMessage = (change: cd.IChangeRequest) => {
    const { _currentPresence } = this;
    if (!_currentPresence) return;
    const message = new RtcMessageChangeRequest(_currentPresence.sessionId, change);
    this.broadcastMessage(message);
  };

  onRtcMessageReceived = (messageStr: string) => {
    this.rtcLog('RtcService: onRtcMessageReceived');

    const message = parseRtcMessage(messageStr);
    if (!message) return;
    if (message.name === RTC_CURSOR_POSITION_MESSAGE) return this.onCursorMessage(message);
    if (message.name === RTC_HIDE_CURSOR_MESSAGE) return this.onHideCursorMessage(message);
    if (message.name === RTC_SELECTION_MESSAGE) return this.onSelectionMessage(message);
    if (message.name === RTC_CHANGE_REQUEST_MESSAGE) return this.peerChangeRequest$.next(message);
  };

  onCursorMessage = (cursorMessage: RtcMessageCursorPosition) => {
    const { sessionId, cursor } = cursorMessage;
    this._cursorPositions.set(sessionId, cursor);
    const cursors = Array.from(this._cursorPositions.values());
    this.peerCursors$.next(cursors);
  };

  onHideCursorMessage = (message: RtcMessageHideCursor) => {
    const { sessionId } = message;
    this._cursorPositions.delete(sessionId);
    const cursors = Array.from(this._cursorPositions.values());
    this.peerCursors$.next(cursors);
  };

  onSelectionMessage = (cursorMessage: RtcMessageSelection) => {
    const { sessionId, selection } = cursorMessage;
    this._peerSelectionMap.set(sessionId, selection);
    const selections = Array.from(this._peerSelectionMap.values());
    this.peerSelection$.next(selections);
  };

  rtcLog = (...args: any[]) => {
    if (!this.peerConnectionLoggingEnabled) return;
    console.log(...args);
  };

  registerPeerConnectionListeners(peerConnection: RTCPeerConnection) {
    peerConnection.addEventListener('icegatheringstatechange', () => {
      this.rtcLog(`ICE gathering state changed: ${peerConnection.iceGatheringState}`);
    });

    peerConnection.addEventListener('connectionstatechange', () => {
      const { connectionState } = peerConnection;

      // Remove connection when it closes
      if (isDisconnected(peerConnection)) this.removeConnection(peerConnection);

      this.rtcLog(`Connection state change: ${connectionState}`);
    });

    peerConnection.addEventListener('signalingstatechange', () => {
      this.rtcLog(`Signaling state change: ${peerConnection.signalingState}`);
    });

    peerConnection.addEventListener('iceconnectionstatechange ', () => {
      this.rtcLog(`ICE connection state change: ${peerConnection.iceConnectionState}`);
    });
  }

  /* Clear cursors, selection and rtc connections for users who are no longer present */
  private clearAbsentUsers() {
    const { _usersMap, _cursorPositions, _peerSelectionMap } = this;

    // Filter cursors
    const cursorEntries = Array.from(_cursorPositions.entries());
    const filteredCursors = cursorEntries.filter(([sessionId]) => _usersMap.has(sessionId));
    this._cursorPositions = new Map(filteredCursors);
    this.peerCursors$.next(Array.from(this._cursorPositions.values()));

    // Filter selection
    const selectionEntries = Array.from(_peerSelectionMap.entries());
    const filteredSelection = selectionEntries.filter(([sessionId]) => _usersMap.has(sessionId));
    this._peerSelectionMap = new Map(filteredSelection);
    this.peerSelection$.next(Array.from(this._peerSelectionMap.values()));
  }

  private removeConnection = (endedConnection: RTCPeerConnection) => {
    if (endedConnection.removeAllListeners) endedConnection.removeAllListeners();
    const dataChannel = this.rtcDataChannels.get(endedConnection);
    if (dataChannel) this.openRtcDataChannels.delete(dataChannel);
    this.rtcDataChannels.delete(endedConnection);
    const connectionEntries = Array.from(this.rtcConnections.entries());
    const filtered = connectionEntries.filter(([, v]) => !isDisconnected(v));
    this.rtcConnections = new Map(filtered);
  };
}
