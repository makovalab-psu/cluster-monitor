function init() {
  var statusElement = document.getElementById('status');
  var alertElement = document.getElementById('alert');

  var pageName = getPageName();

  function update() {
    var request = new XMLHttpRequest();
    request.addEventListener('load', updateStatus);
    // Add timestamp to url to make sure response isn't cached.
    request.open('GET', pageName+'.txt?time='+Date.now());
    request.send();
  }

  function updateStatus() {
    alertAge(this.getResponseHeader('Last-Modified'));
    statusElement.textContent = this.responseText;
  }

  function alertAge(lastModified) {
    if (!lastModified) {
      alertElement.textContent = '';
    }
    var lastModifiedTimestamp = Date.parse(lastModified);
    if (!lastModifiedTimestamp) {
      alertElement.textContent = '';
    }
    var lastModifiedDate = new Date(lastModifiedTimestamp);
    var age = Date.now() - lastModifiedDate.getTime();
    if (age > 2*60*1000) {
      alertElement.textContent = 'Warning: This information is old!';
    } else {
      alertElement.textContent = '';
    }
  }

  update();
  window.setInterval(update, 60000);
}

function getPageName() {
  var fields = window.location.pathname.split('/');
  var base = fields[fields.length-1];
  fields = base.split('.');
  return fields[0];
}

window.addEventListener('load', init);
