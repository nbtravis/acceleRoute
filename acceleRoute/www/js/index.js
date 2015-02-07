/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
 var maxHistorySize = 20;
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0;i<ca.length;i++) {
        var c = ca[i];
        while(c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name)==0) return c.substring(name.length, c.length);

    }
    return "";
}

function getHistory() {
    var curr_string = getCookie("searches");
    if (curr_string=="") return [];
    else return JSON.parse(curr_string);

}

function addToHistory(search) {
   
    history = getHistory();
    if (history.indexOf(search)==-1) {
        history = [search].concat(history);
        if (history.length > maxHistorySize)
            history = history.slice(0, maxHistorySize);
        setCookie("searches", JSON.stringify(history), 10);
    }
    return;


}
var currLocationString = "";
function getLocation() {
    navigator.geolocation.getCurrentPosition(
        function(position) {
            currLocationString = position.coords.latitude
                + ", " + position.coords.longitude;
        }

    );
}

function findRoute() {
    var S = document.getElementById('pos').value;
    var T = document.getElementById('dest').value;
    if (S=="Current Location") {
        getLocation();
        S = currLocationString;
    } else {
        addToHistory(S);
    }
    if (T == "Current Location") {
        getLocation();
        T = currLocationString;
    }
    else
        addToHistory(T);

    //TODO : send query to Azure
}
