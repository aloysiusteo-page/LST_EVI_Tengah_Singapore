var wms_layers = [];


        var lyr_GoogleSatellite_0 = new ol.layer.Tile({
            'title': 'Google Satellite',
            'type':'base',
            'opacity': 1.000000,
            
            
            source: new ol.source.XYZ({
            attributions: ' &nbsp &middot; <a href="https://www.google.at/permissions/geoguidelines/attr-guide.html">Map data ©2015 Google</a>',
                url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
            })
        });
var lyr_ChangeinVegetationCoverEVI_1 = new ol.layer.Image({
        opacity: 1,
        
    title: 'Change in Vegetation Cover (EVI)<br />\
    <img src="styles/legend/ChangeinVegetationCoverEVI_1_0.png" /> -0.8137<br />\
    <img src="styles/legend/ChangeinVegetationCoverEVI_1_1.png" /> -0.4500<br />\
    <img src="styles/legend/ChangeinVegetationCoverEVI_1_2.png" /> 0.0000<br />\
    <img src="styles/legend/ChangeinVegetationCoverEVI_1_3.png" /> 0.2500<br />\
    <img src="styles/legend/ChangeinVegetationCoverEVI_1_4.png" /> 0.6249<br />' ,
        
        
        source: new ol.source.ImageStatic({
            url: "./layers/ChangeinVegetationCoverEVI_1.png",
            attributions: ' ',
            projection: 'EPSG:3857',
            alwaysInRange: true,
            imageExtent: [11544180.000000, 148603.442769, 11552040.000000, 153644.857719]
        })
    });
var format_TOPPrecincts_2 = new ol.format.GeoJSON();
var features_TOPPrecincts_2 = format_TOPPrecincts_2.readFeatures(json_TOPPrecincts_2, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_TOPPrecincts_2 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_TOPPrecincts_2.addFeatures(features_TOPPrecincts_2);
var lyr_TOPPrecincts_2 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_TOPPrecincts_2, 
                style: style_TOPPrecincts_2,
                popuplayertitle: 'TOP Precincts',
                interactive: false,
                title: '<img src="styles/legend/TOPPrecincts_2.png" /> TOP Precincts'
            });
var format_Roads_3 = new ol.format.GeoJSON();
var features_Roads_3 = format_Roads_3.readFeatures(json_Roads_3, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_Roads_3 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_Roads_3.addFeatures(features_Roads_3);
var lyr_Roads_3 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_Roads_3, 
                style: style_Roads_3,
                popuplayertitle: 'Roads',
                interactive: false,
                title: '<img src="styles/legend/Roads_3.png" /> Roads'
            });

lyr_GoogleSatellite_0.setVisible(true);lyr_ChangeinVegetationCoverEVI_1.setVisible(true);lyr_TOPPrecincts_2.setVisible(true);lyr_Roads_3.setVisible(true);
var layersList = [lyr_GoogleSatellite_0,lyr_ChangeinVegetationCoverEVI_1,lyr_TOPPrecincts_2,lyr_Roads_3];
lyr_TOPPrecincts_2.set('fieldAliases', {'id': 'id', });
lyr_Roads_3.set('fieldAliases', {'Name': 'Name', 'descriptio': 'descriptio', 'timestamp': 'timestamp', 'begin': 'begin', 'end': 'end', 'altitudeMo': 'altitudeMo', 'tessellate': 'tessellate', 'extrude': 'extrude', 'visibility': 'visibility', 'drawOrder': 'drawOrder', 'icon': 'icon', 'RD_NAME': 'RD_NAME', 'MNTNC_AGEN': 'MNTNC_AGEN', 'RD_TYP_CD': 'RD_TYP_CD', 'LVL_OF_RD': 'LVL_OF_RD', 'UNIQUE_ID': 'UNIQUE_ID', 'INC_CRC': 'INC_CRC', 'FMEL_UPD_D': 'FMEL_UPD_D', 'snippet': 'snippet', });
lyr_TOPPrecincts_2.set('fieldImages', {'id': 'TextEdit', });
lyr_Roads_3.set('fieldImages', {'Name': 'TextEdit', 'descriptio': 'TextEdit', 'timestamp': 'TextEdit', 'begin': 'TextEdit', 'end': 'TextEdit', 'altitudeMo': 'TextEdit', 'tessellate': 'TextEdit', 'extrude': 'TextEdit', 'visibility': 'TextEdit', 'drawOrder': 'TextEdit', 'icon': 'TextEdit', 'RD_NAME': 'TextEdit', 'MNTNC_AGEN': 'TextEdit', 'RD_TYP_CD': 'TextEdit', 'LVL_OF_RD': 'TextEdit', 'UNIQUE_ID': 'TextEdit', 'INC_CRC': 'TextEdit', 'FMEL_UPD_D': 'TextEdit', 'snippet': 'TextEdit', });
lyr_TOPPrecincts_2.set('fieldLabels', {'id': 'no label', });
lyr_Roads_3.set('fieldLabels', {'Name': 'no label', 'descriptio': 'no label', 'timestamp': 'no label', 'begin': 'no label', 'end': 'no label', 'altitudeMo': 'no label', 'tessellate': 'no label', 'extrude': 'no label', 'visibility': 'no label', 'drawOrder': 'no label', 'icon': 'no label', 'RD_NAME': 'no label', 'MNTNC_AGEN': 'no label', 'RD_TYP_CD': 'no label', 'LVL_OF_RD': 'no label', 'UNIQUE_ID': 'no label', 'INC_CRC': 'no label', 'FMEL_UPD_D': 'no label', 'snippet': 'no label', });
lyr_Roads_3.on('precompose', function(evt) {
    evt.context.globalCompositeOperation = 'normal';
});