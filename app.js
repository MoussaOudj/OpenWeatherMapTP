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
//Initialise led rgb à Off (eteind)
var RGB_STATUS = 'Off'
 var app = express();
 app.use(bodyParser.json())
 app.use(bodyParser.urlencoded({extended: true}))
 app.listen(3000, ()=> console.log('api running on port 3000'))
 app.post('/set-rgb-status',(req,res,next)=> {
     console.log("ENVOI")
     var body = JSON.stringify(req.body)
     console.log(body)
     client.publish('weather-station/moussa/control/rgb/status',body)
     res.send()
 })




client.on('connect', function() {
console.log('CONNECTED')
//subscribe au topic rgb status
client.subscribe('weather-station/moussa/control/rgb/status')
//initialise rgb status à off
client.publish('weather-station/moussa/control/rgb/status',"{\"status\": \"Off\"}")
})

//Reception des messages
client.on('message', function(topic, message){
    //Gestion topic rgb status
    if(topic == 'weather-station/moussa/control/rgb/status'){
        jsonStatusPayload = JSON.parse(message)
        console.log(jsonStatusPayload)
        RGB_STATUS = jsonStatusPayload.status.toString()
        console.log('new status payload RGB: ' + RGB_STATUS)
    }
})

//Fonction pour simuler certaine donées non diponible
function between(min, max) {  
    return Math.floor(
      Math.random() * (max - min + 1) + min
    )
  }

function refreshOpenWeatherData(refreshInterval){
    //init variable temperature pour controler led rgb
    var temp = 0
    setInterval(() => {
        console.log('REFRESH TEMP FROM OPENWEATHER')
        var requestUrl = 'https://api.openweathermap.org/data/2.5/weather?q=Paris&appid=50cc7473f07324492c8cd1c8328c5553&units=metric'
        rest('GET',requestUrl)
           .end(function(res){
               if(res.error)
                   throw new Error(res.error)
               var response = JSON.parse(res.raw_body);
               temp = response.main.temp
               client.publish('weather-station/moussa/server/temperature',temp.toString())
               client.publish('weather-station/moussa/server/humidity',response.main.humidity.toString())
               client.publish('weather-station/moussa/server/pressure',response.main.pressure.toString())
               client.publish('weather-station/moussa/server/weather',response.weather[0].description.toString())
               client.publish('weather-station/moussa/server/visibility',response.visibility.toString())
               client.publish('weather-station/moussa/server/wind/speed',response.wind.speed.toString())
               client.publish('weather-station/moussa/server/wind/direction',response.wind.deg.toString())
               //Les données sont introuvable sur openweather donc elles sont simulé 
               client.publish('weather-station/moussa/server/light',between(0,100000).toString())
               client.publish('weather-station/moussa/server/rain/level/lastDay',between(0,3).toString())
               client.publish('weather-station/moussa/server/rain/level/lastHour',between(0,5).toString())
           })
        
           //Timestamp utile à la requête
           var timestamp = Math.round(new Date().getTime() / 1000) - 1000 ;
           //La donnée UVI était disponible que avec cette requete
           var requestWithUvi = 'http://api.openweathermap.org/data/2.5/onecall/timemachine?lat=48.8534&lon=2.3488&dt='+timestamp+'&appid=50cc7473f07324492c8cd1c8328c5553&units=metric'
           console.log(requestWithUvi)
           rest('GET',requestWithUvi)
              .end(function(res){
                  if(res.error)
                      throw new Error(res.error)
                  var response = JSON.parse(res.raw_body);
                  client.publish('weather-station/moussa/server/uvi',response.current.uvi.toString())
              })

              //Si la led est allumé alors gérer la couleur
              if(RGB_STATUS == 'On'){
                console.log('temperature : '+temp)
                if(temp >= 25){ 
                    console.log('temp superieur rgb rouge')
                    client.publish('weather-station/moussa/control/rgb','50,0,0')
                }else {
                  console.log('temp inferieur rgb bleu')
                    client.publish('weather-station/moussa/control/rgb','0,0,50')
                }
              }
    
    },refreshInterval);
}



if(client.connected){
    console.log('CONNECTÉ')
    refreshOpenWeatherData(10000)
}else{
    console.log('RECONNEXION')
    client.options.username = 'esgi'
    client.options.password = 'esgi4moc'
    client.reconnect
    refreshOpenWeatherData(10000)
}
