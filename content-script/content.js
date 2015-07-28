/*
  The DOM attribute name that indicates a network playable
  media stream e.g.
  <div data-mediascape-playable-stream="http://example.com/radio-stream">
*/
var MEDIASCAPE_ATTRIBUTE_NAME = 'data-mediascape-playable-stream';

/*
  Attach a mutation observer to the entire document.
  When an attribute is changed, the callback is fired.
*/
var observer = new MutationObserver(attributeChangeObserver);
observer.observe(document.body, {
  attributes: true,
  subtree: true
});

init();

/*
  Capture any playable elements in the page
  on startup
*/
function init() {
  // Attach listens to anything in the page on load
  _.forEach(
    document.querySelectorAll('[' + MEDIASCAPE_ATTRIBUTE_NAME + ']'),
    attachEventHandlerForEl
  );
}

/*
  Attaches event handler to all elements that
  have the MEDIASCAPE_ATTRIBUTE_NAME attribute
*/
function attributeChangeObserver(mutations) {

  var changes = _.filter(mutations, isInterestingMutation);
  if (changes.length > 0) {
    console.log('changes', changes);
  }

  // target is the DOM elemenet containing
  // the attribute
  _.pluck(changes, 'target')
   .forEach(attachEventHandlerForEl)
}

/*
  Attach a click event handler that attempts to
  play the given stream when it's clicked
*/
function attachEventHandlerForEl(el) {
  console.log('attachEventHandlerForEl', el);
  el.addEventListener('click', function (evt) {
    var url = el.getAttribute(MEDIASCAPE_ATTRIBUTE_NAME);
    mediascape.play(url)
              .then(
                function (data) { console.log('Play - success', data);  },
                function (data) { console.warn('Play - failure', data); }
              );
  });
}

/*
  A mutation is interesting if:
    - an attribute has changed
    - the attribute is a mediascape one
*/
function isInterestingMutation(mutation) {
  var isInteresting = true;

  if (mutation.type !== 'attributes') {
    isInteresting = false;
  }

  if (mutation.attributeName !== MEDIASCAPE_ATTRIBUTE_NAME) {
    isInteresting = false;
  }

  return isInteresting;
}
