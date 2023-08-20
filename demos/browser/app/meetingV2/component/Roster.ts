// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
    
    selectedAttendeeSet = new Set<Attendee>();

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
    addAttendee(attendeeId: string, attendeeName: string, allowAttendeeCapabilities: boolean): void {
        if (this.hasAttendee(attendeeId)) {
            return;
        }
        const attendee = new Attendee(attendeeId, attendeeName);
        this.attendeeInfoMap.set(attendeeId, attendee);

        // Construt a new attendee element
        const attendeeElement : HTMLLIElement = document.createElement('li') as HTMLLIElement;
        const attendeeNameElement: HTMLSpanElement = document.createElement('span') as HTMLSpanElement;
        const attendeeStatusElement: HTMLSpanElement = document.createElement('span') as HTMLSpanElement;
        const attendeeCheckbox: HTMLInputElement = document.createElement('input') as HTMLInputElement;

        // For the content attendee, set it to invisible to maintain the layout.
        attendeeCheckbox.className = 'roster-checkbox form-check-input m-0 flex-shrink-0 ' + (attendee.isContentAttendee ? ' invisible' : '');
        attendeeCheckbox.type = 'checkbox';
        attendeeCheckbox.value = '';
        attendeeCheckbox.addEventListener('change', () => {
            if (attendeeCheckbox.checked) {
                this.selectedAttendeeSet.add(attendee);
            } else {
                this.selectedAttendeeSet.delete(attendee);
            }
            this.updateRosterMenu();
        });
        
        attendeeNameElement.className = 'name flex-grow-1 text-truncate';
        attendeeNameElement.innerText = attendeeName;
        
        attendeeStatusElement.className = 'status';
        
        attendeeElement.className = 'list-group-item d-flex align-items-center gap-2';
        attendeeElement.id = Roster.ATTENDEE_ELEMENT_PREFIX + attendeeId;
        if (allowAttendeeCapabilities) {
            attendeeElement.classList.add('ps-2');
            attendeeElement.appendChild(attendeeCheckbox);
        }
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

        this.selectedAttendeeSet.delete(this.attendeeInfoMap.get(attendeeId));
        this.updateRosterMenu();

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

        this.unselectAll();
    }

    unselectAll() {
        this.selectedAttendeeSet.clear();
        this.updateRosterMenu();
        for (const checkboxElement of (Array.from(document.getElementsByClassName('roster-checkbox')) as HTMLInputElement[])) {
            checkboxElement.checked = false;
        }
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

    private updateRosterMenu(): void {
        const instruction = document.getElementById('roster-menu-instruction');
        const rosterMenuOneAttendee = document.getElementById('roster-menu-one-attendee');
        const rosterMenuNoneSelected = document.getElementById('roster-menu-none-seleced');
        const rosterMenuAllAttendeesExcept = document.getElementById('roster-menu-all-attendees-except');
        const rosterMenuAllAttendeesExceptLabel = document.getElementById('roster-menu-all-attendees-except-label');

        const size = this.selectedAttendeeSet.size;
        if (size > 0) {
            instruction.innerText = `${size} selected`;
            rosterMenuNoneSelected.classList.add('hidden');
            rosterMenuAllAttendeesExceptLabel.innerText = `Update all attendees, except ${size} selected`;

            if (size === 1) {
                // If one attendee is selected, provide two options:
                // - Update one attendee only, using the update-attendee-capabilities API
                // - Update all attendees, except the selected one, using the batch-update-attendee-capabilities-except API
                rosterMenuOneAttendee.classList.remove('hidden');
                rosterMenuAllAttendeesExcept.classList.remove('hidden');
            } else if (size > 1) {
                // If multiple attendees are selected, provide the following option:
                // - Update all attendees, except the selected one, using the batch-update-attendee-capabilities-except API
                rosterMenuOneAttendee.classList.add('hidden');
                rosterMenuAllAttendeesExcept.classList.remove('hidden');
            }
        } else {
            instruction.innerText = '';
            rosterMenuAllAttendeesExceptLabel.innerText = `Update all attendees`;

            // If none are selected, show the instruction.
            rosterMenuNoneSelected.classList.remove('hidden');
            rosterMenuOneAttendee.classList.add('hidden');
            rosterMenuAllAttendeesExcept.classList.add('hidden');
        }

    }
}