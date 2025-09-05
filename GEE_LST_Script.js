// Tengah, Singapore Land Surface Temperature Comparison

// Define study area
var topLeft = [103.703259, 1.379889];
var bottomRight = [103.773559, 1.334889]; // 103.703259 + 0.0703, 1.379889 - 0.0450
var singapore = ee.Geometry.Rectangle([topLeft[0], bottomRight[1], bottomRight[0], topLeft[1]]);

// Define time periods
var beforeStart = '2016-01-01';
var beforeEnd = '2017-06-30';
var afterStart = '2024-01-01';
var afterEnd = '2025-06-30';

// Enhanced cloud and shadow masking function for Landsat 8
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

// Additional function to filter by cloud cover percentage
function addCloudCover(image) {
  var cloudCover = ee.Number(image.get('CLOUD_COVER'));
  return image.set('CLOUD_COVER_PROPERTY', cloudCover);
}

// Function to create water mask using NDWI and MNDWI
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

// Function to calculate Land Surface Temperature from Landsat 8 with water masking
function calculateLST(image) {
  // Get thermal band (Band 10) - ST_B10 is already in Kelvin and scaled
  var thermal = image.select('ST_B10');
  
  // Apply scale factor and convert to Celsius
  var lst = thermal.multiply(0.00341802).add(149.0).subtract(273.15);
  
  // Apply realistic temperature mask for Singapore, but only remove extreme outliers
  // Expanded range to 15-55°C to be more permissive initially
  var tempMask = lst.gte(15).and(lst.lte(55));
  
  // Apply water mask to exclude water bodies
  var waterMask = image.select('WATER_MASK');
  var finalMask = tempMask.and(waterMask);
  
  lst = lst.updateMask(finalMask);
  
  return image.addBands(lst.rename('LST'));
}

// Load Landsat 8 Surface Temperature collections with water masking
var l8_before = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterBounds(singapore)
  .filterDate(beforeStart, beforeEnd)
  .filter(ee.Filter.lt('CLOUD_COVER', 50)) // <50% cloud cover
  .map(addCloudCover)
  .map(createWaterMask)  // Create water mask first
  .map(maskL8sr)
  .map(calculateLST)
  .select(['LST']);

var l8_after = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterBounds(singapore)
  .filterDate(afterStart, afterEnd)
  .filter(ee.Filter.lt('CLOUD_COVER', 50)) // <50% cloud cover
  .map(addCloudCover)
  .map(createWaterMask)  // Create water mask first
  .map(maskL8sr)
  .map(calculateLST)
  .select(['LST']);

// Create composites with post-processing temperature filtering
var lst_before_raw = l8_before.median().clip(singapore);
var lst_after_raw = l8_after.median().clip(singapore);

// Apply final realistic temperature range after compositing
var finalTempMask_before = lst_before_raw.gte(21).and(lst_before_raw.lte(50));
var finalTempMask_after = lst_after_raw.gte(21).and(lst_after_raw.lte(50));

var lst_before = lst_before_raw.updateMask(finalTempMask_before);
var lst_after = lst_after_raw.updateMask(finalTempMask_after);

// Optional: Create percentile composites for comparison (less affected by outliers)
// var lst_before_p25 = l8_before.reduce(ee.Reducer.percentile([25])).clip(singapore);
// var lst_after_p25 = l8_after.reduce(ee.Reducer.percentile([25])).clip(singapore);

// Calculate temperature difference (after - before)
var lst_difference = lst_after.subtract(lst_before);

// Define visualization parameters
var lstVis = {
  min: 20,
  max: 45,
  palette: ['blue', 'cyan', 'yellow', 'orange', 'red']
};

var diffVis = {
  min: -5,
  max: 5,
  palette: ['blue', 'white', 'red']
};

// Add layers to map
Map.centerObject(singapore, 11);
Map.addLayer(lst_before, lstVis, 'LST Before (2015-2017)');
Map.addLayer(lst_after, lstVis, 'LST After (2024-Present)');
Map.addLayer(lst_difference, diffVis, 'LST Difference (After - Before)');

// Create a water mask for visualization from the before period
var sampleImage = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterBounds(singapore)
  .filterDate(beforeStart, beforeEnd)
  .filter(ee.Filter.lt('CLOUD_COVER', 30))
  .first();

var green = sampleImage.select('SR_B3').multiply(0.0000275).add(-0.2);
var nir = sampleImage.select('SR_B5').multiply(0.0000275).add(-0.2);
var swir1 = sampleImage.select('SR_B6').multiply(0.0000275).add(-0.2);
var ndwi = green.subtract(nir).divide(green.add(nir));
var mndwi = green.subtract(swir1).divide(green.add(swir1));
var waterBodies = ndwi.gt(0).or(mndwi.gt(0));

// Add water mask visualization layer
Map.addLayer(waterBodies.selfMask(), {palette: ['blue']}, 'Water Bodies (Excluded)', false);

// Add study area boundary
Map.addLayer(singapore, {color: 'black'}, 'Study Area', false);

// Print statistics
print('LST Before - Image Count:', l8_before.size());
print('LST After - Image Count:', l8_after.size());

// Calculate and print temperature statistics
var stats_before = lst_before.reduceRegion({
  reducer: ee.Reducer.mean().combine({
    reducer2: ee.Reducer.minMax(),
    sharedInputs: true
  }),
  geometry: singapore,
  scale: 30,
  maxPixels: 1e9
});

var stats_after = lst_after.reduceRegion({
  reducer: ee.Reducer.mean().combine({
    reducer2: ee.Reducer.minMax(),
    sharedInputs: true
  }),
  geometry: singapore,
  scale: 30,
  maxPixels: 1e9
});

var stats_diff = lst_difference.reduceRegion({
  reducer: ee.Reducer.mean().combine({
    reducer2: ee.Reducer.minMax(),
    sharedInputs: true
  }),
  geometry: singapore,
  scale: 30,
  maxPixels: 1e9
});

print('Temperature Statistics Before (°C):', stats_before);
print('Temperature Statistics After (°C):', stats_after);
print('Temperature Difference Statistics (°C):', stats_diff);

// Export .tif files to Google Drive
Export.image.toDrive({
  image: lst_before,
  description: 'LST_Singapore_Before_2016_2017',
  folder: 'GEE_Exports', // Optional: specify folder in Google Drive
  fileNamePrefix: 'LST_Singapore_Before_2016_2017',
  region: singapore,
  scale: 30,
  crs: 'EPSG:4326',
  fileFormat: 'GeoTIFF',
  maxPixels: 1e9
});

Export.image.toDrive({
  image: lst_after,
  description: 'LST_Singapore_After_2024_2025',
  folder: 'GEE_Exports',
  fileNamePrefix: 'LST_Singapore_After_2024_2025',
  region: singapore,
  scale: 30,
  crs: 'EPSG:4326',
  fileFormat: 'GeoTIFF',
  maxPixels: 1e9
});

Export.image.toDrive({
  image: lst_difference,
  description: 'LST_Singapore_Difference',
  folder: 'GEE_Exports',
  fileNamePrefix: 'LST_Singapore_Difference',
  region: singapore,
  scale: 30,
  crs: 'EPSG:4326',
  fileFormat: 'GeoTIFF',
  maxPixels: 1e9
});
