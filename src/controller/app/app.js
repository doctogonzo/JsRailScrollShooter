(function() {
    "use strict";

    var key = getQueryVariable('id');
    var controllerConnection = key ? new window.webRtcSlave(key) : null;

    $(function() {
        var fullScreenBtn = $('#moveFullScreen').click(function goFullScreen() {
            var elem = document.getElementById('screen');
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            }
            fullScreenBtn.remove();
        });

        var indicators = {
            x: document.getElementById('gyro_x'),
            y: document.getElementById('gyro_y'),
            z: document.getElementById('gyro_z'),
            alpha: document.getElementById('gyro_alpha'),
            beta: document.getElementById('gyro_beta'),
            gamma: document.getElementById('gyro_gamma'),
            vx: document.getElementById('vx'),
            vy: document.getElementById('vy'),
            vz: document.getElementById('vz'),
            key: document.getElementById('key')
        };

        indicators.key.innerHTML = key;

        var viewPointCalculator = new window.viewPointCalculator(),
            trackRes = null,
            callibrationPt = null,
            state = 'calibration';

        controllerConnection.subscribe('initState', function (key, message) {
            if (!message)// || message.response !== 'calibration-next')
                return;
            switch (message.response) {
                case 'calibration-next': {
                    callibrationPt = message.data;
                } break;
                case 'calibration-finished': {
                    state = 'play';
                } break;
            }
        });
        controllerConnection.sendMessage('initState', {request: 'calibration-start'});

        $('#screen').click(function() {
            switch (state) {
                case 'calibration': {
                    if (!trackRes || !callibrationPt)
                        return;
                    viewPointCalculator.addCalibration(
                        callibrationPt.x,
                        callibrationPt.y,
                        trackRes);
                    callibrationPt = null;

                    controllerConnection.sendMessage('initState', {request: 'calibration-next'});
                } break;
            }
        });

        var promise = new FULLTILT.getDeviceOrientation({ 'type': 'world' });

        // FULLTILT.DeviceOrientation instance placeholder
        var deviceOrientation;

        promise
            .then(function(controller) {
                // Store the returned FULLTILT.DeviceOrientation object
                deviceOrientation = controller;
            })
            .catch(function(message) {
                console.error(message);

                // Optionally set up fallback controls...
                // initManualControls();
            });

        (function draw() {

            // If we have a valid FULLTILT.DeviceOrientation object then use it
            if (deviceOrientation) {
                trackRes = deviceOrientation.getScreenAdjustedEuler();

                var v = viewPointCalculator.getVector(trackRes);
                indicators['vx'].innerHTML = v.x;
                indicators['vy'].innerHTML = v.y;
                indicators['vz'].innerHTML = v.z;

                switch (state) {
                    case 'calibration': {

                    } break;
                    default: {
                        controllerConnection.sendMessage('indicatorState', viewPointCalculator.getPoint(trackRes));
                    }
                }
            }
            requestAnimationFrame(draw);

        })();

        //window.addEventListener('devicemotion', function(obj) {
        //    trackRes = obj;
        //    var v = viewPointCalculator.getVector(obj.rotationRate);
        //    indicators['vx'].innerHTML = v.x;
        //    indicators['vy'].innerHTML = v.y;
        //    indicators['vz'].innerHTML = v.z;
        //
        //    switch (state) {
        //        case 'calibration': {
        //
        //        } break;
        //        default: {
        //            controllerConnection.sendMessage('indicatorState', viewPointCalculator.getPoint(obj.rotationRate));
        //        }
        //    }
        //}, true);

        //window.addEventListener('devicemotion', function(obj) {
        //    trackRes = obj;
        //
        //    indicators['x'].innerHTML = JSON.stringify(obj);
        //    var v = viewPointCalculator.getVector(obj.rotationRate);
        //    indicators['vx'].innerHTML = v.x;
        //    indicators['vy'].innerHTML = v.y;
        //    indicators['vz'].innerHTML = v.z;
        //
        //    switch (state) {
        //        case 'calibration': {
        //
        //        } break;
        //        default: {
        //            controllerConnection.sendMessage('indicatorState', viewPointCalculator.getPoint(obj));
        //        }
        //    }
        //});

        //gyro.frequency = 1;
        //gyro.startTracking(function(obj) {
        //    trackRes = obj;
        //    for (var id in indicators) {
        //        if (!indicators.hasOwnProperty(id) || !indicators[id] || !obj.hasOwnProperty(id))
        //            continue;
        //        indicators[id].innerHTML = obj[id];
        //    }
        //    var v = viewPointCalculator.getVector(obj);
        //    indicators['vx'].innerHTML = v.x;
        //    indicators['vy'].innerHTML = v.y;
        //    indicators['vz'].innerHTML = v.z;
        //
        //    switch (state) {
        //        case 'calibration': {
        //
        //        } break;
        //        default: {
        //            controllerConnection.sendMessage('indicatorState', viewPointCalculator.getPoint(obj));
        //        }
        //    }
        //});
    });

    function getQueryVariable(variable)
    {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            if(pair[0] == variable){return decodeURIComponent(pair[1]);}
        }
        return(false);
    }

})();