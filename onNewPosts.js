/**
 * Monitor the DOM for changes to the HTML
 */

const observeDOM = (function() {
  const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  return function( element, handler ){
    if( !element || element.nodeType !== 1 ) return; 

    if( MutationObserver ){
      const mutationObserver = new MutationObserver(handler)
      mutationObserver.observe( element, { childList:true, subtree:true })
      return mutationObserver
    }
    else if( window.addEventListener ){
      element.addEventListener('DOMNodeInserted', handler, false)
      element.addEventListener('DOMNodeRemoved', handler, false)
    }
  }
})();

function createChangeHandler(callback) {
  return function changeEventHandler(changeEvent) {
    changeEvent.forEach(record => {
      if (record.addedNodes.length > 0) {
        const newNodes = Array.from(record.addedNodes);
        newNodes.forEach(node => {
          callback(node);
        });
      }
    });
  }
}

function onNewPosts(element, callback) {
  const changeHandler = createChangeHandler(callback);
  return observeDOM(element, changeHandler);
}

function disconnectObserver(observer) {
  observer.disconnect();
}
