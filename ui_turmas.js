function UI_turmas(id, height)
{
    var self = this;

    var current_materia = null;
    var current_turma = null;
    var insert_before = null;

    list = document.getElementById(id);

    var thiswidth = 330;

    list.style.border = "1px solid black";
    list.style.width  = thiswidth + "px";
    list.style.height    = (height-2) + "px";
    list.style.maxHeight = (height-2) + "px";

    function onmouseup() {
        var checkboxes = this.parentNode.getElementsByTagName("td")[0].getElementsByTagName("input");
        var at_least_one_selected = 0;
        for (var i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].checked) {
                at_least_one_selected = 1;
                break;
            }
        }
        for (var i = 0; i < checkboxes.length; i++) {
            var split   = checkboxes[i].value.split(" ");
            self.cb_changed(split[0], split[1], !at_least_one_selected);
            checkboxes[i].checked = !at_least_one_selected;
        }
        self.cb_updated();
    }
    function edit_start(turma) {
        current_turma = turma;
        var row = current_turma.row;
        row.style.backgroundColor = "black";
        row.style.color           = "white";
        self.ok_button.style.display = "";
        self.cancel_button.style.display = "";
    }
    function edit_end() {
        if (current_turma) {
            var row = current_turma.row;
            row.style.backgroundColor = current_materia.cor;
            row.style.color           = "black";
            self.ok_button.style.display = "none";
            self.cancel_button.style.display = "none";
        }
    }
    function remove_turma(turma) {
        var row = turma.row;
        row.parentNode.removeChild(row);
    }
    function remove() {
        var row = this.parentNode;
        var turma = row.turma;
        self.cb_remove_turma(turma);
    }
    function editar() {
        var row = this.parentNode;
        var turma = row.turma;
        self.cb_edit_turma(turma);
    }
    function hover_off() { this.style.backgroundColor = this.oldbg; this.style.color = "black"; };
    function hover_on()  { this.style.backgroundColor = "black"; this.style.color = this.oldbg; };
    function new_turma(horario) {
        var row  = document.createElement("tr");
        row.style.backgroundColor = current_materia.cor;
        row.style.cursor="pointer";
        row.onmouseover = function() { self.cb_onmouseover(this.turma); }
        row.onmouseout  = function() { self.cb_onmouseout(this.turma); }

        var data = document.createElement("td");
        for (var j in horario.turmas) {
            var turma = horario.turmas[j];
            var input = document.createElement("input");
            input.type     = "checkbox";
            input.value    = current_materia.codigo + " " + turma.turma;
            turma_onchange = function() {
                var split = this.value.split(" ");
                self.cb_changed(split[0], split[1], this.checked);
                self.cb_updated();
            };
            input.onchange = turma_onchange;
            if (navigator.userAgent.toLowerCase().indexOf("msie") > -1) {
                input.onclick = function() { this.blur() };
            }
            data.appendChild(input);
            input.checked  = turma.selected;
        }
        data.style.width = "22px";
        row.appendChild(data);

        var data = document.createElement("td");
        data.onmouseup = onmouseup;
        var innerHTML = new String();
        for (var j in horario.turmas) {
            var turma = horario.turmas[j];
            innerHTML += turma.turma + "<br>";
            if (!row.turma) {
                row.turma = turma;
                turma.row = row;
            }
        }
        data.innerHTML = innerHTML;
        data.style.width = "44px";
        row.appendChild(data);

        var data = document.createElement("td");
        if (current_materia.editavel) {
            data.onmouseup = editar;
            data.style.textAlign = "center";
            var innerHTML = ">>>> edite hor\u00e1rio aqui <<<<";
        } else {
            data.onmouseup = onmouseup;
            var innerHTML = new String();
            for (var j in horario.turmas) {
                var turma = horario.turmas[j];
                innerHTML += turma.professor + "<br>";
            }
        }
        data.innerHTML = innerHTML;
        row.appendChild(data);

        var data = document.createElement("td");
        data.style.MozUserSelect = "none";
        data.style.KhtmlUserSelect = "none";
        data.onselectstart = function () { return false; };
        data.style.color = "black";
        data.oldbg = current_materia.cor;
        data.onmouseout  = hover_off;
        data.onmouseover = hover_on;
        data.onclick = editar;
        data.innerHTML = "E";
        data.style.width = "15px";
        data.style.textAlign = "center";
        row.appendChild(data);

        var data = document.createElement("td");
        data.style.MozUserSelect = "none";
        data.style.KhtmlUserSelect = "none";
        data.onselectstart = function () { return false; };
        data.style.color = "black";
        data.oldbg = current_materia.cor;
        data.onmouseout  = hover_off;
        data.onmouseover = hover_on;
        data.onclick = remove;
        data.innerHTML = "X";
        data.style.width = "15px";
        data.style.textAlign = "center";
        row.appendChild(data);

        self.tbody.insertBefore(row, insert_before);

        /* TODO determine scrollbar width */
        if (self.table.offsetHeight >= list.offsetHeight)
            self.table.style.width="310px";
    }
    var create = function(materia) {
        list.innerHTML = "";
        insert_before = null;

        current_materia = materia;

        self.table = document.createElement("table");
        self.tbody = document.createElement("tbody");
        self.table.className = "materias";
        self.table.style.width="330px";
        self.table.cellPadding="1";
        self.table.cellSpacing="1";

        for (var i in current_materia.horarios) {
            var horario = current_materia.horarios[i];
            new_turma(horario);
        }
        var row  = document.createElement("tr");
        row.style.backgroundColor = current_materia.cor;
        row.materia = current_materia;

        var data = document.createElement("td");
        data.colSpan = "5";
        data.style.cursor = "pointer";
        data.style.textAlign = "center";
        data.onmouseup = function() { self.cb_new_turma(); };
        data.style.fontSize = "13px"
        data.innerHTML = ">>>> adicione turmas aqui <<<<";
        row.appendChild(data);

        self.tbody.appendChild(row);
        insert_before = row;

        if (current_materia.editavel) {
            var row  = document.createElement("tr");
            row.style.backgroundColor = current_materia.cor;
            var data = document.createElement("td");
            data.colSpan = "5";
            data.style.textAlign = "center";
            data.innerHTML = "O suporte para atividades gen\u00e9ricas ainda est\u00e1 em fase experimental. " +
                             "Certifique-se que a turma que voc\u00ea vai editar esteja na sele\u00e7\u00e3o atual.";
            row.appendChild(data);

            self.tbody.appendChild(row);
        }

        var button = document.createElement("span");
        button.style.display = "none";
        button.style.position = "absolute";
        button.style.zIndex = "2000";
        button.style.MozUserSelect = "none";
        button.style.KhtmlUserSelect = "none";
        button.style.border = "1px solid black";
        button.style.backgroundColor = "lightblue";
        button.style.top = "50%";
        button.style.textAlign = "center";
        button.style.fontFamily = "monospace";
        button.style.fontSize = "20px";
        button.style.marginLeft = ((thiswidth/2) - 100) + "px";
        button.style.width = "100px";
        button.style.cursor = "pointer";
        button.innerHTML = "<strong>OK</strong>";
        button.onselectstart = function () { return false; };
        button.onclick = function () { self.cb_ok(); return false; };
        list.appendChild(button);
        self.ok_button = button;

        var button = document.createElement("span");
        button.style.display = "none";
        button.style.position = "absolute";
        button.style.zIndex = "2000";
        button.style.MozUserSelect = "none";
        button.style.KhtmlUserSelect = "none";
        button.style.border = "1px solid black";
        button.style.backgroundColor = "lightblue";
        button.style.top = "50%";
        button.style.textAlign = "center";
        button.style.fontFamily = "monospace";
        button.style.fontSize = "20px";
        button.style.marginLeft = ((thiswidth/2)) + "px";
        button.style.width = "100px";
        button.style.cursor = "pointer";
        button.innerHTML = "<strong>Cancelar</strong>";
        button.onselectstart = function () { return false; };
        button.onclick = function () { self.cb_cancel(); return false; };
        list.appendChild(button);
        self.cancel_button = button;

        self.table.appendChild(self.tbody);
        list.appendChild(self.table);

        /* TODO determine scrollbar width */
        if (self.table.offsetHeight >= list.offsetHeight)
            self.table.style.width="310px";
    }

    self.old_cb_onmouseover = null;
    self.old_cb_onmouseout  = null;

    /* procedures */
    self.create = create;
    self.reset = function() { list.innerHTML = ""; insert_before = null; };
    self.new_turma = new_turma;
    self.remove_turma = remove_turma;
    self.edit_start = edit_start;
    self.edit_end   = edit_end;
    /* callbacks */
    self.cb_edit_turma   = null;
    self.cb_remove_turma = null;
    self.cb_new_turma    = null;
    self.cb_onmouseover  = null;
    self.cb_onmouseout   = null;
    self.cb_updated      = null;
    self.cb_changed      = null;
    self.cb_ok           = null;
    self.cb_cancel       = null;
}
