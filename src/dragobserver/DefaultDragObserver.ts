// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DragContext from './DragContext';
import DragEvent from './DragEvent';
import DragObserver from './DragObserver';
import DragType from './DragType';

export default class DefaultDragObserver implements DragObserver {
  private readonly mouseDownEventListener: EventListener;
  private readonly mouseMoveEventListener: EventListener;
  private readonly mouseUpEventListener: EventListener;

  constructor(
    private window: Window,
    private element: HTMLElement,
    callback: (dragEvent: DragEvent) => void
  ) {
    const context: DragContext = { isMouseDown: false };
    this.mouseDownEventListener = DefaultDragObserver.mouseDownEventListener(
      context,
      callback,
      element
    );
    this.mouseMoveEventListener = DefaultDragObserver.mouseMoveEventListener(
      context,
      callback,
      element
    );
    this.mouseUpEventListener = DefaultDragObserver.mouseUpEventListener(
      context,
      callback,
      element
    );
    element.addEventListener('mousedown', this.mouseDownEventListener);
    window.addEventListener('mousemove', this.mouseMoveEventListener);
    window.addEventListener('mouseup', this.mouseUpEventListener);
  }

  unobserve(): void {
    this.element.removeEventListener('mousedown', this.mouseDownEventListener);
    this.window.removeEventListener('mousemove', this.mouseMoveEventListener);
    this.window.removeEventListener('mouseup', this.mouseUpEventListener);
  }

  static elementRelativeCoords = (event: MouseEvent, element: HTMLElement): [number, number] => {
    return [
      event.clientX - element.getBoundingClientRect().left,
      event.clientY - element.getBoundingClientRect().top,
    ];
  };

  static mouseDownEventListener = (
    context: DragContext,
    callback: (dragEvent: DragEvent) => void,
    element: HTMLElement
  ): EventListener => (event: MouseEvent) => {
    context.isMouseDown = true;
    const coords = DefaultDragObserver.elementRelativeCoords(event, element);
    callback(
      (context.last = {
        type: DragType.BEGIN,
        coords,
        last: context.last,
      })
    );
  };

  static mouseMoveEventListener = (
    context: DragContext,
    callback: (dragEvent: DragEvent) => void,
    element: HTMLElement
  ): EventListener => (event: MouseEvent) => {
    if (!context.isMouseDown) {
      return;
    }
    callback(
      (context.last = {
        type: DragType.DRAG,
        coords: DefaultDragObserver.elementRelativeCoords(event, element),
        last: context.last,
      })
    );
  };

  static mouseUpEventListener = (
    context: DragContext,
    callback: (dragEvent: DragEvent) => void,
    element: HTMLElement
  ): EventListener => (event: MouseEvent) => {
    if (!context.isMouseDown) {
      return;
    }
    context.isMouseDown = false;
    callback(
      (context.last = {
        type: DragType.END,
        coords: DefaultDragObserver.elementRelativeCoords(event, element),
        last: context.last,
      })
    );
  };
}
