var xhr = (function () {
  'use strict';

  // xhr.get(), xhr.post() convenience methods
  ['get', 'post', 'put', 'delete'].forEach(function (method) {
    request[method] = requestWithMethod(method);
  });

  function requestWithMethod(method) {
    return function (url, params) {
      return request(method, url, params);
    };
  }

  // Core xhr method
  function request(method, url, params) {
    // Return a new promise.
    return new Promise(function(resolve, reject) {
      // Do the usual XHR stuff
      var req = new XMLHttpRequest();
      req.open(method.toUpperCase(), url);

      req.onload = function() {
        // This is called even on 404 etc
        // so check the status
        if (req.status == 200) {
          // Resolve the promise with the response text
          resolve(req.response);
        }
        else {
          // Otherwise reject with the status text
          // which will hopefully be a meaningful error
          reject(Error(req.statusText));
        }
      };

      // Handle network errors
      req.onerror = function() {
        reject(Error("Network Error"));
      };

      // Make the request
      req.send();
    });
  }

  return request;
})();
