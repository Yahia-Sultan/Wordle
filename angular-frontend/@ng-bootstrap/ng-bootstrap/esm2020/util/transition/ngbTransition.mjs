import { EMPTY, fromEvent, of, race, Subject, timer } from 'rxjs';
import { endWith, filter, takeUntil } from 'rxjs/operators';
import { getTransitionDurationMs } from './util';
import { environment } from '../../environment';
import { runInZone } from '../util';
const noopFn = () => { };
const { transitionTimerDelayMs } = environment;
const runningTransitions = new Map();
export const ngbRunTransition = (zone, element, startFn, options) => {
    // Getting initial context from options
    let context = options.context || {};
    // Checking if there are already running transitions on the given element.
    const running = runningTransitions.get(element);
    if (running) {
        switch (options.runningTransition) {
            // If there is one running and we want for it to 'continue' to run, we have to cancel the new one.
            // We're not emitting any values, but simply completing the observable (EMPTY).
            case 'continue':
                return EMPTY;
            // If there is one running and we want for it to 'stop', we have to complete the running one.
            // We're simply completing the running one and not emitting any values and merging newly provided context
            // with the one coming from currently running transition.
            case 'stop':
                zone.run(() => running.transition$.complete());
                context = Object.assign(running.context, context);
                runningTransitions.delete(element);
        }
    }
    // Running the start function
    const endFn = startFn(element, options.animation, context) || noopFn;
    // If 'prefer-reduced-motion' is enabled, the 'transition' will be set to 'none'.
    // If animations are disabled, we have to emit a value and complete the observable
    // In this case we have to call the end function, but can finish immediately by emitting a value,
    // completing the observable and executing end functions synchronously.
    if (!options.animation || window.getComputedStyle(element).transitionProperty === 'none') {
        zone.run(() => endFn());
        return of(undefined).pipe(runInZone(zone));
    }
    // Starting a new transition
    const transition$ = new Subject();
    const finishTransition$ = new Subject();
    const stop$ = transition$.pipe(endWith(true));
    runningTransitions.set(element, {
        transition$,
        complete: () => {
            finishTransition$.next();
            finishTransition$.complete();
        },
        context
    });
    const transitionDurationMs = getTransitionDurationMs(element);
    // 1. We have to both listen for the 'transitionend' event and have a 'just-in-case' timer,
    // because 'transitionend' event might not be fired in some browsers, if the transitioning
    // element becomes invisible (ex. when scrolling, making browser tab inactive, etc.). The timer
    // guarantees, that we'll release the DOM element and complete 'ngbRunTransition'.
    // 2. We need to filter transition end events, because they might bubble from shorter transitions
    // on inner DOM elements. We're only interested in the transition on the 'element' itself.
    zone.runOutsideAngular(() => {
        const transitionEnd$ = fromEvent(element, 'transitionend').pipe(takeUntil(stop$), filter(({ target }) => target === element));
        const timer$ = timer(transitionDurationMs + transitionTimerDelayMs).pipe(takeUntil(stop$));
        race(timer$, transitionEnd$, finishTransition$).pipe(takeUntil(stop$)).subscribe(() => {
            runningTransitions.delete(element);
            zone.run(() => {
                endFn();
                transition$.next();
                transition$.complete();
            });
        });
    });
    return transition$.asObservable();
};
export const ngbCompleteTransition = (element) => {
    runningTransitions.get(element)?.complete();
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdiVHJhbnNpdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy91dGlsL3RyYW5zaXRpb24vbmdiVHJhbnNpdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUMsS0FBSyxFQUFFLFNBQVMsRUFBYyxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDNUUsT0FBTyxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDMUQsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQy9DLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM5QyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBa0JsQyxNQUFNLE1BQU0sR0FBdUIsR0FBRyxFQUFFLEdBQUUsQ0FBQyxDQUFDO0FBRTVDLE1BQU0sRUFBQyxzQkFBc0IsRUFBQyxHQUFHLFdBQVcsQ0FBQztBQUM3QyxNQUFNLGtCQUFrQixHQUFHLElBQUksR0FBRyxFQUFzQyxDQUFDO0FBRXpFLE1BQU0sQ0FBQyxNQUFNLGdCQUFnQixHQUN6QixDQUFJLElBQVksRUFBRSxPQUFvQixFQUFFLE9BQWdDLEVBQUUsT0FBZ0MsRUFDckYsRUFBRTtJQUVqQix1Q0FBdUM7SUFDdkMsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sSUFBTyxFQUFFLENBQUM7SUFFdkMsMEVBQTBFO0lBQzFFLE1BQU0sT0FBTyxHQUFHLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNoRCxJQUFJLE9BQU8sRUFBRTtRQUNYLFFBQVEsT0FBTyxDQUFDLGlCQUFpQixFQUFFO1lBQ2pDLGtHQUFrRztZQUNsRywrRUFBK0U7WUFDL0UsS0FBSyxVQUFVO2dCQUNiLE9BQU8sS0FBSyxDQUFDO1lB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Q0FBQyxDQUFDO0FBRVYsTUFBTSxDQUFDLE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxPQUFvQixFQUFFLEVBQUU7SUFDNUQsa0JBQWtCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxFQUFFLFFBQVEsRUFBRSxDQUFDO0FBQy9DLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Tmdab25lfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHtFTVBUWSwgZnJvbUV2ZW50LCBPYnNlcnZhYmxlLCBvZiwgcmFjZSwgU3ViamVjdCwgdGltZXJ9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQge2VuZFdpdGgsIGZpbHRlciwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XHJcbmltcG9ydCB7Z2V0VHJhbnNpdGlvbkR1cmF0aW9uTXN9IGZyb20gJy4vdXRpbCc7XHJcbmltcG9ydCB7ZW52aXJvbm1lbnR9IGZyb20gJy4uLy4uL2Vudmlyb25tZW50JztcclxuaW1wb3J0IHtydW5JblpvbmV9IGZyb20gJy4uL3V0aWwnO1xyXG5cclxuZXhwb3J0IHR5cGUgTmdiVHJhbnNpdGlvblN0YXJ0Rm48VCA9IGFueT4gPSAoZWxlbWVudDogSFRNTEVsZW1lbnQsIGFuaW1hdGlvbjogYm9vbGVhbiwgY29udGV4dDogVCkgPT5cclxuICAgIE5nYlRyYW5zaXRpb25FbmRGbiB8IHZvaWQ7XHJcbmV4cG9ydCB0eXBlIE5nYlRyYW5zaXRpb25FbmRGbiA9ICgpID0+IHZvaWQ7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIE5nYlRyYW5zaXRpb25PcHRpb25zPFQ+IHtcclxuICBhbmltYXRpb246IGJvb2xlYW47XHJcbiAgcnVubmluZ1RyYW5zaXRpb246ICdjb250aW51ZScgfCAnc3RvcCc7XHJcbiAgY29udGV4dD86IFQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgTmdiVHJhbnNpdGlvbkN0eDxUPiB7XHJcbiAgdHJhbnNpdGlvbiQ6IFN1YmplY3Q8YW55PjtcclxuICBjb21wbGV0ZTogKCkgPT4gdm9pZDtcclxuICBjb250ZXh0OiBUO1xyXG59XHJcblxyXG5jb25zdCBub29wRm46IE5nYlRyYW5zaXRpb25FbmRGbiA9ICgpID0+IHt9O1xyXG5cclxuY29uc3Qge3RyYW5zaXRpb25UaW1lckRlbGF5TXN9ID0gZW52aXJvbm1lbnQ7XHJcbmNvbnN0IHJ1bm5pbmdUcmFuc2l0aW9ucyA9IG5ldyBNYXA8SFRNTEVsZW1lbnQsIE5nYlRyYW5zaXRpb25DdHg8YW55Pj4oKTtcclxuXHJcbmV4cG9ydCBjb25zdCBuZ2JSdW5UcmFuc2l0aW9uID1cclxuICAgIDxUPih6b25lOiBOZ1pvbmUsIGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBzdGFydEZuOiBOZ2JUcmFuc2l0aW9uU3RhcnRGbjxUPiwgb3B0aW9uczogTmdiVHJhbnNpdGlvbk9wdGlvbnM8VD4pOlxyXG4gICAgICAgIE9ic2VydmFibGU8dm9pZD4gPT4ge1xyXG5cclxuICAgICAgICAgIC8vIEdldHRpbmcgaW5pdGlhbCBjb250ZXh0IGZyb20gb3B0aW9uc1xyXG4gICAgICAgICAgbGV0IGNvbnRleHQgPSBvcHRpb25zLmNvbnRleHQgfHwgPFQ+e307XHJcblxyXG4gICAgICAgICAgLy8gQ2hlY2tpbmcgaWYgdGhlcmUgYXJlIGFscmVhZHkgcnVubmluZyB0cmFuc2l0aW9ucyBvbiB0aGUgZ2l2ZW4gZWxlbWVudC5cclxuICAgICAgICAgIGNvbnN0IHJ1bm5pbmcgPSBydW5uaW5nVHJhbnNpdGlvbnMuZ2V0KGVsZW1lbnQpO1xyXG4gICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcclxuICAgICAgICAgICAgc3dpdGNoIChvcHRpb25zLnJ1bm5pbmdUcmFuc2l0aW9uKSB7XHJcbiAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgb25lIHJ1bm5pbmcgYW5kIHdlIHdhbnQgZm9yIGl0IHRvICdjb250aW51ZScgdG8gcnVuLCB3ZSBoYXZlIHRvIGNhbmNlbCB0aGUgbmV3IG9uZS5cclxuICAgICAgICAgICAgICAvLyBXZSdyZSBub3QgZW1pdHRpbmcgYW55IHZhbHVlcywgYnV0IHNpbXBseSBjb21wbGV0aW5nIHRoZSBvYnNlcnZhYmxlIChFTVBUWSkuXHJcbiAgICAgICAgICAgICAgY2FzZSAnY29udGludWUnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEVNUFRZO1xyXG4gICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIG9uZSBydW5uaW5nIGFuZCB3ZSB3YW50IGZvciBpdCB0byAnc3RvcCcsIHdlIGhhdmUgdG8gY29tcGxldGUgdGhlIHJ1bm5pbmcgb25lLlxyXG4gICAgICAgICAgICAgIC8vIFdlJ3JlIHNpbXBseSBjb21wbGV0aW5nIHRoZSBydW5uaW5nIG9uZSBhbmQgbm90IGVtaXR0aW5nIGFueSB2YWx1ZXMgYW5kIG1lcmdpbmcgbmV3bHkgcHJvdmlkZWQgY29udGV4dFxyXG4gICAgICAgICAgICAgIC8vIHdpdGggdGhlIG9uZSBjb21pbmcgZnJvbSBjdXJyZW50bHkgcnVubmluZyB0cmFuc2l0aW9uLlxyXG4gICAgICAgICAgICAgIGNhc2UgJ3N0b3AnOlxyXG4gICAgICAgICAgICAgICAgem9uZS5ydW4oKCkgPT4gcnVubmluZy50cmFuc2l0aW9uJC5jb21wbGV0ZSgpKTtcclxuICAgICAgICAgICAgICAgIGNvbnRleHQgPSBPYmplY3QuYXNzaWduKHJ1bm5pbmcuY29udGV4dCwgY29udGV4dCk7XHJcbiAgICAgICAgICAgICAgICBydW5uaW5nVHJhbnNpdGlvbnMuZGVsZXRlKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gUnVubmluZyB0aGUgc3RhcnQgZnVuY3Rpb25cclxuICAgICAgICAgIGNvbnN0IGVuZEZuID0gc3RhcnRGbihlbGVtZW50LCBvcHRpb25zLmFuaW1hdGlvbiwgY29udGV4dCkgfHwgbm9vcEZuO1xyXG5cclxuICAgICAgICAgIC8vIElmICdwcmVmZXItcmVkdWNlZC1tb3Rpb24nIGlzIGVuYWJsZWQsIHRoZSAndHJhbnNpdGlvbicgd2lsbCBiZSBzZXQgdG8gJ25vbmUnLlxyXG4gICAgICAgICAgLy8gSWYgYW5pbWF0aW9ucyBhcmUgZGlzYWJsZWQsIHdlIGhhdmUgdG8gZW1pdCBhIHZhbHVlIGFuZCBjb21wbGV0ZSB0aGUgb2JzZXJ2YWJsZVxyXG4gICAgICAgICAgLy8gSW4gdGhpcyBjYXNlIHdlIGhhdmUgdG8gY2FsbCB0aGUgZW5kIGZ1bmN0aW9uLCBidXQgY2FuIGZpbmlzaCBpbW1lZGlhdGVseSBieSBlbWl0dGluZyBhIHZhbHVlLFxyXG4gICAgICAgICAgLy8gY29tcGxldGluZyB0aGUgb2JzZXJ2YWJsZSBhbmQgZXhlY3V0aW5nIGVuZCBmdW5jdGlvbnMgc3luY2hyb25vdXNseS5cclxuICAgICAgICAgIGlmICghb3B0aW9ucy5hbmltYXRpb24gfHwgd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbWVudCkudHJhbnNpdGlvblByb3BlcnR5ID09PSAnbm9uZScpIHtcclxuICAgICAgICAgICAgem9uZS5ydW4oKCkgPT4gZW5kRm4oKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvZih1bmRlZmluZWQpLnBpcGUocnVuSW5ab25lKHpvbmUpKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBTdGFydGluZyBhIG5ldyB0cmFuc2l0aW9uXHJcbiAgICAgICAgICBjb25zdCB0cmFuc2l0aW9uJCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XHJcbiAgICAgICAgICBjb25zdCBmaW5pc2hUcmFuc2l0aW9uJCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XHJcbiAgICAgICAgICBjb25zdCBzdG9wJCA9IHRyYW5zaXRpb24kLnBpcGUoZW5kV2l0aCh0cnVlKSk7XHJcbiAgICAgICAgICBydW5uaW5nVHJhbnNpdGlvbnMuc2V0KGVsZW1lbnQsIHtcclxuICAgICAgICAgICAgdHJhbnNpdGlvbiQsXHJcbiAgICAgICAgICAgIGNvbXBsZXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgZmluaXNoVHJhbnNpdGlvbiQubmV4dCgpO1xyXG4gICAgICAgICAgICAgIGZpbmlzaFRyYW5zaXRpb24kLmNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNvbnRleHRcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIGNvbnN0IHRyYW5zaXRpb25EdXJhdGlvbk1zID0gZ2V0VHJhbnNpdGlvbkR1cmF0aW9uTXMoZWxlbWVudCk7XHJcblxyXG4gICAgICAgICAgLy8gMS4gV2UgaGF2ZSB0byBib3RoIGxpc3RlbiBmb3IgdGhlICd0cmFuc2l0aW9uZW5kJyBldmVudCBhbmQgaGF2ZSBhICdqdXN0LWluLWNhc2UnIHRpbWVyLFxyXG4gICAgICAgICAgLy8gYmVjYXVzZSAndHJhbnNpdGlvbmVuZCcgZXZlbnQgbWlnaHQgbm90IGJlIGZpcmVkIGluIHNvbWUgYnJvd3NlcnMsIGlmIHRoZSB0cmFuc2l0aW9uaW5nXHJcbiAgICAgICAgICAvLyBlbGVtZW50IGJlY29tZXMgaW52aXNpYmxlIChleC4gd2hlbiBzY3JvbGxpbmcsIG1ha2luZyBicm93c2VyIHRhYiBpbmFjdGl2ZSwgZXRjLikuIFRoZSB0aW1lclxyXG4gICAgICAgICAgLy8gZ3VhcmFudGVlcywgdGhhdCB3ZSdsbCByZWxlYXNlIHRoZSBET00gZWxlbWVudCBhbmQgY29tcGxldGUgJ25nYlJ1blRyYW5zaXRpb24nLlxyXG4gICAgICAgICAgLy8gMi4gV2UgbmVlZCB0byBmaWx0ZXIgdHJhbnNpdGlvbiBlbmQgZXZlbnRzLCBiZWNhdXNlIHRoZXkgbWlnaHQgYnViYmxlIGZyb20gc2hvcnRlciB0cmFuc2l0aW9uc1xyXG4gICAgICAgICAgLy8gb24gaW5uZXIgRE9NIGVsZW1lbnRzLiBXZSdyZSBvbmx5IGludGVyZXN0ZWQgaW4gdGhlIHRyYW5zaXRpb24gb24gdGhlICdlbGVtZW50JyBpdHNlbGYuXHJcbiAgICAgICAgICB6b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgdHJhbnNpdGlvbkVuZCQgPVxyXG4gICAgICAgICAgICAgICAgZnJvbUV2ZW50KGVsZW1lbnQsICd0cmFuc2l0aW9uZW5kJykucGlwZSh0YWtlVW50aWwoc3RvcCQpLCBmaWx0ZXIoKHt0YXJnZXR9KSA9PiB0YXJnZXQgPT09IGVsZW1lbnQpKTtcclxuICAgICAgICAgICAgY29uc3QgdGltZXIkID0gdGltZXIodHJhbnNpdGlvbkR1cmF0aW9uTXMgKyB0cmFuc2l0aW9uVGltZXJEZWxheU1zKS5waXBlKHRha2VVbnRpbChzdG9wJCkpO1xyXG5cclxuICAgICAgICAgICAgcmFjZSh0aW1lciQsIHRyYW5zaXRpb25FbmQkLCBmaW5pc2hUcmFuc2l0aW9uJCkucGlwZSh0YWtlVW50aWwoc3RvcCQpKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgIHJ1bm5pbmdUcmFuc2l0aW9ucy5kZWxldGUoZWxlbWVudCk7XHJcbiAgICAgICAgICAgICAgem9uZS5ydW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZW5kRm4oKTtcclxuICAgICAgICAgICAgICAgIHRyYW5zaXRpb24kLm5leHQoKTtcclxuICAgICAgICAgICAgICAgIHRyYW5zaXRpb24kLmNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIHRyYW5zaXRpb24kLmFzT2JzZXJ2YWJsZSgpO1xyXG4gICAgICAgIH07XHJcblxyXG5leHBvcnQgY29uc3QgbmdiQ29tcGxldGVUcmFuc2l0aW9uID0gKGVsZW1lbnQ6IEhUTUxFbGVtZW50KSA9PiB7XHJcbiAgcnVubmluZ1RyYW5zaXRpb25zLmdldChlbGVtZW50KSA/LmNvbXBsZXRlKCk7XHJcbn07XHJcbiJdfQ==