function main() {
  var statusElement = document.getElementById('status');
  var ageElement = document.getElementById('age');
  var lastModifiedTimestamp = null;
  var pageName = getPageName();

  function update() {
    // The main function that's executed every X seconds.
    // Make a request for the source data. Get the HEAD to check if it's changed, and only if it
    // has, make the full request. Saves bandwidth when we're getting a long job list every 10 sec.
    // Add timestamp to url to make sure response isn't cached.
    makeRequest('HEAD', checkAgeAndUpdate, pageName+'.txt?time='+Date.now());
    // Give it 5 seconds, then make sure the age warning is updated, whether or not the request
    // succeeds.
    window.setTimeout(updateAge, 5*1000);
  }

  function checkAgeAndUpdate() {
    // Check the Last-Modified header, and if it's new, make the full request for the data.
    var newLastModifiedTimestamp = getAge(ageElement, this.getResponseHeader('Last-Modified'));
    if (newLastModifiedTimestamp > lastModifiedTimestamp) {
      makeRequest('GET', updateStatus, pageName+'.txt?time='+Date.now());
    }
  }

  function updateStatus() {
    // Insert the new data into the page and update its age.
    // Called once the XMLHttpRequest has gotten a response.
    statusElement.textContent = this.responseText;
    lastModifiedTimestamp = getAge(ageElement, this.getResponseHeader('Last-Modified'));
    updateAge();
  }

  function updateAge() {
    // Update the data's age.
    displayAge(ageElement, lastModifiedTimestamp);
  }

  update();
  window.setInterval(update, 10*1000);
}

function getPageName() {
  var fields = window.location.pathname.split('/');
  var base = fields[fields.length-1];
  fields = base.split('.');
  return fields[0];
}

function makeRequest(method, callback, url) {
  var request = new XMLHttpRequest();
  request.addEventListener('load', callback);
  // Add timestamp to url to make sure response isn't cached.
  request.open(method, url);
  request.send();
}

function getAge(ageElement, lastModified) {
  if (!lastModified) {
    ageElement.textContent = 'Warning: Information of unknown age!';
    ageElement.style.color = 'red';
  }
  return Date.parse(lastModified);
}

function displayAge(ageElement, lastModifiedTimestamp) {
  if (!lastModifiedTimestamp) {
    ageElement.textContent = 'Warning: information of unknown age!';
    ageElement.style.color = 'red';
  }
  var lastModifiedDate = new Date(lastModifiedTimestamp);
  var age = (Date.now() - lastModifiedDate.getTime())/1000;
  if (age > 2*60) {
    ageElement.textContent = 'Warning: This information is '+humanTime(age)+' old!';
    ageElement.style.color = 'red';
  } else {
    ageElement.textContent = humanTime(age)+' ago';
    ageElement.style.color = 'inherit';
  }
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

window.addEventListener('load', main);
