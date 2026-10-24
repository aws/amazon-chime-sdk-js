// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Thin wrapper over the native `<dialog>` element. `showModal()` already gives us the backdrop,
 * focus trap, Escape handling and inert page that Bootstrap's modal plugin used to provide.
 */
export default class Dialog {
  private readonly onCloseHandlers = new Set<() => void>();

  private pressedOnBackdrop = false;
  private readonly closeButtons: HTMLElement[];
  private readonly onCloseEvent = (): void => {
    for (const handler of this.onCloseHandlers) {
      handler();
    }
  };
  // A press that starts and ends on the backdrop closes it; a drag out of a field does not.
  private readonly onPointerDown = (event: PointerEvent): void => {
    this.pressedOnBackdrop = this.onBackdrop(event);
  };
  private readonly onClick = (event: MouseEvent): void => {
    if (this.pressedOnBackdrop && this.onBackdrop(event)) {
      this.element.close();
    }
    this.pressedOnBackdrop = false;
  };
  private readonly closeNow = (): void => this.close();

  constructor(public readonly element: HTMLDialogElement) {
    element.addEventListener('close', this.onCloseEvent);
    element.addEventListener('pointerdown', this.onPointerDown);
    element.addEventListener('click', this.onClick);
    this.closeButtons = Array.from(element.querySelectorAll<HTMLElement>('[data-dialog-close]'));
    for (const button of this.closeButtons) {
      button.addEventListener('click', this.closeNow);
    }
  }

  /** Close and detach, so a new Dialog on the same element does not double the listeners. */
  destroy(): void {
    this.close();
    this.element.removeEventListener('close', this.onCloseEvent);
    this.element.removeEventListener('pointerdown', this.onPointerDown);
    this.element.removeEventListener('click', this.onClick);
    for (const button of this.closeButtons) {
      button.removeEventListener('click', this.closeNow);
    }
    this.onCloseHandlers.clear();
  }

  private onBackdrop(event: MouseEvent): boolean {
    if (event.target !== this.element) {
      return false;
    }
    const rect = this.element.getBoundingClientRect();
    return (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    );
  }

  static byId(id: string): Dialog {
    const element = document.getElementById(id);
    if (!(element instanceof HTMLDialogElement)) {
      throw new Error(`#${id} is not a <dialog>`);
    }
    return new Dialog(element);
  }

  get isOpen(): boolean {
    return this.element.open;
  }

  open(): void {
    if (!this.element.open) {
      this.element.showModal();
    }
  }

  close(): void {
    if (this.element.open) {
      this.element.close();
    }
  }

  toggle(): void {
    this.isOpen ? this.close() : this.open();
  }

  onClose(handler: () => void): () => void {
    this.onCloseHandlers.add(handler);
    return () => this.onCloseHandlers.delete(handler);
  }
}
