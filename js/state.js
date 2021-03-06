/**
 * A singleton class representing the state.
 * 
 * @Constructor
 *
 * @example
 *  var stateExemple = {
 *    version: 7,
 *    lastColor: 0,
 *    activePlanIndex: 0,
 *    plans: [{@link Plan}]
 *  }
 *
 * @see Plan
 */
function State(jsonObj) {
  this.plans = new Array();
  this.numColors = 10; // represents the number of colors on system
  this.lastColor = 0;

  this.html = {
    previousCombination: document.getElementsByClassName('combination-button-left')[0],
    nextCombination: document.getElementsByClassName('combination-button-right')[0],
    upload: document.getElementById('upload-input'),
    download: document.getElementById('download'),
    save: document.getElementById('save-button'),
    load: document.getElementById('load-button'),
    identifier: document.getElementById('user-identifier')
  }
  this.addEventListeners();

  // variable set on main.js
  this.version = matrusp_current_state_version;
  this.activePlanIndex = 0;

  var isActivePlan = false;
  for (var i = 0; i < 3; i++) {
    if (i == 0) {
      var isActivePlan = true;
    }
    this.plans.push(new Plan(null, i, isActivePlan));
  }

  this.load(jsonObj);
}

State.prototype.delete = function() {
  while (this.plans.length) {
    this.plans[0].delete();
  }
}

/**
 * Clears the current state
 */
State.prototype.clear = function() {
  for (var i = 0; i < this.plans.length; i++) {
    this.plans[i].clear();
  }
}

/**
 * Load state data
 *
 * @param {baseState} BaseState State or json data to load
 */
State.prototype.load = function(baseState) {
  if (baseState) {
    if (baseState.version == 6) {
      var newState = {};
      newState.version = 7;
      newState.plans = [];
      newState.activePlanIndex = baseState.activePlanIndex;
      baseState.plans.forEach(plan => {
        if (!plan) return;
        var planData = {};
        planData.activeCombinationIndex = plan.activeCombinationIndex;
        planData.lectures = [];
        plan.lectures.forEach(lecture => {
          var lectureData = {};
          lectureData.code = lecture.code;
          lectureData.color = lecture.color;
          lectureData.selected = lecture.selected;
          lectureData.classrooms = [];

          lecture.classrooms.forEach(classroom => {
            if (classroom.selected)
              lectureData.classrooms.push('20181' + classroom.classroomCode);
          });

          planData.lectures.push(lectureData);
        });
        newState.plans.push(planData);
      });
      return this.load(newState);
    }
    if (!baseState.version || baseState.version < matrusp_current_state_version) {
      // if the state being loaded is not updated, don't load.
      ui.showBanner('Este identificador não é mais válido.');
      return false;
    }
    this.lastColor = baseState.lastColor || 0;
    this.version = baseState.version;
    this.activePlanIndex = baseState.activePlanIndex;

    for (var i = 0; i < 3; i++) {
      if (i == this.activePlanIndex) {
        var isActivePlan = true;
        this.plans[i].load(baseState.plans[i], isActivePlan);
      } else {
        this.plans[i].load(baseState.plans[i]);
      }
    }
    // TODO this is a hack to update the combination index and total combination number
    // ui below div#lecture-schedule
    if (this.plans[this.activePlanIndex].lectures.length == 0) {
      //document.getElementById('combination-value').innerHTML = '0/0';
    } else {
      this.plans[this.activePlanIndex].setActiveCombination();
    }
    return true;
  }
  return false;
}

/**
 * Clears the state and loads a new one
 *
 * @param {baseState} BaseState State or json data to load
 */
State.prototype.reload = function(baseState) {
  this.clear();
  this.load(baseState);
}

/**
 * Adds a lecture to the current active plan if no planIndex was given.
 *
 * @param {Lecture} lecture
 * @param {Number} [planIndex]
 */
State.prototype.addLecture = function(lecture, planIndex) {
  if (planIndex == null) {
    planIndex = this.activePlanIndex;
  }
  this.plans[planIndex].addLecture(lecture);
};

/**
 * Selects the next combination in the active plan.
 */
State.prototype.nextCombination = function() {
  this.plans[this.activePlanIndex].nextCombination();
}

/**
 * Selects the previous combination in the active plan.
 */
State.prototype.previousCombination = function() {
  this.plans[this.activePlanIndex].previousCombination();
}

/**
 * Downloads the state as serialized JSON file.
 */
State.prototype.downloadFile = function() {
  var dataString = "data:text/json;charset=utf-8," + encodeURIComponent(this.toJSON());
  var element = document.createElement('a');
  element.setAttribute("href", dataString);
  element.style.display = 'none';
  if (document.getElementById('user-identifier').value) {
    element.setAttribute('download', document.getElementById('user-identifier').value + '.json');
  } else {
    element.setAttribute('download', 'matrusp_' + (new Date).getFullYear() + '.json');
  }
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

State.prototype.addEventListeners = function() {
  this.html.previousCombination.addEventListener('click', this.previousCombination.bind(this));
  this.html.nextCombination.addEventListener('click', this.nextCombination.bind(this));
  this.html.download.addEventListener('click', this.downloadFile.bind(this));
  this.html.save.addEventListener('click', () => this.saveOnServer(this.html.identifier.value));
  this.html.load.addEventListener('click', () => this.loadFromServer(this.html.identifier.value));
};

/**
 * Saves the state on the server as a serialized JSON file.
 *
 * @param {identifier} Identifier The identifier that will point to this state on the server
 */
State.prototype.saveOnServer = function(identifier) {
  if (!identifier || identifier == '') {
    ui.showBanner('É necessário preencher o nome do identificador', 2000);
    return;
  }

  fetch(`./php/save.php?identifier=${encodeURIComponent(identifier)}`, {
    method: 'POST',
    body: `data=${encodeURIComponent(this.toJSON())}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    }
  }).then(response => {
    if (response.ok) {
      ui.showBanner(`Identificador "${identifier}" salvo com sucesso`, 2000);
      fetch(`./data/${identifier}.json`); //Fetch from server to save on cache
    }
    else
      ui.showBanner('Algum erro ocorreu, salve o identificador novamente', 2000);
  }).catch(error => {
    ui.showBanner('Algum erro ocorreu, salve o identificador novamente', 2000);
    throw error;
  });
}

/**
 * Serialize state as a JSON string
 */
State.prototype.toJSON = function() {
  var stateData = {};
  stateData.version = this.version;
  stateData.lastColor = this.lastColor;
  stateData.plans = [];
  stateData.activePlanIndex = this.activePlanIndex;
  this.plans.forEach(plan => {
    var planData = {};
    planData.activeCombinationIndex = plan.activeCombinationIndex;
    planData.lectures = [];
    plan.lectures.forEach(lecture => {
      var lectureData = {};
      lectureData.code = lecture.code;
      lectureData.color = lecture.color;
      lectureData.selected = lecture.selected;
      lectureData.classrooms = [];

      lecture.classrooms.forEach(classroom => {
        if (classroom.selected)
          lectureData.classrooms.push(classroom.code);
      });

      planData.lectures.push(lectureData);
    });
    stateData.plans.push(planData);
  });
  return JSON.stringify(stateData);
}

/**
 * Loads the state from the server.
 *
 * @param {identifier} Identifier The identifier to fetch on the server
 */
State.prototype.loadFromServer = function(identifier) {
  if (!identifier || identifier == '') {
    ui.showBanner('É necessário preencher o nome do identificador', 2000);
    return;
  }
  fetch(`data/${identifier.replace(/[^\w]/g, '')}.json`).then(response => {
    if (response.ok)
      response.json().then(json => {
        this.reload(json);
        ui.showBanner(`Identificador "${identifier}" carregado com sucesso`, 2000);
      });
    else
    if (response.status === 404)
      ui.showBanner('Identificador não encontrado no servidor', 2000);
    else
      ui.showBanner('Não foi possível carregar o identificador. Tente novamente', 2000);
  }).catch(error => {
    ui.showBanner('Não foi possível carregar o identificador. Tente novamente', 2000);
    throw error
  });
}