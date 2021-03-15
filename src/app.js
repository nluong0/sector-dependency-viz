//////////////////////////////
// SIMPLE MOVING SCATTERPLOT

import './main.css';
import {scaleLinear} from 'd3-scale';
import {select} from 'd3-selection';
import {axisBottom, axisLeft} from 'd3-axis';
import {extent} from 'd3-array';
import {transition} from 'd3-transition';
import {interpolateTurbo} from 'd3-scale-chromatic';
import {csv, tsv, json} from 'd3-fetch';
import COUNTYSHAPES from '../data/countyShapes.json';

// Get sector data 
const sectorData = csv('./data/proj-data.csv')
  .then(data => addCountyGeometry(data, COUNTYSHAPES))  
  .then(data => myVis(data))
  .catch(e => {
    console.log(e);
  });

// Link sector data to county shapes
function addCountyGeometry(data, geom) {
  const rv = data.map(d => ({...d, ...geom.find(s => s.id === d.FIPS)}));
  console.log('rv columns', Object.keys(rv[0]));
  return rv;
}

const height = 500;
const width = 400;
const margin = {top: 10, left: 50, right: 10, bottom: 50};
const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.top - margin.bottom;

function myVis(data) {
  console.log(data);
  const columns = Object.keys(data[0]);
  let xCol = columns[4];
  let yCol = columns[6];

  const dropdowns = select('#app')
    .append('div')
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .selectAll('.drop-down')
    .data(['Variable 1', 'Variable 2'])
    .join('div');

  dropdowns.append('div').text(d => d);
  dropdowns
    .append('select')
    .on('change', (event, x) => {
      if (x === 'xCol') {
        xCol = event.target.value;
      } else {
        yCol = event.target.value;
      }
      renderPlot();
    })

    .selectAll('option')
    .data(dim => columns.map(key => ({key, dim})))
    .join('option')
    .text(d => d.key)
    .property('selected', d => d.key === (d.dim === 'xCol' ? xCol : yCol));

  const svgContainer = select('#app')
    .append('div')
    .style('position', 'relative');
  const svg = svgContainer
    .append('svg')
    .attr('height', height)
    .attr('width', width)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  const xAxis = svg
    .append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${plotHeight})`);
  const yAxis = svg.append('g').attr('class', 'y-axis');
  svg
    .append('g')
    .attr('class', 'x-label')
    .attr('transform', `translate(${width / 2}, ${height - 20})`)
    .append('text')
    .text(xCol)
    .attr('text-anchor', 'middle');

  svg
    .append('g')
    .attr('class', 'y-label')
    .attr('transform', `translate(${-margin.left / 2}, ${plotHeight / 2})`)
    .append('text')
    .text(yCol)
    .attr('transform', `rotate(-90)`)
    .attr('text-anchor', 'middle');

  const tooltip = svgContainer
    .append('div')
    .attr('id', 'tooltip')
    .text('hi im a tooltip');

  renderPlot();

  function renderPlot() {
    const t = transition().duration();
    const xScale = scaleLinear()
      .domain(extent(data, d => d[xCol]))
      .range([0, plotWidth]);
    const yScale = scaleLinear()
      .domain(extent(data, d => d[yCol]))
      .range([plotHeight, 0]);
    svg
      .selectAll('circle')
      .data(data)
      .join(
        enter =>
          enter
            .append('circle')
            .attr('cx', d => xScale(d[xCol]))
            .attr('cy', d => yScale(d[yCol])),

        update =>
          update.call(el =>
            el
              .transition(t)
              .attr('cx', d => xScale(d[xCol]))
              .attr('cy', d => yScale(d[yCol])),
          ),
      )
      .attr('fill', (_, idx) => interpolateTurbo(idx / 406))
      .attr('r', 5)
      .on('mouseenter', function(d, x) {
        tooltip
          .style('display', 'block')
          .style('left', `${d.offsetX}px`)
          .style('top', `${d.offsetY}px`)
          .text(x.Name);
      })
      .on('mouseleave', function(d, x) {
        tooltip.style('display', 'none').text('');
      });
    xAxis.call(axisBottom(xScale));
    yAxis.call(axisLeft(yScale));

    select('.x-label text').text(xCol);
    select('.y-label text').text(yCol);
  }
}

//////////////////////////////
// ATTEMPT AT SIMPLE CHLOROPLETH

// // The svg
// var svg = d3.select("#my_dataviz"),
//   width = 500,
//   height = 500;

// // Map and projection
// var path = d3.geoPath();
// var projection = d3.geoMercator()
//   .scale(70)
//   .center([0,20])
//   .translate([width / 2, height / 2]);

// // Data and color scale
// var data = d3.map();
// var colorScale = d3.scaleThreshold()
//   .domain([100000, 1000000, 10000000, 30000000, 100000000, 500000000])
//   .range(d3.schemeBlues[7]);

// // Load external data and boot
// d3.queue()
// .defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
// .defer(d3.csv, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world_population.csv", function(d) { data.set(d.code, +d.pop); })
// .await(ready);

// function ready(error, topo) {

//   let mouseOver = function(d) {
//     d3.selectAll(".Country")
//       .transition()
//       .duration(200)
//       .style("opacity", .5)
//     d3.select(this)
//       .transition()
//       .duration(200)
//       .style("opacity", 1)
//       .style("stroke", "black")
//   }

//   let mouseLeave = function(d) {
//     d3.selectAll(".Country")
//       .transition()
//       .duration(200)
//       .style("opacity", .8)
//     d3.select(this)
//       .transition()
//       .duration(200)
//       .style("stroke", "transparent")
//   }

//   // Draw the map
//   svg.append("g")
//     .selectAll("path")
//     .data(topo.features)
//     .enter()
//     .append("path")
//       // draw each country
//       .attr("d", d3.geoPath()
//         .projection(projection)
//       )
//       // set the color of each country
//       .attr("fill", function (d) {
//         d.total = data.get(d.id) || 0;
//         return colorScale(d.total);
//       })
//       .style("stroke", "transparent")
//       .attr("class", function(d){ return "Country" } )
//       .style("opacity", .8)
//       .on("mouseover", mouseOver )
//       .on("mouseleave", mouseLeave )
//     }
      
