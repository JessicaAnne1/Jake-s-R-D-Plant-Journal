// Mock data for visual preview before the real API is wired up.
// Set USE_MOCK = false in api.js to switch to the real backend.

window.MOCK_CONFIG = {
  'Propagation Methods': ['Seed', 'Softwood Cutting', 'Hardwood Cutting', 'Division', 'Layering', 'Grafting'],
  'Species Categories': ['Tree', 'Shrub', 'Herb', 'Succulent', 'Grass', 'Fern', 'Climber', 'Conifer'],
  'Phases': ['Sourcing', 'Sown / Struck', 'Callusing', 'Rooting', 'Hardening Off', 'Potted On', 'Planted Out'],
  'Statuses': ['In progress', 'Success', 'Partial', 'Failed', 'Closed'],
  'Mediums': ['Perlite', 'Coir', 'Seed-raising Mix', 'Sand', 'Water'],
  'Container Types': ['Seed Tray', 'Tube', '4" Pot', 'Propagator'],
  'Light Exposure': ['Full Sun', 'Part Shade', 'Full Shade', 'Indoor'],
  'Rainfall': ['None', 'Light', 'Moderate', 'Heavy', 'N/A'],
};

window.MOCK_SPECIES = [
  { 'Species ID': 'SP-0001', 'Common Name': 'Mountain Ash',     'Scientific Name': 'Eucalyptus regnans',    'Species Category': 'Tree',      'Native Climate / Region': 'Cool temperate, montane VIC/TAS', 'Natural Conditions': 'High rainfall (1000–1800mm), deep loam, cool summers', runCount: 4 },
  { 'Species ID': 'SP-0002', 'Common Name': 'Common Heath',     'Scientific Name': 'Epacris impressa',      'Species Category': 'Shrub',     'Native Climate / Region': 'Coastal heath, temperate SE Australia', 'Natural Conditions': 'Sandy acid soil, full sun to part shade', runCount: 2 },
  { 'Species ID': 'SP-0003', 'Common Name': 'Mint Bush',        'Scientific Name': 'Prostanthera lasianthos','Species Category': 'Shrub',     'Native Climate / Region': 'Wet sclerophyll forest, gullies', 'Natural Conditions': 'Moist, well-drained, shaded', runCount: 1 },
  { 'Species ID': 'SP-0004', 'Common Name': 'Pigface',          'Scientific Name': 'Carpobrotus rossii',    'Species Category': 'Succulent', 'Native Climate / Region': 'Coastal dunes, southern Australia', 'Natural Conditions': 'Sandy, salt-tolerant, full sun', runCount: 6 },
  { 'Species ID': 'SP-0005', 'Common Name': 'Kangaroo Grass',   'Scientific Name': 'Themeda triandra',      'Species Category': 'Grass',     'Native Climate / Region': 'Widespread across Australia', 'Natural Conditions': 'Fire-adapted, drought tolerant', runCount: 3 },
  { 'Species ID': 'SP-0006', 'Common Name': 'Tree Fern',        'Scientific Name': 'Dicksonia antarctica',  'Species Category': 'Fern',      'Native Climate / Region': 'Cool wet gullies, VIC/TAS', 'Natural Conditions': 'High humidity, dappled shade, rich moist soil', runCount: 2 },
  { 'Species ID': 'SP-0007', 'Common Name': 'Wonga Vine',       'Scientific Name': 'Pandorea pandorana',    'Species Category': 'Climber',   'Native Climate / Region': 'Eastern Australia rainforest margins', 'Natural Conditions': 'Well-drained, sun to part shade', runCount: 0 },
  { 'Species ID': 'SP-0008', 'Common Name': 'Drooping She-oak', 'Scientific Name': 'Allocasuarina verticillata', 'Species Category': 'Conifer', 'Native Climate / Region': 'Dry sclerophyll, southern Australia', 'Natural Conditions': 'Dry, well-drained, full sun', runCount: 1 },
  { 'Species ID': 'SP-0009', 'Common Name': 'Lemon Myrtle',     'Scientific Name': 'Backhousia citriodora', 'Species Category': 'Tree',      'Native Climate / Region': 'Subtropical QLD/NSW', 'Natural Conditions': 'Warm, humid, well-drained', runCount: 0 },
  { 'Species ID': 'SP-0010', 'Common Name': 'Native Mint',      'Scientific Name': 'Mentha australis',      'Species Category': 'Herb',      'Native Climate / Region': 'Riparian, eastern Australia', 'Natural Conditions': 'Moist, part shade', runCount: 5 },
  { 'Species ID': 'SP-0011', 'Common Name': 'Snow Gum',         'Scientific Name': 'Eucalyptus pauciflora', 'Species Category': 'Tree',      'Native Climate / Region': 'Subalpine, SE Australia', 'Natural Conditions': 'Frost-tolerant, well-drained', runCount: 2 },
  { 'Species ID': 'SP-0012', 'Common Name': 'River Mint',       'Scientific Name': 'Mentha satureioides',   'Species Category': 'Herb',      'Native Climate / Region': 'Wet sites, eastern Australia', 'Natural Conditions': 'Damp, sun to part shade', runCount: 1 },
];

window.MOCK_NOTES = {};
window.MOCK_RUNS = [];
