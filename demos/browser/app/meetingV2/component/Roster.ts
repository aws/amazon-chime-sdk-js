// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Tooltip } from 'bootstrap';
import {
  DefaultModality
} from 'amazon-chime-sdk-js';

class Attendee {
    name: string;
    id: string;
    muted: boolean;
    signalStrength: number;
    speaking: boolean;
    isContentAttendee: boolean;

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
        this.signalStrength = 1;
        this.isContentAttendee = new DefaultModality(id).hasModality(
           DefaultModality.MODALITY_CONTENT
        );
    }
}

/**
 * Class to allow handling the UI interactions and display associated with the roster section.
 */
export default class Roster {

    static readonly ATTENDEE_ELEMENT_PREFIX: string = "roster-";
    static readonly CONTAINER_ID = 'roster';

    attendeeInfoMap: Map<string, Attendee> = new Map<string, Attendee>();   

    /**
     * Returns a boolean indicating if the attendeeId is part of the roster or not.
     */
     hasAttendee(attendeeId: string): boolean {
        return this.attendeeInfoMap.has(attendeeId);
    }

    /**
     * Returns the list of all the attendees part of the roster.
     */
    getAllAttendeeIds(): string[] {
        let attendeeIds: string[] = [];
        const attendeeIterator = this.attendeeInfoMap.keys();
        for (let index = 0; index < this.attendeeInfoMap.size; index++) {
            attendeeIds.push(attendeeIterator.next().value);
        }
        return attendeeIds;
    }

    /**
     * Adds a new attendee to the roster
     * @param attendeeId - the id to be associated with the attendee
     * @param attendeeName - the name of the attendee
     */
    addAttendee(attendeeId: string, attendeeName: string): void {
        if (this.hasAttendee(attendeeId)) {
            return;
        }
        const attendee = new Attendee(attendeeId, attendeeName);
        this.attendeeInfoMap.set(attendeeId, attendee);

        // Construt a new attendee element
        const attendeeElement : HTMLLIElement = document.createElement('li') as HTMLLIElement;
        const attendeeNameElement: HTMLSpanElement = document.createElement('span') as HTMLSpanElement;
        const attendeeStatusElement: HTMLSpanElement = document.createElement('span') as HTMLSpanElement;
        const attendeeCapabilityButton: HTMLButtonElement = document.createElement('button') as HTMLButtonElement;
        
        attendeeNameElement.className = 'name flex-grow-1';
        attendeeNameElement.innerText = attendeeName;
        
        attendeeStatusElement.className = 'status';

        // For the content attendee, set it to invisible to maintain the layout.
        attendeeCapabilityButton.className = 'capability-button btn btn-link btn-sm ' + (attendee.isContentAttendee ? ' invisible' : '');
        attendeeCapabilityButton.innerHTML = require('../../../node_modules/open-iconic/svg/cog.svg');
        if (!attendee.isContentAttendee) {
            attendeeCapabilityButton.setAttribute('data-bs-target', '#attendee-capabilities-modal');
            attendeeCapabilityButton.setAttribute('data-bs-toggle', 'modal');
            attendeeCapabilityButton.setAttribute('data-bs-attendee-id', attendeeId);
            attendeeCapabilityButton.setAttribute('data-bs-attendee-name', attendeeName);
            new Tooltip(attendeeCapabilityButton, {
                animation: false,
                title: 'Update capabilities'
            });
        }
        
        attendeeElement.className = 'list-group-item d-flex align-items-center gap-1 pe-1';
        attendeeElement.id = Roster.ATTENDEE_ELEMENT_PREFIX + attendeeId;
        attendeeElement.appendChild(attendeeNameElement);
        attendeeElement.appendChild(attendeeStatusElement);
        attendeeElement.appendChild(attendeeCapabilityButton);

        const containerElement: HTMLUListElement = this.getContainerElement();
        containerElement.appendChild(attendeeElement);
    }
    
    /**
     * Remove the attendee from the roster
     * @param attendeeId 
     * @returns 
     * true - if we were able to remove an attendee successfully
     * false - if the attendeeId does not exist
     */    
    removeAttendee(attendeeId: string): boolean {
        if (!this.hasAttendee(attendeeId)) {
            return false;
        }

        // Remove from the element from the roster
        const containerElement: HTMLUListElement = this.getContainerElement();
        const childToDelete = document.getElementById(Roster.ATTENDEE_ELEMENT_PREFIX + attendeeId) as HTMLLIElement;
        containerElement.removeChild(childToDelete);

        this.attendeeInfoMap.delete(attendeeId);
        return true;
    }

    /**
     * Sets the mute status of the attendee
     * @param attendeeId - the attendeeId for whom we intend to set the mute status.
     * @param status - boolean value indicating if the attendee is muted or not.
     */
    setMuteStatus(attendeeId: string, status: boolean): void {
        if (!this.hasAttendee(attendeeId)) {
            return;
        }
        const attendee: Attendee =  this.attendeeInfoMap.get(attendeeId);
        attendee.muted = status;
        this.handleRosterStatusUpdate(attendeeId);
    }

    /**
     * Sets the audio signal strength of the attendee. This helps indicate the network connection of the attendee.
     * @param attendeeId - the attendeeId for whom we intend to set the audio signal strength.
     * @param signal - value indicating the signal strength.
     */    
    setSignalStrength(attendeeId : string, signal: number): void {
        if (!this.hasAttendee(attendeeId)) {
            return;
        }
        const attendee: Attendee =  this.attendeeInfoMap.get(attendeeId);
        attendee.signalStrength = signal;
        this.handleRosterStatusUpdate(attendeeId);
    }

    /**
     * Sets the speaking status of the attendee
     * @param attendeeId - the attendeeId for whom we intend to set the speaking status.
     * @param status - boolean value indicating if the attendee is speaking or not.
     */     
    setAttendeeSpeakingStatus(attendeeId: string, status: boolean): void {
        if (!this.hasAttendee(attendeeId)) {
            return;
        }
        const attendee: Attendee =  this.attendeeInfoMap.get(attendeeId);
        attendee.speaking = status;
        this.handleRosterStatusUpdate(attendeeId);
    }

    /**
     * Clears the roster state.
     */
    clear() {
        const container: HTMLUListElement = this.getContainerElement();
        container.innerHTML = "";
        this.attendeeInfoMap.clear();
    }

    private getContainerElement(): HTMLUListElement {
        return document.getElementById(Roster.CONTAINER_ID) as HTMLUListElement;
    }

    private handleRosterStatusUpdate(attendeeId: string): void {
        let statusText = '\xa0'; // &nbsp
        let statusClass = 'status badge rounded-pill ';
        const attendee: Attendee =  this.attendeeInfoMap.get(attendeeId);        
        if (attendee.signalStrength < 1) {
            statusClass += 'bg-warning';
        } else if (attendee.signalStrength === 0) {
            statusClass = 'bg-danger';
        } else if (attendee.muted) {
            statusText = 'MUTED';
            statusClass += 'bg-secondary';
        } else if (attendee.speaking) {
            statusText = 'SPEAKING';
            statusClass += 'bg-success';
        }

        const attendeeElement : HTMLLIElement = document.getElementById(Roster.ATTENDEE_ELEMENT_PREFIX + attendeeId) as HTMLLIElement;
        const attendeeStatusElement: HTMLSpanElement = attendeeElement.getElementsByClassName('status')[0] as HTMLSpanElement;
        
        attendeeStatusElement.className = statusClass;
        attendeeStatusElement.innerText = statusText;
    }
}