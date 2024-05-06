import VideoElementResolutionMonitor, { VideoElementResolutionObserver } from './VideoElementResolutionMonitor';

export default class DefaultVideoElementResolutionMonitor implements VideoElementResolutionMonitor {
  private observerQueue = new Set<VideoElementResolutionObserver>();
  private resizeObserver: ResizeObserver;
  private element?: HTMLVideoElement;

  constructor(element?: HTMLVideoElement) {
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const {width, height} = entry.contentRect;
        this.notifyObservers(width, height);
      }
    });
    if (element) {
      this.bindVideoElement(element);
    }
  }

  private notifyObservers(newWidth: number, newHeight: number): void {
    for (const observer of this.observerQueue) {
      observer.videoElementResolutionChanged(newWidth, newHeight);
    }
  }

  registerObserver(observer: VideoElementResolutionObserver): void {
    this.observerQueue.add(observer);
  }

  removeObserver(observer: VideoElementResolutionObserver): void {
    this.observerQueue.delete(observer);
  }

  bindVideoElement(newElement: HTMLVideoElement): void {
    this.element = newElement;
    if (!this.element) {
        this.resizeObserver.unobserve(this.element);
        return;
    }
    this.resizeObserver.observe(this.element);
  }
}
