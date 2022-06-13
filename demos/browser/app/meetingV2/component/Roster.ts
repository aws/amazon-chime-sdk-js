// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

class Attendee {
    name : string;
    id : string;
    muted: boolean;
    signalStrength: number;
    speaking: boolean;

    constructor(name: string, id: string) {
        this.name = name;
        this.id = name;
        this.signalStrength = 1;
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

        attendeeNameElement.className = 'name';
        attendeeNameElement.innerText = attendeeName;

        attendeeStatusElement.className = 'status';

        attendeeElement.className = 'list-group-item d-flex justify-content-between align-items-center';
        attendeeElement.id = Roster.ATTENDEE_ELEMENT_PREFIX + attendeeId;
        attendeeElement.appendChild(attendeeNameElement);
        attendeeElement.appendChild(attendeeStatusElement);

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
        let statusClass = 'status badge badge-pill ';
        const attendee: Attendee =  this.attendeeInfoMap.get(attendeeId);        
        if (attendee.signalStrength < 1) {
            statusClass += 'badge-warning';
        } else if (attendee.signalStrength === 0) {
            statusClass = 'badge-danger';
        } else if (attendee.muted) {
            statusText = 'MUTED';
            statusClass += 'badge-secondary';
        } else if (attendee.speaking) {
            statusText = 'SPEAKING';
            statusClass += 'badge-success';
        }

        const attendeeElement : HTMLLIElement = document.getElementById(Roster.ATTENDEE_ELEMENT_PREFIX + attendeeId) as HTMLLIElement;
        const attendeeStatusElement: HTMLSpanElement = attendeeElement.getElementsByClassName('status')[0] as HTMLSpanElement;
        
        attendeeStatusElement.className = statusClass;
        attendeeStatusElement.innerText = statusText;
    }
}