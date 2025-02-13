var  {KalmanFilter}  = kalmanFilter; 
var   colorbandFL  	 = '#990000';
const obsVariance = 1e10;
var configs = [{
    kfConf:{
      observation: 2,
      dynamic: 'constant-speed'
    },
    color: '#5B37B8'
  },{
    kfConf:{
      observation: {
        sensorDimension: 2,
        sensorCovariance: obsVariance,
        name: 'sensor'
      },
      dynamic: {
        init: {
          mean: arrayTimes[0].concat([0,0]).map(a => [a]),
          covariance: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
        },
        name: 'constant-speed',
        covariance: [1, 1, 1, 1]
      }
    },
    color: '#FFFFFF'
}]
var allResults = configs.map(a => {
  const kFilter = new KalmanFilter(a.kfConf);
  return Object.assign({}, a,{points: kFilter.filterAll(arrayTimes)})
})

function initialize() {

  // set map details
  var bounds      = new google.maps.LatLngBounds();
  var myLatlng    = new google.maps.LatLng(arrayTimes[0][0], arrayTimes[0][1]);
  var mapOptions  = {

    zoom: 16,
    center: myLatlng,
    panControl: false,
    draggable: true,
    disableDefaultUI: false,
    mapTypeId: google.maps.MapTypeId.SATELLITE

  };

  map     = new google.maps.Map(document.getElementById('mapCanvas'), mapOptions);
  marker  = new google.maps.Marker({

    position: myLatlng,
    map: map,
    icon: 'https://s3-eu-west-1.amazonaws.com/web.imedialibrarysports.com/images/track-athlete.png',
    title: 'Athlete'

  });
  allResults.forEach(({points, color}) => {
    // loop through arrayTimes and map movement and speed bands
    for (var i = 0, len = points.length-1; i < len; i++) {
      // get lat lng from array
      var latLngA = new google.maps.LatLng(points[i][0], points[i][1]);
      var latLngB = new google.maps.LatLng(points[i+1][0], points[i+1][1]);
      // map GPS movements
      mapPath(latLngA, latLngB, color);

      // set bounds
      bounds.extend (latLngA);
    }
  })


}
initialize();
function mapPath(latLngA, latLngB, colorband)
{

  // set color based on percentage of speed/distance
  movements = new google.maps.Polyline({

    path: [latLngA, latLngB],
    geodesic: false,
    strokeColor: colorband,
    strokeOpacity: 1.0,
    strokeWeight: 2,
    map: map

  });
}


/* globals d3 */
// dataset describing the consumption of renewable energy at world level
// https://data.worldbank.org/indicator/EG.FEC.RNEW.ZS
const data = arrayTimes.slice(0,-2).map(([lng, lat], iteration) => ({
  iteration, 
  lng,
  lat,
  lng0: allResults[0].points[iteration][0],
  lat0: allResults[0].points[iteration][1],
  lng1: allResults[1].points[iteration][0],
  lat1: allResults[1].points[iteration][1]
}));


// in the .viz container add an svg element following the margin convention
const margin = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20,
};
const width = 700 - (margin.left + margin.right);
const height = 350 - (margin.top + margin.bottom);

const svg = d3
  .select('.viz')
  .append('svg')
  .attr('viewBox', `0 0 ${width + (margin.left + margin.right)} ${height + (margin.top + margin.bottom)}`)
  .attr('width', width)
  .attr('height', height);

// include the visualization in the nested group
const group = svg
  .append('g')
  .attr('transform', `translate(${margin.left} ${margin.right})`);

// describe the scales for the line chart
// x-axis: time scale using the years
const xScale = d3
  .scaleTime()
  .domain(d3.extent(data, ({ iteration }) => iteration)) // consider the [minimum, maximum] values
  .range([0, width])
  .nice();

// y-axis: linear scale using the percentages
const yLatScale = d3
  .scaleLinear()
  .domain(d3.extent(data, ({ lat }) => lat)) // consider the [minimum, maximum] values
  .range([height, 0]) // flip the range considering the top down nature of the SVG coordinate system
  .nice();

// y-axis: linear scale using the percentages
const yLngScale = d3
  .scaleLinear()
  .domain(d3.extent(data, ({ lng }) => lng)) // consider the [minimum, maximum] values
  .range([height, 0]) // flip the range considering the top down nature of the SVG coordinate system
  .nice();

// describe the line function to plot the data through a path element
// for each data point the line function computes the coordinates based on the input year and percentage
const lineLat = d3
  .line()
  .x(({ iteration }) => xScale(iteration)) // to obtain the value from the time scale the input needs to be a date object (like the domain)
  .y(({ lat }) => yLatScale(lat));
const lineLng = d3
  .line()
  .x(({ iteration }) => xScale(iteration)) // to obtain the value from the time scale the input needs to be a date object (like the domain)
  .y(({ lng }) => yLngScale(lng));

const lineLat0 = d3
  .line()
  .x(({ iteration }) => xScale(iteration)) // to obtain the value from the time scale the input needs to be a date object (like the domain)
  .y(({ lat0 }) => yLatScale(lat0));
const lineLng0 = d3
  .line()
  .x(({ iteration }) => xScale(iteration)) // to obtain the value from the time scale the input needs to be a date object (like the domain)
  .y(({ lng0 }) => yLngScale(lng0));

const lineLat1 = d3
  .line()
  .x(({ iteration }) => xScale(iteration)) // to obtain the value from the time scale the input needs to be a date object (like the domain)
  .y(({ lat1 }) => yLatScale(lat1));

const lineLng1 = d3
  .line()
  .x(({ iteration }) => xScale(iteration)) // to obtain the value from the time scale the input needs to be a date object (like the domain)
  .y(({ lng1 }) => yLngScale(lng1));

// add a path element using the line function
group
  .append('path')
  .attr('d', lineLat(data))
  .attr('fill', 'none')
  .attr('stroke', 'currentColor');

// add a path element using the line function
group
  .append('path')
  .attr('d', lineLng(data))
  .attr('fill', 'none')
  .attr('stroke', 'currentColor');

// add a path element using the line function
group
  .append('path')
  .attr('d', lineLat0(data))
  .attr('fill', 'none')
  .attr('stroke', 'currentColor');

// add a path element using the line function
group
  .append('path')
  .attr('d', lineLng0(data))
  .attr('fill', 'none')
  .attr('stroke', 'currentColor');

// add a path element using the line function
group
  .append('path')
  .attr('d', lineLat1(data))
  .attr('fill', 'none')
  .attr('stroke', 'currentColor');

// add a path element using the line function
group
  .append('path')
  .attr('d', lineLng1(data))
  .attr('fill', 'none')
  .attr('stroke', 'currentColor');

// include the axes based on the defined scales
const xAxis = d3
  .axisBottom(xScale);

group
  .append('g')
  .attr('transform', `translate(0 ${height})`)
  .call(xAxis);



const yAxis = d3
  .axisLeft(yLatScale);
const yRight = d3
  .axisRight(yLngScale);

group
  .append('g')
  .call(yAxis);
group
  .append('g')
  .call(yRight);
