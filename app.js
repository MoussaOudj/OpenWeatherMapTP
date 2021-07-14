var mqtt = require('mqtt')
var express = require('express')
var bodyParser = require('body-parser')
var rest = require('unirest')

var opts = {
    rejectUnauthorized: false,
    username: 'esgi',
    password: 'esgi4moc',
    connectTimeout: 5000
  }

  mqtt.options
var client = mqtt.connect('mqtt://group5.local:1883',opts)
 var app = express();
 app.use(bodyParser.json())
 app.use(bodyParser.urlencoded({extended: true}))
 app.listen(3000, ()=> console.log('api running on port 3000'))
 app.post('/refresh-data',(req,res,next)=> {
     console.log("ENVOI")
     var body = JSON.stringify(req.body)
     console.log(body)
     client.publish('weather-station/mouss/server/status',body)
     var requestUrl = 'https://api.openweathermap.org/data/2.5/weather?q=Paris&appid=50cc7473f07324492c8cd1c8328c5553&units=metric'
     rest('GET',requestUrl)
        .end(function(res){
            if(res.error)
                throw new Error(res.error)
            var response = JSON.parse(res.raw_body);
            client.publish('weather-station/mouss/server/temperature',response.main.temp.toString())
        })
     res.send()
 })



client.on('connect', function() {
    console.log('CONNECTD')
    client.subscribe('esgi/4moc/mouss/status', function(err){
        if(!err) {
            client.publish('esgi/4moc/mouss/status', 'Hello from Mouss Pc, testing mqtt connexion')
        }
    })
})

client.on('message', function(topic, message){
    console.warn(topic)
    console.log(message.toString())
    //client.end()
})


function between(min, max) {  
    return Math.floor(
      Math.random() * (max - min + 1) + min
    )
  }


function refreshTemp(refreshInterval){
    setInterval(() => {
        console.log('REFRESH TEMP FROM OPENWEATHER')
        var requestUrl = 'https://api.openweathermap.org/data/2.5/weather?q=Paris&appid=50cc7473f07324492c8cd1c8328c5553&units=metric'
        rest('GET',requestUrl)
           .end(function(res){
               if(res.error)
                   throw new Error(res.error)
               var response = JSON.parse(res.raw_body);
               client.publish('weather-station/group5/server/temperature',response.main.temp.toString())
               client.publish('weather-station/group5/server/humidity',response.main.humidity.toString())
               client.publish('weather-station/group5/server/pressure',response.main.pressure.toString())
               client.publish('weather-station/group5/server/weather',response.weather[0].description.toString())
               client.publish('weather-station/group5/server/visibility',response.visibility.toString())
               client.publish('weather-station/group5/server/wind/speed',response.wind.speed.toString())
               client.publish('weather-station/group5/server/wind/direction',response.wind.deg.toString())
               client.publish('weather-station/group5/server/light',between(0,100000).toString())
               client.publish('weather-station/group5/server/rain/level/lastDay',between(0,3).toString())
               client.publish('weather-station/group5/server/rain/level/lastHour',between(0,5).toString())
           })
           var requestHourlyUrl = 'http://api.openweathermap.org/data/2.5/onecall/timemachine?lat=48.8534&lon=2.3488&dt=1626252353&appid=50cc7473f07324492c8cd1c8328c5553&units=metric'
           rest('GET',requestHourlyUrl)
              .end(function(res){
                  if(res.error)
                      throw new Error(res.error)
                  var response = JSON.parse(res.raw_body);
                  client.publish('weather-station/group5/server/uvi',response.current.uvi.toString())
              })
    },refreshInterval);
}



if(client.connected){
    console.log('CONNECTÉ')
    refreshTemp(10000)
}else{
    console.log('RECONNEXION')
    client.options.username = 'esgi'
    client.options.password = 'esgi4moc'
    client.reconnect
    refreshTemp(10000)
}
