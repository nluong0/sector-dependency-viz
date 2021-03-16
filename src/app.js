//////////////////////////////
// SIMPLE MOVING SCATTERPLOT

// import './main.css';
// import {scaleLinear} from 'd3-scale';
// import {select} from 'd3-selection';
// import {axisBottom, axisLeft} from 'd3-axis';
// import {extent} from 'd3-array';
// import {transition} from 'd3-transition';
// import {interpolateTurbo} from 'd3-scale-chromatic';
// import {csv, tsv, json} from 'd3-fetch';
// import COUNTYSHAPES from '../data/countyShapes.json';

// // Get sector data 
// const sectorData = csv('./data/proj-data.csv')
//   .then(data => addCountyGeometry(data, COUNTYSHAPES))  
//   .then(data => myVis(data))
//   .catch(e => {
//     console.log(e);
//   });

// // Link sector data to county shapes
// function addCountyGeometry(data, geom) {
//   const rv = data.map(d => ({...d, ...geom.find(s => s.id === d.FIPS)}));
//   console.log('rv columns', Object.keys(rv[0]));
//   return rv;
// }

// const height = 500;
// const width = 400;
// const margin = {top: 10, left: 50, right: 10, bottom: 50};
// const plotWidth = width - margin.left - margin.right;
// const plotHeight = height - margin.top - margin.bottom;

// function myVis(data) {
//   console.log(data);
//   const columns = Object.keys(data[0]);
//   let xCol = columns[4];
//   let yCol = columns[6];

//   const dropdowns = select('#app')
//     .append('div')
//     .style('display', 'flex')
//     .style('flex-direction', 'column')
//     .selectAll('.drop-down')
//     .data(['Variable 1', 'Variable 2'])
//     .join('div');

//   dropdowns.append('div').text(d => d);
//   dropdowns
//     .append('select')
//     .on('change', (event, x) => {
//       if (x === 'xCol') {
//         xCol = event.target.value;
//       } else {
//         yCol = event.target.value;
//       }
//       renderPlot();
//     })

//     .selectAll('option')
//     .data(dim => columns.map(key => ({key, dim})))
//     .join('option')
//     .text(d => d.key)
//     .property('selected', d => d.key === (d.dim === 'xCol' ? xCol : yCol));

//   const svgContainer = select('#app')
//     .append('div')
//     .style('position', 'relative');

//   const svg = svgContainer
//     .append('svg')
//     .attr('height', height)
//     .attr('width', width)
//     .append('g')
//     .attr('transform', `translate(${margin.left}, ${margin.top})`);

//   const xAxis = svg
//     .append('g')
//     .attr('class', 'x-axis')
//     .attr('transform', `translate(0, ${plotHeight})`);
//   const yAxis = svg.append('g').attr('class', 'y-axis');
//   svg
//     .append('g')
//     .attr('class', 'x-label')
//     .attr('transform', `translate(${width / 2}, ${height - 20})`)
//     .append('text')
//     .text(xCol)
//     .attr('text-anchor', 'middle');

//   svg
//     .append('g')
//     .attr('class', 'y-label')
//     .attr('transform', `translate(${-margin.left / 2}, ${plotHeight / 2})`)
//     .append('text')
//     .text(yCol)
//     .attr('transform', `rotate(-90)`)
//     .attr('text-anchor', 'middle');

//   const tooltip = svgContainer
//     .append('div')
//     .attr('id', 'tooltip')
//     .text('hi im a tooltip');

//   renderPlot();

//   function renderPlot() {
//     const t = transition().duration();
//     const xScale = scaleLinear()
//       .domain(extent(data, d => d[xCol]))
//       .range([0, plotWidth]);
//     const yScale = scaleLinear()
//       .domain(extent(data, d => d[yCol]))
//       .range([plotHeight, 0]);
//     svg
//       .selectAll('circle')
//       .data(data)
//       .join(
//         enter =>
//           enter
//             .append('circle')
//             .attr('cx', d => xScale(d[xCol]))
//             .attr('cy', d => yScale(d[yCol])),

//         update =>
//           update.call(el =>
//             el
//               .transition(t)
//               .attr('cx', d => xScale(d[xCol]))
//               .attr('cy', d => yScale(d[yCol])),
//           ),
//       )
//       .attr('fill', (_, idx) => interpolateTurbo(idx / 406))
//       .attr('r', 5)
//       .on('mouseenter', function(d, x) {
//         tooltip
//           .style('display', 'block')
//           .style('left', `${d.offsetX}px`)
//           .style('top', `${d.offsetY}px`)
//           .text(x.Name);
//       })
//       .on('mouseleave', function(d, x) {
//         tooltip.style('display', 'none').text('');
//       });
//     xAxis.call(axisBottom(xScale));
//     yAxis.call(axisLeft(yScale));

//     select('.x-label text').text(xCol);
//     select('.y-label text').text(yCol);
//   }
// }

//////////////////////////////
// ATTEMPT AT SIMPLE CHLOROPLETH
import {select} from 'd3-selection';
import './main.css';
import * as d3 from "d3";
import * as topojson from "topojson-client";

Promise.all([
  d3.json("https://unpkg.com/us-atlas@3/counties-10m.json"),
  d3.csv("../data/sector.csv")
]).then(results => {
  console.log("Data imported.")
  const [us, data] = results;
  //const sectorData = {}
  //data.forEach(d => (sectorData.get(data.d._id)))
  myVis(data, us);
})

// function sectorLookUp(data) {
//   return d3.map(data, function(d) { return d.FIPS; });
// }

function myVis(data, us){

  // See data
  console.log('data', data);
  console.log('us', us);

  // Set constants
  var margin = {top: 0, right: 0, bottom: 0, left: 0}
  let width = 960 - margin.left - margin.right
  let height = 600 - margin.top - margin.bottom;
  var projection = d3.geoAlbersUsa().scale(1000).translate([450, 300]);
  let path = d3.geoPath().projection(projection)

  // Set colors
  const color = d3.scaleOrdinal()
  .domain(["Farming", "Government", "Manufacturing", "Mining", "Nonspecialize", "Recreation"])
  .range(['#A89938', '#E49B25', '#74AA90', '#3D405B', '#E6DFB3', '#E07A5F']);

  // Create SVG
  let svg = d3.select("#app")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  
  // Define SVG container
  let g = svg.append("g")

  // Add counties and populate map
  g.attr("class", "county").selectAll("path")
      .data(topojson.feature(us, us.objects.counties).features)
      .join("path")
      .attr("d", path)
      .style("fill", function(d) {     
          return color(data[d.id])
      ;})
      .attr("stroke", "#EEEEEE")
      
  // Don't know what this does
  // g.append("path")
  //     .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
  //     .attr("fill", "none")
  //     .attr("stroke", "white")
  //     .attr("d", path);

  var legend = svg.selectAll('g.legendEntry')
      .data(color.range())
      .enter()
      .append('g').attr('class', 'legendEntry')
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
  
  legend
      .append('rect')
      .attr("x", width - 120)
      .attr("y", height - 200)
      .attr("width", 10)
      .attr("height", 10)
      .style("stroke", "black")
      .style("stroke-width", 1)
      .style("fill", function(d){return d;}); 


}
