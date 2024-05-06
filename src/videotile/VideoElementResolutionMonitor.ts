export interface VideoElementResolutionObserver {
    /**
     * Called when the resolution of the video element changes.
     * @param newWidth The new width of the video element.
     * @param newHeight The new height of the video element.
     */
    videoElementResolutionChanged(newWidth: number, newHeight: number): void;
  
    /**
     * Called when the video element is unbound from the monitor.
     */
    videoElementUnbound(): void;
  }

/**
 * [[VideoElementResolutionMonitor]] monitors changes in the resolution of a video element
 * and relays that information to observers.
 */
export default interface VideoElementResolutionMonitor {
    /**
     * Registers an observer that will be notified when the resolution of the video element changes,
     * or when the video element is unbound.
     * @param observer An instance of VideoElementResolutionObserver that will receive update notifications.
     */
    registerObserver(observer: VideoElementResolutionObserver): void;
    
    /**
     * Removes a previously registered observer, stopping it from receiving any further notifications.
     * @param observer The observer to be removed from the notification queue.
     */
    removeObserver(observer: VideoElementResolutionObserver): void;

    /**
     * Binds a new HTMLVideoElement for monitoring. If a video element is already bound, it is unbound
     * and the new element is bound in its place. A null value just unbinds.
     * @param newElement The new HTMLVideoElement to be monitored, or null to unbind.
     */
    bindVideoElement(newElement: HTMLVideoElement | null): void;
}