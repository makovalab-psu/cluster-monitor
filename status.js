function init() {
  var statusElement = document.getElementById('status');
  var ageElement = document.getElementById('age');

  var pageName = getPageName();

  function update() {
    var request = new XMLHttpRequest();
    request.addEventListener('load', updateStatus);
    // Add timestamp to url to make sure response isn't cached.
    request.open('GET', pageName+'.txt?time='+Date.now());
    request.send();
  }

  function updateStatus() {
    setAge(this.getResponseHeader('Last-Modified'));
    statusElement.textContent = this.responseText;
  }

  function setAge(lastModified) {
    if (!lastModified) {
      ageElement.textContent = '';
    }
    var lastModifiedTimestamp = Date.parse(lastModified);
    if (!lastModifiedTimestamp) {
      ageElement.textContent = '';
    }
    var lastModifiedDate = new Date(lastModifiedTimestamp);
    var age = (Date.now() - lastModifiedDate.getTime())/1000;
    if (age > 2*60) {
      ageElement.textContent = 'Warning: This information is '+humanTime(age)+' old!';
    } else {
      ageElement.textContent = '';
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

function humanTime(seconds) {
  if (seconds < 60) {
    return formatTime(seconds, 'second');
  } else if (seconds < 60*60) {
    return formatTime(seconds/60, 'minute');
  } else if (seconds < 24*60*60) {
    return formatTime(seconds/60/60, 'hour');
  } else if (seconds < 10*24*60*60) {
    return formatTime(seconds/60/60/24, 'day');
  } else if (seconds < 40*24*60*60) {
    return formatTime(seconds/60/60/24/7, 'week');
  } else if (seconds < 365*24*60*60) {
    return formatTime(seconds/60/60/24/30.5, 'month');
  } else {
    return formatTime(seconds/60/60/24/365, 'year');
  }
}

function formatTime(quantity, unit) {
  if (quantity < 10) {
    // Round to 1 decimal place if less than 10.
    var rounded = Math.round(quantity*10)/10;
  } else {
    // Round to a whole number if more than 10.
    var rounded = Math.round(quantity);
  }
  var output = rounded + ' ' + unit;
  if (rounded !== 1) {
    output += 's';
  }
  return output;
}

window.addEventListener('load', init);
