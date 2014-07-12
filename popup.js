// Run our kitten generation script as soon as the document's DOM is ready.
document.addEventListener('DOMContentLoaded', function () {
  display('Searching...');
});

function display(msg) {
  var el = document.body;
  el.innerHTML = msg;
}

chrome.runtime.getBackgroundPage(displayMessages);

function displayMessages(backgroundPage) {
  var html = '<ul>';
  html += backgroundPage.services.map(function (service) {
    return '<li class="service">' 
            + service.name 
            + '<span class="host">' 
            +   service.host + ':' + service.port
            + '</span>' 
           '</li>';
  }).join('');
  html += '</ul>';
  display(html);
}