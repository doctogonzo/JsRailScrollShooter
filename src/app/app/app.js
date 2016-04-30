(function() {
    "use strict";

    var $cursorFiled = null;
    var players = {};
    function getPlayer(key){
        return players[key] || (players[key] = {
                calibrationState: 0,
                getPointer: function() {
                    if (this.pointer)
                        return this.pointer;
                    var res = this.pointer = $("<div></div>").addClass("user-pointer");
                    $cursorFiled.append(res);
                    this.centerX = res.width() / 2;
                    this.centerY = res.height() / 2;
                    return res;
                },
                getCalibrator: function() {
                    return this.getPointer().addClass("user-calibrator");
                },
                hideCalibrator: function() {
                    return this.getPointer().removeClass("user-calibrator");
                },
                setPos: function(x, y) {
                    this.getPointer().offset({
                        left: x - this.centerX,
                        top: y - this.centerY
                    });
                }
            });
    }

    var controllerConnection = new window.webRtcMaster();

    $(function() {
        var $document = $(document);
        $cursorFiled = $('#cursor-filed');
        var calibrationPoints = [
            {
                x: 0,
                y: $document.height()
            },
            {
                x: 0,
                y: 0
            },
            {
                x: $document.width(),
                y: 0
            }
            //{
            //    x: $document.width(),
            //    y: $document.height()
            //},
            //{
            //    x: $document.width()/2,
            //    y: $document.height()/2
            //}
        ];

        $('#connectionId').text(controllerConnection.key);
        var $qrHolder = $("#qrcode");
        var url = "<APP DEPLOY ADDR>/controller?id=" + encodeURIComponent(controllerConnection.key);
        console.log(url);
        var qrcode = new QRCode($qrHolder[0],url);


        var indicators = {
            x: document.getElementById('pos_x'),
            y: document.getElementById('pos_y')
        };

        controllerConnection.subscribe('indicatorState', null, function(channelLabel, key, message) {
            if (!message)
                return;
            indicators.x.innerHTML = message.x;
            indicators.y.innerHTML = message.y;
            getPlayer(key).setPos(message.x, message.y);
        }, null, function(key, channelLabel) {
            getPlayer(key).getPointer().remove();
        });

        controllerConnection.subscribe('initState', null, function(channelLabel, key, message) {
            $('.calibration-target').removeClass('visible');
            var player = getPlayer(key);
            switch (message.request) {
                case 'calibration-start': {
                    player.calibrationState = 0;
                } break;
                case 'calibration-next': {
                    player.calibrationState++;
                } break;
                default: return;
            }
            if (player.calibrationState >= calibrationPoints.length) {
                controllerConnection.sendMessage('initState', key, {
                    response: 'calibration-finished'
                });
                player.hideCalibrator();
                return;
            }
            player.getCalibrator();

            var res = calibrationPoints[player.calibrationState];
            player.setPos(res.x, res.y);
            controllerConnection.sendMessage('initState', key, {
                response: 'calibration-next',
                data: res
            });
        });
    });
})();