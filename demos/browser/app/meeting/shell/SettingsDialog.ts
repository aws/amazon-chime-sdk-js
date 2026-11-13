// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MeetingConfig } from '../config/MeetingConfig';
import {
  ConfigValues,
  GROUP_LABELS,
  optionByKey,
  OptionGroup,
  OPTIONS,
  OptionSpec,
  ShownOptionSpec,
} from '../config/schema';
import { STRINGS } from '../strings';
import Dialog from '../ui/Dialog';
import { byId, el } from '../ui/dom';
import Toast from '../ui/Toast';

type Control = HTMLInputElement | HTMLSelectElement;

/** Extra rows a feature contributes to a tab, e.g. the device pickers. */
export type SettingsSections = Partial<Record<OptionGroup, HTMLElement[]>>;

const SHOWN: ShownOptionSpec[] = OPTIONS.filter(
  (option): option is ShownOptionSpec => !option.hidden
);

/** Settings dialog rendered from the option schema; serves the join screen and the meeting. */
export default class SettingsDialog {
  readonly dialog: Dialog;
  private readonly controls = new Map<keyof ConfigValues, Control>();
  private readonly rows = new Map<keyof ConfigValues, HTMLElement>();
  private readonly segmented = new Map<keyof ConfigValues, () => void>();
  private readonly tabs = new Map<OptionGroup, { tab: HTMLButtonElement; panel: HTMLElement }>();
  /** A section title hides with its options. */
  private readonly sectionTitles = new Map<HTMLElement, (keyof ConfigValues)[]>();
  private inMeeting = false;
  /** Values joined with; join-time options that differ need a rejoin. */
  private joinedWith: ConfigValues | undefined;
  private readonly viewListeners = new Set<(open: boolean, tab: OptionGroup) => void>();
  private currentTab: OptionGroup = 'general';
  private readonly rejoinButton = byId<HTMLButtonElement>('settings-rejoin');
  private filter = '';
  private readonly filterInput = byId<HTMLInputElement>('settings-filter');
  private constraints: ((
    values: ConfigValues,
    controls: Map<keyof ConfigValues, Control>
  ) => void)[] = [];

  constructor(
    private readonly config: MeetingConfig,
    private readonly sections: SettingsSections = {},
    private readonly extraActions: HTMLElement[] = []
  ) {
    this.dialog = Dialog.byId('settings-dialog');
    this.render();
    this.renderDeveloperToggle();
    this.filterInput.addEventListener('input', () => {
      this.filter = this.filterInput.value.trim().toLowerCase();
      this.refreshVisibility();
    });
    this.dialog.onClose(() => {
      this.notifyView();
      if (this.filter) {
        this.filterInput.value = '';
        this.filter = '';
        this.refreshVisibility();
      }
    });
    byId('settings-reset').addEventListener('click', () => {
      const undo = this.config.resetToDefaults();
      Toast.show({
        message: STRINGS.settingsReset,
        durationMs: 8000,
        buttons: [{ text: STRINGS.undo, onClick: undo }],
      });
    });
    byId('settings-no-match-clear').addEventListener('click', () => {
      this.filterInput.value = '';
      this.filter = '';
      this.refreshVisibility();
      this.filterInput.focus();
    });
    this.config.onChange(key => this.onConfigChanged(key));
    this.refreshVisibility();
  }

  open(group?: OptionGroup): void {
    if (group) {
      this.selectTab(group);
    }
    const wasOpen = this.dialog.isOpen;
    this.dialog.open();
    if (!wasOpen) {
      this.notifyView();
    }
  }

  onViewChange(listener: (open: boolean, tab: OptionGroup) => void): void {
    this.viewListeners.add(listener);
  }

  private notifyView(): void {
    for (const listener of this.viewListeners) {
      listener(this.dialog.isOpen, this.currentTab);
    }
  }

  close(): void {
    this.dialog.close();
  }

  setInMeeting(inMeeting: boolean): void {
    this.inMeeting = inMeeting;
    this.joinedWith = inMeeting ? { ...this.config.values } : undefined;
    this.dialog.element.classList.toggle('settings-in-meeting', inMeeting);
    this.refreshVisibility();
  }

  addConstraint(
    constraint: (values: ConfigValues, controls: Map<keyof ConfigValues, Control>) => void
  ): void {
    this.constraints.push(constraint);
    constraint(this.config.values, this.controls);
  }

  control<T extends Control = Control>(key: keyof ConfigValues): T {
    const control = this.controls.get(key);
    if (!control) {
      throw new Error(`No control for ${String(key)}`);
    }
    return control as T;
  }

  private render(): void {
    const tabList = byId('settings-tabs');
    const panels = byId('settings-panels');
    const groups = (Object.keys(GROUP_LABELS) as OptionGroup[]).filter(group =>
      SHOWN.some(option => option.group === group)
    );
    for (const group of groups) {
      const panel = el('div', {
        class: 'settings-panel',
        role: 'tabpanel',
        id: `settings-panel-${group}`,
        hidden: true,
      });
      const tab = el('button', {
        type: 'button',
        class: 'settings-tab',
        role: 'tab',
        id: `settings-tab-${group}`,
        'aria-controls': panel.id,
        'aria-selected': 'false',
        text: GROUP_LABELS[group],
        onclick: () => this.selectTab(group),
      });
      tabList.appendChild(tab);
      panels.appendChild(panel);
      this.tabs.set(group, { tab, panel });
      for (const section of this.sections[group] ?? []) {
        panel.appendChild(section);
      }
      // Live options first, then join-time ones, then titled sections. The developer switch is
      // in the footer.
      const options = SHOWN.filter(
        candidate => candidate.group === group && candidate.key !== 'developerMode'
      );
      const appendOptions = (list: ShownOptionSpec[]): void => {
        for (const option of [
          ...list.filter(o => o.applies === 'live'),
          ...list.filter(o => o.applies !== 'live'),
        ]) {
          const slot = option.slot ? panel.querySelector(`#${option.slot}`) : null;
          (slot ?? panel).appendChild(this.renderOption(option));
        }
      };
      appendOptions(options.filter(o => !o.section));
      for (const section of new Set(options.map(o => o.section).filter(Boolean))) {
        const members = options.filter(o => o.section === section);
        const title = el('h3', { class: 'settings-section-title', text: section });
        panel.appendChild(title);
        this.sectionTitles.set(
          title,
          members.map(o => o.key)
        );
        appendOptions(members);
      }
    }
    const general = this.tabs.get('general')!.panel;
    for (const action of this.extraActions) {
      general.appendChild(action);
    }
    tabList.addEventListener('keydown', event => this.onTabKey(event));
    this.selectTab('general');
  }

  /** ARIA tabs pattern: arrows, Home and End move between visible tabs. */
  private onTabKey(event: KeyboardEvent): void {
    const visible = Array.from(this.tabs.entries()).filter(([, { tab }]) => !tab.hidden);
    const current = visible.findIndex(([, { tab }]) => tab === document.activeElement);
    if (current < 0) {
      return;
    }
    const last = visible.length - 1;
    const next =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? current === last
          ? 0
          : current + 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? current === 0
            ? last
            : current - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : -1;
    if (next < 0) {
      return;
    }
    event.preventDefault();
    const [group, { tab }] = visible[next];
    this.selectTab(group);
    tab.focus();
  }

  private renderDeveloperToggle(): void {
    const option = SHOWN.find(candidate => candidate.key === 'developerMode')!;
    const control = el('input', { type: 'checkbox', id: option.id, class: 'switch' });
    control.checked = this.config.developerMode;
    control.addEventListener('change', () => this.onControlChanged(option, control));
    this.controls.set(option.key, control);
    byId('settings-footer-start').append(
      el(
        'label',
        { class: 'settings-dev-toggle', for: option.id },
        control,
        el('span', { text: option.label })
      )
    );
  }

  private pendingRejoinChanges(): (keyof ConfigValues)[] {
    const joinedWith = this.joinedWith;
    if (!joinedWith) {
      return [];
    }
    return SHOWN.filter(
      option =>
        option.applies === 'join' && this.config.values[option.key] !== joinedWith[option.key]
    ).map(option => option.key);
  }

  private renderOption(option: ShownOptionSpec): HTMLElement {
    const values = this.config.values;
    let control: Control;
    const help = option.help ? el('div', { class: 'setting-help', text: option.help }) : null;
    const appliesNote =
      option.applies === 'join'
        ? el('span', { class: 'setting-applies', text: STRINGS.appliesNextJoin })
        : option.applies === 'create'
          ? el('span', {
              class: 'setting-applies',
              text: STRINGS.appliesOnCreate,
            })
          : null;
    const label = el(
      'span',
      { class: 'setting-label' },
      el('span', { text: option.label }),
      help,
      appliesNote
    );

    if (option.type === 'boolean') {
      control = el('input', { type: 'checkbox', id: option.id, class: 'switch' });
      control.checked = values[option.key] as boolean;
    } else if (option.type === 'select') {
      control = el(
        'select',
        { id: option.id, class: 'select' },
        ...option.choices.map(choice =>
          el('option', { value: choice.value, id: choice.id, text: choice.label })
        )
      );
      control.value = String(values[option.key]);
      if (option.segmented) {
        return this.renderSegmented(option, control, label);
      }
    } else if (option.type === 'number') {
      control = el('input', {
        type: 'number',
        id: option.id,
        class: 'input',
        min: option.min,
        max: option.max,
        placeholder: option.placeholder,
      });
      const value = values[option.key] as number | null;
      control.value = value === null ? '' : String(value);
    } else {
      control = el('input', {
        type: option.inputType ?? 'text',
        id: option.id,
        class: option.inputType === 'color' ? 'color-input' : 'input',
        placeholder: option.placeholder,
      });
      control.value = String(values[option.key]);
      if (option.inputType === 'color') {
        // 'input' so the colour applies while the picker is dragged.
        control.addEventListener('input', () => this.onControlChanged(option, control));
      }
    }

    const row = el('label', { class: 'setting', for: option.id }, label, control);
    row.dataset.audience = option.audience;
    row.dataset.applies = option.applies;
    row.dataset.key = String(option.key);
    control.addEventListener('change', () => this.onControlChanged(option, control));
    this.controls.set(option.key, control);
    this.rows.set(option.key, row);
    return row;
  }

  /** The hidden select stays the control (same id); the buttons only drive it. */
  private renderSegmented(
    option: ShownOptionSpec & { type: 'select' },
    select: HTMLSelectElement,
    label: HTMLElement
  ): HTMLElement {
    select.hidden = true;
    const buttons = option.choices.map(choice =>
      el('button', {
        type: 'button',
        role: 'radio',
        class: 'segment',
        text: choice.label,
        'aria-checked': String(select.value === choice.value),
        onclick: () => {
          select.value = choice.value;
          this.onControlChanged(option, select);
        },
      })
    );
    const group = el(
      'div',
      { class: 'segmented', role: 'radiogroup', 'aria-labelledby': `${option.id}-label` },
      ...buttons
    );
    label.id = `${option.id}-label`;
    this.segmented.set(option.key, () => {
      buttons.forEach((button, index) => {
        button.setAttribute('aria-checked', String(option.choices[index].value === select.value));
        button.disabled = select.disabled;
      });
    });
    // The integration tests drive the hidden select directly.
    select.addEventListener('change', () => this.onControlChanged(option, select));
    const row = el('div', { class: 'setting setting-stacked' }, label, group, select);
    row.dataset.audience = option.audience;
    row.dataset.applies = option.applies;
    row.dataset.key = String(option.key);
    this.controls.set(option.key, select);
    this.rows.set(option.key, row);
    return row;
  }

  private onControlChanged(option: OptionSpec, control: Control): void {
    let value: ConfigValues[keyof ConfigValues];
    switch (option.type) {
      case 'boolean':
        value = (control as HTMLInputElement).checked;
        break;
      case 'number':
        value = control.value === '' ? null : Number(control.value);
        break;
      default:
        value = control.value;
    }
    this.config.set(option.key, value as never);
  }

  private onConfigChanged(key: keyof ConfigValues): void {
    const control = this.controls.get(key);
    const option = optionByKey(key);
    if (control) {
      const value = this.config.values[key];
      if (option.type === 'boolean') {
        (control as HTMLInputElement).checked = value as boolean;
      } else {
        control.value = value === null ? '' : String(value);
      }
    }
    this.segmented.get(key)?.();
    this.refreshVisibility();
  }

  private refreshVisibility(): void {
    const values = this.config.values;
    const developer = values.developerMode;
    const pending = new Set(this.pendingRejoinChanges());
    for (const option of SHOWN) {
      const row = this.rows.get(option.key);
      if (!row) {
        continue;
      }
      row.classList.toggle('setting-pending', pending.has(option.key));
      if (option.applies === 'join') {
        row.querySelector('.setting-applies')!.textContent = pending.has(option.key)
          ? STRINGS.rejoinToApplyChange
          : STRINGS.appliesNextJoin;
      }
      const audienceOk = option.audience === 'user' || developer || pending.has(option.key);
      const conditionOk = option.showIf ? option.showIf(values) : true;
      const stageOk = !(this.inMeeting && option.applies === 'create');
      const filterOk =
        !this.filter ||
        `${option.label} ${option.help ?? ''} ${option.param}`.toLowerCase().includes(this.filter);
      row.hidden = !(audienceOk && conditionOk && stageOk && filterOk);
    }
    for (const [title, keys] of this.sectionTitles) {
      title.hidden = keys.every(key => this.rows.get(key)!.hidden);
    }
    // While filtering, every tab's matches show in one list.
    this.dialog.element.classList.toggle('settings-filtering', !!this.filter);
    const schemaRows = new Set(this.rows.values());
    for (const [group, { tab, panel }] of this.tabs) {
      // Contributed rows filter on their visible text.
      for (const row of Array.from(panel.querySelectorAll<HTMLElement>('.setting'))) {
        if (!schemaRows.has(row)) {
          row.hidden = !!this.filter && !row.textContent!.toLowerCase().includes(this.filter);
        }
      }
      const anyVisible = Array.from(panel.children).some(child => !(child as HTMLElement).hidden);
      tab.hidden = !(anyVisible || group === 'general');
      if (tab.hidden && tab.getAttribute('aria-selected') === 'true') {
        this.selectTab('general');
      }
      if (this.filter) {
        panel.hidden = !Array.from(panel.querySelectorAll<HTMLElement>('.setting')).some(
          row => !row.hidden
        );
      } else {
        panel.hidden = tab.getAttribute('aria-selected') !== 'true';
      }
    }
    const noMatch =
      !!this.filter && Array.from(this.tabs.values()).every(({ panel }) => panel.hidden);
    byId('settings-no-match').hidden = !noMatch;
    byId('settings-no-match-text').textContent = noMatch
      ? STRINGS.noSettingsMatch(this.filter)
      : '';
    for (const constraint of this.constraints) {
      constraint(values, this.controls);
    }
    this.rejoinButton.hidden = pending.size === 0;
    this.rejoinButton.textContent = STRINGS.rejoinToApply(pending.size);
  }

  private selectTab(group: OptionGroup): void {
    const changed = group !== this.currentTab;
    this.currentTab = group;
    if (changed && this.dialog.isOpen) {
      queueMicrotask(() => this.notifyView());
    }
    for (const [candidate, { tab, panel }] of this.tabs) {
      const selected = candidate === group;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panel.hidden = !selected;
    }
  }
}
