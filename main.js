// Wettervorhersage Beispiel

// Hintergrundlayer Satellitenbild
let startLayer = L.tileLayer.provider("Esri.WorldImagery")

// Blick auf Innsbruck
const map = L.map("map", {
    center: [47.267222, 11.392778],
    zoom: 5,
    layers: [
        startLayer
    ]
});

// Overlays für Wind- und Wettervorhersage
const overlays = {
    "wind": L.featureGroup().addTo(map),
    "weather": L.featureGroup().addTo(map),
};

// Layer control mit Satellitenbild
const layerControl = L.control.layers({
    "Satellitenbild": startLayer
}).addTo(map);

// Maßstab
L.control.scale({
    imperial: false
}).addTo(map);

//Datum formatieren 
let formatData = function(date){
    return date.toLocaleDateString("de-AT", {
        month: "long", 
        day: "numeric",
        hour: "2-digit", 
        minute: "2-digit"
    }) + " Uhr"; 
}


// Windvorhersage
async function loadWind(url) {
    const response = await fetch(url); 
    const jsondata = await response.json();
    //console.log(jsondata);
    //console.log("Zeitpunkt ERstellung", jsondata[0].header.refTime); 
    //console.log("Zeitpunkt Vorhersage", jsondata[0].header.forecastTime);
    
    let forecastData = new Date(jsondata[0].header.refTime);
    //console.log("Echtes Datum Erstellung", forecastData); 
    forecastData.setHours(forecastData.getHours() + jsondata[0].header.forecastTime); 
    //console.log("Echtes Datum Vorhersage", forecastData);

    let forecastLabel = formatData(forecastData); 

    layerControl.addOverlay(overlays.wind, `ECMWF Windvorhersage für ${forecastLabel}`)

    L.velocityLayer({
        data: jsondata, 
        lineWidth: 3, 
        displayOptions: {
            velocityType: "",
            directionString: "Windrichtung", 
            speedString: "Windgeschwindigkeit", 
            speedUnit: "k/h", 
            emptyString: "keine Daten vorhanden", 
            position: "bottomright"
        }
    }).addTo(overlays.wind); 

};
loadWind("https://geographie.uibk.ac.at/webmapping/ecmwf/data/wind-10u-10v-europe.json");


layerControl.addOverlay(overlays.weather, "Wettervorhersage met.no"); 

let marker = L.circleMarker([
    47.267222, 11.392778
]).bindPopup("Wettervorhersage").addTo(overlays.weather);


// Wettervorhersage
async function loadWeather(url) {
    const response = await fetch(url); 
    const jsondata = await response.json();
    
    //Marker positionieren 
    marker.setLatLng([
        jsondata.geometry.coordinates[1], 
        jsondata.geometry.coordinates[0]
    ]); 

    let details = jsondata.properties.timeseries[0].data.instant.details; 
    //console.log("Aktuelle Wetterdaten", details); 

    let forecastDate = new Date(jsondata.properties.timeseries[0].time); 
    let forecastLabel = formatData(forecastDate)
    
    
    let popup = `
        <strong> Wettervorhersage für ${forecastLabel}</strong>
        <ul>
            <li>Luftdruck: ${details.air_pressure_at_sea_level} (hPa)</li>
            <li>Lufttemperatur: ${details.air_temperature} (°C)</li>
            <li>Bewölkung: ${details.cloud_area_fraction} (%)</li>
            <li>Niederschlag: ${details.precipitation_amount} (mm)</li>
            <li>Relative Luftfeuchtigkeit: ${details.relative_humidity} (%)</li>
            <li>Windrichtung: ${details.wind_from_direction} (°)</li>
            <li>Windgeschwindigkeit: ${details.wind_speed* 3.6} (km/h)
            </li>
        </ul>
        <strong> Nächste 24h be like </strong><br>
        `;

    // Wettericon(s)
    for (let i=0; i <= 24; i += 3){
        let symbol = jsondata.properties.timeseries[i].data.next_1_hours.summary.symbol_code;
        popup +=`<img src="icons/${symbol}.svg" alt="${symbol}" style="width:32px">`;
    }
    

    marker.setPopupContent(popup).openPopup(); 

 


};
loadWeather("https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=47.267222&lon=11.392778");


map.on("click", function(evt) {
    marker.set
    let url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${evt.latlng.lat}&lon=${evt.latlng.lng}`
    loadWeather(url); 
}); 