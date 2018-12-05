var mqtt;
var reconnectTimeout = 2000;

var host = "loraserver.tetaneutral.net";
var port = 1884;
var path = "/ws";

var useTLS = false;
var username = null;
var password = null;
var cleansession = true;

var gateways = new Map();
var devices = new Map();

function mqtt_connect()
{
	mqtt = new Paho.MQTT.Client(
			host,
			port,
			path,
			"web_" + parseInt(Math.random() * 100, 10)
	);

	var options = {
		timeout: 3,
		useSSL: useTLS,
		cleanSession: cleansession,
		onSuccess: onConnect,
		onFailure: onFailure,
	};

	mqtt.onConnectionLost = onConnectionLost;
	mqtt.onMessageArrived = onMessageArrived;
	mqtt.connect(options);
}

function onConnect()
{
    mqtt.subscribe("gateway/+/stats", {qos: 0});
    mqtt.subscribe("application/+/+/+/rx", {qos: 0});
}

function onConnectionLost(response)
{
	setTimeout(mqtt_connect, reconnectTimeout);
}

function onFailure(message)
{
	setTimeout(mqtt_connect, reconnectTimeout);
}

function onMessageArrived(message)
{
	var topic = message.destinationName.split('/');
    var payload = JSON.parse(message.payloadString);
    
    if( topic[0] === "application" )
    {
        if( topic[4] === "rx" )
        {
            if( devices.has(payload.deviceName) )
            {
                devices.set(payload.deviceName, payload);
                $('#devices_table tbody tr').each(function() {
                    if( $(this).find("td").eq(1).text() == payload.deviceName )
                    {
                        $(this).find("td").eq(3).text(payload.rxInfo[0].rssi);
                    }
                });
            }
            else
            {
                $('#devices_table tbody').append('<tr><td></td><td>' + payload.deviceName + '</td><td>' + payload.devEUI + '</td><td>' + payload.rxInfo[0].rssi + '</td></tr>');
                devices.set(payload.deviceName, payload);
            }
        }
    }
    else if( topic[0] === "gateway")
    {
        if( topic[2] === "stats" )
        {
            if( gateways.has(topic[1].toLowerCase()) )
            {
                gateways.set(topic[1].toLowerCase(), payload);
                $('#gateways_table tbody tr').each(function() {
                    if( $(this).find("td").eq(1).text() == topic[1].toLowerCase() )
                    {
                        $(this).find("td").eq(2).text(payload.hostname);
                        $(this).find("td").eq(3).text(payload.uptime);
                    }
                });
            }
            else
            {
                $('#gateways_table tbody').append('<tr><td></td><td>' + topic[1].toLowerCase() + '</td><td></td><td></td></tr>');
                gateways.set(topic[1].toLowerCase(), payload);
            }
        }
    }
}

$("#button_send_downlink").click(function() {
    msg = new Paho.MQTT.Message('{"reference": "abcd1234","confirmed": true,"fPort": 10,"data": "MQo="}')
    msg.destinationName = "application/" + $('#application_id_downlink').val() + "/device/" + $('#device_name_downlink').val() + "/tx";
    mqtt.send(msg);
}); 