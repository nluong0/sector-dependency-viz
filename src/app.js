import {select} from 'd3-selection';
import './main.css';
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { schemeGnBu } from 'd3';

Promise.all([
  d3.json("https://unpkg.com/us-atlas@3/counties-10m.json"),
  d3.csv("../data/sector.csv")
]).then(results => {
  console.log("Data imported.")
  const [us, data] = results;
  myVis(data, us);
})

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
  .domain(["Farming", "Government", "Manufacturing", "Mining", "Nonspecialized", "Recreation"])
  .range(['#A89938', '#E49B25', '#74AA90', '#3D405B', '#E6DFB3', '#E07A5F']);

  // Define SVG elements
  const svgContainer = select('#map')
    .append('div')
    .style('position', 'relative');
  
  const svg = svgContainer
  .append('svg')
  .attr('height', height)
  .attr('width', width)
  .attr('transform', `translate(${margin.left}, ${margin.top})`);
  
  const g = svg.append("g")

  const tooltip = svg
    .append('div')
    .attr('id', 'tooltip')
    .text('please see me');

  // Add counties and populate map
  g.attr("class", "county").selectAll("path")
      .data(topojson.feature(us, us.objects.counties).features)
      .join("path")
      .attr("d", path)
      .attr("fill", function(d) { 
        let fipsFromBoundaries = d.id
        var matchedRow = data.find((row) => {
            return row['id'] === fipsFromBoundaries
        })
        if (fipsFromBoundaries.charAt(0) === '0') {
            matchedRow = data.find((row) => {
                return row['id'] === fipsFromBoundaries.slice(1)
            })
        }
        if (typeof matchedRow !== 'undefined') {
            return color(matchedRow.all_sector_dependencies)
        }
      ;})
      .attr("stroke", "#EEEEEE")

  // Create tooltip
  svg
  .selectAll(".county")
  .on("mouseover", function(d) {
    var countyName = d.target.__data__.properties.name;
    console.log('countyName', countyName);

    let fipsFromBoundaries = d.target.__data__.id
    var matchedRow = data.find((row) => {
        return row['id'] === fipsFromBoundaries
    });
    if (fipsFromBoundaries.charAt(0) === '0') {
        matchedRow = data.find((row) => {
            return row['id'] === fipsFromBoundaries.slice(1)
          })
    };
    var stateName = matchedRow.State;
    console.log('stateName', stateName);

    tooltip
      .style('display', 'box')
      .style('left', `${d.offsetX}px`)
      .style('top', `${d.offsetY}px`)
      .text(countyName);
    })
    .on('mouseleave', function(d) {
      tooltip.style('display', 'none').text('');
    });

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