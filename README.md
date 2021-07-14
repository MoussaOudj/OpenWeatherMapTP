# OPEN WEATHER - MQTT (TP)
###### Cindy NGUYEN | Moussa OUDJAMA | Leo VIDAL | 4MOC

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
```
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

```

### Config Weather Station | MQTT-THING Plugin

>Configuration coté HomeBridge
> Avec le plugin mqtt-thing on a pue setup la weather station.
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

## Resultat

<img src="https://github.com/MoussaOudj/OpenWeatherMapTP/blob/master/readme_ressources/weather_station.PNG"  />
<img src="https://github.com/MoussaOudj/OpenWeatherMapTP/blob/master/readme_ressources/Capteurs.PNG"  />

