# OPEN WEATHER - MQTT (TP)
###### Moussa OUDJAMA | 4MOC

## Objectif 

Le TP a pour but de nous apprendre comment fonctionne le protocole MQTT et d'afficher cela sur notre iPhone en passant par les méthodes publish et subscribe ainsi que l'utilisation de broker public et privé utile à la mise en place de notre communication MQTT au sein de notre architecture. Dans ce repository nous allons voir que la mise en place avec un broker local et privé, le principe reste le même avec un broker public de toute façon.
Pour mettre en place tout cela nous allons récupérer les information d'une API de station météo, les pousser dans un topic MQTT et enfin de mettre cela en relation avec HomeBridge pour visualiser les données sur notre iPhone.

## Outils utilisés 

### Raspberry PI

<p align="center">
<img src="https://github.com/MoussaOudj/OpenWeatherMapTP/blob/master/readme_ressources/Raspberry.jpg" width="250" height="250" />
</p>
 
 >Dans notre cas la Raspberry à été setup pour fonctionner en tant que serveur et broker mosquitto, à l'aide de Docker nous avons installé des images utile au bon fonctionnement du broker mqtt et de la communiction avec notre iPhone. Tout d'abbord nous avons Portainer pour gérer nos différents containers qui sont : Homebridge utile à la communication avec notre iPhone et Mosquitto pour setup notre broker MQTT
 

#### Portainer
>local endpoint : http://group5.local:9000/

Portainer s’installe comme un conteneur docker pour simplifier sont déploiement. Portainer permet de gérer une bonne partie des éléments de docker : conteneurs, images, volumes, réseaux, utilisateurs, etc.
Dans notre cas nous l'utilision pour visualiser et gérer nos deux containers : Mosquitto et HomeBridge

<p align="center">
<img src="https://github.com/MoussaOudj/OpenWeatherMapTP/blob/master/readme_ressources/PortainerExemple.png" width="600" height="250" />
</p>

> Ci-dessus la fenêtre de gestion de containers

#### Mosquitto Broker
>local endpoint : mqtt://group5.local:1883/

Mosquitto est un broker public et open-source mise à disposition pour la mise en place de communication MQTT. Il va gérer tout notre système de messaging à l'aide des méthode subscribe et publish dans un topic. Dans notre cas à l'aide de portainer le broker est en local et sécurisé à l'aide de configuration bien particulière.

<p align="center">
<img src="https://github.com/MoussaOudj/OpenWeatherMapTP/blob/master/readme_ressources/mosquitto.png" width="250" height="250" />
</p>

>Logo mosquitto


#### HomeBridge
>local endpoint : http://group5.local:8181/

Le container Homebridge nous permet d'intégrer à des appareils domestiques intelligents qui ne prennent pas en charge nativement HomeKit. Il existe plus de 2 000 plugins Homebridge prenant en charge des milliers d'accessoires intelligents différents. Dans notre cas nous allons mettre en relation HomeBridge avec notre broker MQTT pour récuperer toutes les informations d'une station méteo et de l'afficher sur notre iPhone à l'aide du fameux plugin.

<p align="center">
<img src="https://github.com/MoussaOudj/OpenWeatherMapTP/blob/master/readme_ressources/Homebridge.png" width="600" height="300" />
</p>

> Ci-dessus la fenêtre HomeBridge

### Open Weather Map API

Open Weather Map permet de récupérer des données météorologique à travers le monde. On peut recupérer la température, la vitesse du vent et même les données des jours à venirs.

<p align="center">
<img src="https://github.com/MoussaOudj/OpenWeatherMapTP/blob/master/readme_ressources/openweather.png" width="250" height="250" />
</p>

>Ci dessous un exemple de requêtes avec notre clé API : 
> http://api.openweathermap.org/data/2.5/onecall/timemachine?lat=48.8534&lon=2.3488&dt=1626252353&appid=50cc7473f07324492c8cd1c8328c5553&units=metric

## Schéma de communication

<p align="center">
<img src="https://github.com/MoussaOudj/OpenWeatherMapTP/blob/master/readme_ressources/schema-com.png" width="800" height="300" />
</p>

## Code & Config


### Envoi des données NODE JS

>Fonction refresh (envoi des données tout les x ms)
> Publication dans les divers topic correspondant
> (gestion led expliqué plus tard)
```
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

```

### Config Weather Station | MQTT-THING Plugin

>Configuration coté HomeBridge
> Avec le plugin mqtt-thing la config setup de la weather station.
```
"accessory": "mqttthing",
            "type": "weatherStation",
            "name": "weather api",
            "serviceNames": {
                "temperature": "Temperature",
                "humidity": "Humidity",
                "airPressure": "Air Pressure",
                "weather": "Weather"
            },
            "url": "mqtt://localhost:1883",
            "username": "esgi",
            "password": "esgi4moc",
            "caption": "Weather Station",
            "topics": {
                "getCurrentTemperature": "weather-station/group5/server/temperature",
                "getCurrentRelativeHumidity": "weather-station/group5/server/humidity",
                "getCurrentAmbientLightLevel": "weather-station/group5/server/light",
                "getAirPressure": "weather-station/group5/server/pressure",
                "getRain1h": "weather-station/group5/server/rain/level/lastHour",
                "getRain24h": "weather-station/group5/server/rain/level/lastDay",
                "getUVIndex": "weather-station/group5/server/uvi",
                "getWeatherCondition": "weather-station/group5/server/weather",
                "getVisibility": "weather-station/group5/server/visibility",
                "getWindDirection": "weather-station/group5/server/wind/direction",
                "getWindSpeed": "weather-station/group5/server/wind/speed",
                "getStatusActive": "weather-station/group5/server/isActive",
                "getStatusFault": "weather-station/group5/server/isFault",
                "getStatusTampered": "weather-station/group5/server/isTampered",
                "getStatusLowBattery": "weather-station/group5/server/isLowBattery"
            }
        }
```

## Resultat Weather Station

<p align="center">
<img src="https://github.com/MoussaOudj/OpenWeatherMapTP/blob/master/readme_ressources/weather_station.PNG" width="200" height="400" /> <img src="https://github.com/MoussaOudj/OpenWeatherMapTP/blob/master/readme_ressources/Capteurs.PNG" width="200" height="400" />
</p>


# Bonus 


## Ajout gestion led RGB selon la temperature

En bonus j'ai ajouté la gestion d'une led rgb selon la temperature, si la temperature atteind les 25 degrès ou plus alors la led est en rouge, sinon elle sera en bleu. 
Pour cela j'ai eu besoin d'ajouter une ESP au projet ainsin que la fameuse led rgb, il y aura par la suite des modification niveau homebridge.

2 topics sont utile pour la gestion de la led : 
- Le topic qui gère les couleurs qui sera alimenté avec les données RGB
- Le topic qui gère le status on/off qui sera alimenté avec un payload en JSON

### Code arduino led RGB

Pour que la led fonctionne normalement il m'a fallu écrire un code sur Arduino pour gérer l'état de celle - ci. Le plus important est de récupérer les informations des topics. Pour avoir plus de détails le code ce trouve [ICI](https://github.com/MoussaOudj/OpenWeatherMapTP/blob/master/led_rgb_arduino/rgb_led_mqtt/rgb_led_mqtt.ino)

### Code node.js led RGB

>Subscribe du topic + initialisation topic à off avec le payload en JSON
```
client.on('connect', function() {
console.log('CONNECTED')
//subscribe au topic rgb status
client.subscribe('weather-station/moussa/control/rgb/status')
//initialise rgb status à off
client.publish('weather-station/moussa/control/rgb/status',"{\"status\": \"Off\"}")
})
```


>Requête pour modifier le status (faisable avec postman)
```
app.post('/set-rgb-status',(req,res,next)=> {
     console.log("ENVOI")
     var body = JSON.stringify(req.body)
     console.log(body)
     client.publish('weather-station/moussa/control/rgb/status',body)
     res.send()
 })
```
 >Exemple de body
 ```
 {
 "status": "On"
}
```

>Reception du message status (parsing du payload)
```
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
```

>Envoi de la couleur sur topic selon la temperature 
```
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
```
    
### Config HomeBridge led RGB

Coté HomeBridge il a fallu ajouter un objet led RGB, mais la spécificité était de parser le JSON on niveau de la gestion du On/Off 

>Config rgb led temperature  
```
"accessory": "mqttthing",
            "type": "lightbulb",
            "name": "RGB_Temperature",
            "url": "mqtt://localhost:1883",
            "username": "esgi",
            "password": "esgi4moc",
            "topics": {
                "getOn": {
                    "topic": "weather-station/moussa/control/rgb/status",
                    "apply": "return JSON.parse(message).status;"
                },
                "setOn": {
                    "topic": "weather-station/moussa/control/rgb/status",
                    "apply": "return JSON.stringify({status: (message)})"
                },
                "getRGB": "weather-station/moussa/control/rgb",
                "setRGB": "weather-station/moussa/control/rgb"
            },
            "integerValue": true,
            "onValue": "On",
            "offValue": "Off",
            "hex": false,
            "hexPrefix": false,
            "minColorTemperature": 0,
            "maxColorTemperature": 255
        }

```

>Parsing On/Off en JSON
```
"getOn": {
"topic": "weather-station/moussa/control/rgb/status",
"apply": "return JSON.parse(message).status;"
},
"setOn": {
"topic": "weather-station/moussa/control/rgb/status",
"apply": "return JSON.stringify({status: (message)})"
}
```

### Resultat LED RGB

<p align="center">
<img src="https://github.com/MoussaOudj/OpenWeatherMapTP/blob/master/readme_ressources/blue_led.jpg" width="250" height="250" />
<img src="https://github.com/MoussaOudj/OpenWeatherMapTP/blob/master/readme_ressources/red_led.jpg" width="250" height="250" />
<img src="https://github.com/MoussaOudj/OpenWeatherMapTP/blob/master/readme_ressources/Exemple.jpg" width="250" height="250" />
</p>

<p align="center">
<img src="https://github.com/MoussaOudj/OpenWeatherMapTP/blob/master/readme_ressources/RGB_Temperature_app.PNG" width="200" height="400" />
<img src="https://github.com/MoussaOudj/OpenWeatherMapTP/blob/master/readme_ressources/red_led_app.PNG" width="200" height="400"  />
<img src="https://github.com/MoussaOudj/OpenWeatherMapTP/blob/master/readme_ressources/blue_led_app.PNG" width="200" height="400" />
</p>



## Ajout de divers composants mqtt-thing



## Resultat Led




