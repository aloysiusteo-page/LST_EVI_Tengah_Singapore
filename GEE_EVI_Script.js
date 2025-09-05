// Tengah, Singapore Vegetation Cover Change

// Define study area
var topLeft = [103.703259, 1.379889];
var bottomRight = [103.773559, 1.334889];
var singapore = ee.Geometry.Rectangle([topLeft[0], bottomRight[1], bottomRight[0], topLeft[1]]);

// Define time periods
var beforeStart = '2016-01-01';
var beforeEnd = '2017-06-30';
var afterStart = '2024-01-01';
var afterEnd = '2025-06-30';

// Enhanced cloud and shadow masking function for Landsat 8 (aligned with LST Change script)
function maskL8sr(image) {
  // QA_PIXEL bit flags for Landsat 8 Collection 2
  var dilatedCloudBitMask = (1 << 1);    // Dilated cloud
  var cirrusBitMask = (1 << 2);          // Cirrus
  var cloudBitMask = (1 << 3);           // Cloud
  var cloudShadowBitMask = (1 << 4);     // Cloud shadow
  
  var qa = image.select('QA_PIXEL');
  
  // Enhanced mask - remove clouds, shadows, cirrus, and dilated clouds
  var mask = qa.bitwiseAnd(dilatedCloudBitMask).eq(0)
              .and(qa.bitwiseAnd(cirrusBitMask).eq(0))
              .and(qa.bitwiseAnd(cloudBitMask).eq(0))
              .and(qa.bitwiseAnd(cloudShadowBitMask).eq(0));
  
  return image.updateMask(mask);
}

// Additional function to filter by cloud cover percentage (ALIGNED WITH SCRIPT 1)
function addCloudCover(image) {
  var cloudCover = ee.Number(image.get('CLOUD_COVER'));
  return image.set('CLOUD_COVER_PROPERTY', cloudCover);
}

// Function to create water mask using NDWI and MNDWI (ALIGNED WITH SCRIPT 1)
function createWaterMask(image) {
  // Calculate NDWI (Normalized Difference Water Index)
  // NDWI = (Green - NIR) / (Green + NIR)
  var green = image.select('SR_B3').multiply(0.0000275).add(-0.2);
  var nir = image.select('SR_B5').multiply(0.0000275).add(-0.2);
  var ndwi = green.subtract(nir).divide(green.add(nir));
  
  // Additional SWIR-based water detection
  var swir1 = image.select('SR_B6').multiply(0.0000275).add(-0.2);
  var mndwi = green.subtract(swir1).divide(green.add(swir1));
  
  // Water mask: NDWI > 0 OR MNDWI > 0 (water pixels)
  // We want to EXCLUDE water, so we invert this mask
  var waterMask = ndwi.gt(0).or(mndwi.gt(0));
  var landMask = waterMask.not(); // Invert to get land pixels only
  
  return image.addBands(landMask.rename('WATER_MASK'));
}

// Function to calculate vegetation indices with water masking (UPDATED)
function calculateVegetationIndices(image) {
  var nir = image.select('SR_B5').multiply(0.0000275).add(-0.2);
  var red = image.select('SR_B4').multiply(0.0000275).add(-0.2);
  var blue = image.select('SR_B2').multiply(0.0000275).add(-0.2);
  var swir1 = image.select('SR_B6').multiply(0.0000275).add(-0.2);
  var green = image.select('SR_B3').multiply(0.0000275).add(-0.2);

  var ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI');
  var evi = image.expression(
    '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {
      'NIR': nir, 'RED': red, 'BLUE': blue
    }).rename('EVI');
  var ndmi = nir.subtract(swir1).divide(nir.add(swir1)).rename('NDMI');
  var savi = image.expression(
    '((NIR - RED) / (NIR + RED + 0.5)) * 1.5', {
      'NIR': nir, 'RED': red
    }).rename('SAVI');
  var gndvi = nir.subtract(green).divide(nir.add(green)).rename('GNDVI');
  
  // NDWI for reference (already calculated in createWaterMask)
  var ndwi = green.subtract(nir).divide(green.add(nir)).rename('NDWI');
  
  // Apply water mask from the WATER_MASK band created earlier
  var waterMask = image.select('WATER_MASK');
  
  return image.addBands([ndvi, evi, ndmi, savi, gndvi, ndwi])
              .updateMask(waterMask); // Apply the same water mask as LST Change script
}

// Load Landsat 8 collections with ALIGNED filtering
var l8_before = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterBounds(singapore)
  .filterDate(beforeStart, beforeEnd)
  .filter(ee.Filter.lt('CLOUD_COVER', 50)) // <50% cloud cover
  .map(addCloudCover)                      // Add cloud cover property
  .map(createWaterMask)                    // Create water mask first 
  .map(maskL8sr)                           // Apply cloud masking 
  .map(calculateVegetationIndices);

var l8_after = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterBounds(singapore)
  .filterDate(afterStart, afterEnd)
  .filter(ee.Filter.lt('CLOUD_COVER', 50)) // <50% cloud cover 
  .map(addCloudCover)                      // Add cloud cover property 
  .map(createWaterMask)                    // Create water mask first 
  .map(maskL8sr)                           // Apply cloud masking 
  .map(calculateVegetationIndices);

// Create median composites
var indices = ['NDVI', 'EVI', 'NDMI', 'SAVI', 'GNDVI'];
var vegetation_before = l8_before.select(indices).median().clip(singapore);
var vegetation_after = l8_after.select(indices).median().clip(singapore);
var vegetation_difference = vegetation_after.subtract(vegetation_before);

// Focus on EVI
var evi_before = vegetation_before.select('EVI');
var evi_after = vegetation_after.select('EVI');
var evi_difference = vegetation_difference.select('EVI');

// Visualization parameters
var vegetationVis = {min: 0, max: 1, palette: ['red', 'yellow', 'lightgreen', 'darkgreen']};
var eviVis = {min: 0, max: 0.8, palette: ['brown', 'yellow', 'lightgreen', 'darkgreen']};
var diffVis = {min: -0.3, max: 0.3, palette: ['red', 'white', 'green']};

// Map layers
Map.centerObject(singapore, 12);
Map.addLayer(evi_before, eviVis, 'EVI Before (2016-2017)');
Map.addLayer(evi_after, eviVis, 'EVI After (2024-2025)');
Map.addLayer(evi_difference, diffVis, 'EVI Difference (After - Before)');
Map.addLayer(singapore, {color: 'black'}, 'Study Area', false);

// Add water mask visualization layer
var sampleImage = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterBounds(singapore)
  .filterDate(beforeStart, beforeEnd)
  .filter(ee.Filter.lt('CLOUD_COVER', 30))  // Same as Script 1 for water visualization
  .first();

var green = sampleImage.select('SR_B3').multiply(0.0000275).add(-0.2);
var nir = sampleImage.select('SR_B5').multiply(0.0000275).add(-0.2);
var swir1 = sampleImage.select('SR_B6').multiply(0.0000275).add(-0.2);
var ndwi = green.subtract(nir).divide(green.add(nir));
var mndwi = green.subtract(swir1).divide(green.add(swir1));
var waterBodies = ndwi.gt(0).or(mndwi.gt(0));

Map.addLayer(waterBodies.selfMask(), {palette: ['blue']}, 'Water Bodies (Excluded)', false);

// Print statistics
print('Vegetation Before - Image Count:', l8_before.size());
print('Vegetation After - Image Count:', l8_after.size());

// Calculate and print EVI statistics
var stats_before = evi_before.reduceRegion({
  reducer: ee.Reducer.mean().combine({
    reducer2: ee.Reducer.minMax(),
    sharedInputs: true
  }),
  geometry: singapore,
  scale: 30,
  maxPixels: 1e9
});

var stats_after = evi_after.reduceRegion({
  reducer: ee.Reducer.mean().combine({
    reducer2: ee.Reducer.minMax(),
    sharedInputs: true
  }),
  geometry: singapore,
  scale: 30,
  maxPixels: 1e9
});

var stats_diff = evi_difference.reduceRegion({
  reducer: ee.Reducer.mean().combine({
    reducer2: ee.Reducer.minMax(),
    sharedInputs: true
  }),
  geometry: singapore,
  scale: 30,
  maxPixels: 1e9
});

print('EVI Statistics Before:', stats_before);
print('EVI Statistics After:', stats_after);
print('EVI Difference Statistics:', stats_diff);


// Export .tif files to Google Drive
Export.image.toDrive({
  image: evi_before,
  description: 'EVI_Singapore_Before_2016_2017',
  folder: 'GEE_Exports',
  fileNamePrefix: 'EVI_Singapore_Before_2016_2017',
  region: singapore,
  scale: 30,
  crs: 'EPSG:4326',
  fileFormat: 'GeoTIFF',
  maxPixels: 1e9
});

Export.image.toDrive({
  image: evi_after,
  description: 'EVI_Singapore_After_2024_2025',
  folder: 'GEE_Exports',
  fileNamePrefix: 'EVI_Singapore_After_2024_2025',
  region: singapore,
  scale: 30,
  crs: 'EPSG:4326',
  fileFormat: 'GeoTIFF',
  maxPixels: 1e9
});

Export.image.toDrive({
  image: evi_difference,
  description: 'EVI_Singapore_Difference',
  folder: 'GEE_Exports',
  fileNamePrefix: 'EVI_Singapore_Difference',
  region: singapore,
  scale: 30,
  crs: 'EPSG:4326',
  fileFormat: 'GeoTIFF',
  maxPixels: 1e9
});

