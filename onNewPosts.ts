/**
 * Monitor the DOM for changes to the HTML
 */

const observeDOM = (function() {
  const win = window as Window & typeof globalThis & {
    MutationObserver?: typeof MutationObserver;
    WebKitMutationObserver?: typeof MutationObserver;
    MozMutationObserver?: typeof MutationObserver;
  };
  const MutationObserverCtor = win.MutationObserver || win.WebKitMutationObserver || win.MozMutationObserver;
  return function(element: Element | null, handler: MutationCallback) {
    if (!element || element.nodeType !== 1) return;

    if (MutationObserverCtor) {
      const mutationObserver = new MutationObserverCtor(handler);
      mutationObserver.observe(element, { childList: true, subtree: true });
      return mutationObserver;
    }
    if (window.addEventListener) {
      element.addEventListener('DOMNodeInserted', handler as unknown as EventListener, false);
      element.addEventListener('DOMNodeRemoved', handler as unknown as EventListener, false);
    }
  };
})();

function createChangeHandler(callback: (node: Node) => void) {
  return function changeEventHandler(changeEvent: MutationRecord[]) {
    changeEvent.forEach((record) => {
      if (record.addedNodes.length > 0) {
        const newNodes = Array.from(record.addedNodes);
        newNodes.forEach((node) => {
          callback(node);
        });
      }
    });
  };
}

function onNewPosts(element: Element, callback: (node: Node) => void) {
  const changeHandler = createChangeHandler(callback);
  return observeDOM(element, changeHandler);
}

function disconnectObserver(observer: MutationObserver) {
  observer.disconnect();
}
