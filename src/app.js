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

  // Create SVG
  let svg = d3.select("#map")
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
      .attr("fill", function(d) { 
        let fipsFromBoundaries = d.id
        var matchedRow = data.find((row) => {
            return row['id'] === fipsFromBoundaries
        })
        if (fipsFromBoundaries.charAt(0) === '0') {
            matchedRow = data.find((row) => {
                return row['id'] === fipsFromBoundaries.slice(1)
            })
            console.log('fipsFromBoundaries', fipsFromBoundaries)
            console.log('matchedRow', matchedRow)
        }
        if (typeof matchedRow !== 'undefined') {
            return color(matchedRow.all_sector_dependencies)
        }
      ;})
      .attr("stroke", "#EEEEEE")
  
//   g.attr("fill", (data) => {
//     let fips = data['id']
//     let county = us.find((county) => {
//         return county['fips'] === fips
//     })
//     let percentage = county['bachelorsOrHigher']
//     if (percentage <= 15){
//         return 'tomato'
//     }else if (percentage <= 30){
//         return 'orange'
//     } else if (percentage <= 45){
//         return 'lightgreen'
//     } else {
//         return 'limegreen'
//     }
//   })
      
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