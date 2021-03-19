import {select} from 'd3-selection';
import './main.css';
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { schemeGnBu } from 'd3';

Promise.all([
  d3.json("https://unpkg.com/us-atlas@3/counties-10m.json"),
  d3.csv("data/sector.csv")
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
  
  const tooltip = svgContainer
    .append('div')
    .attr('id', 'tooltip');

  // Function to find correct data row for boundaries
  function findSectorData(data, fipsFromBoundaries) {
    var matchedRow = data.find((row) => {
      return row['id'] === fipsFromBoundaries
    })
    if (fipsFromBoundaries.charAt(0) === '0') {
      matchedRow = data.find((row) => {
          return row['id'] === fipsFromBoundaries.slice(1)
      })
  }
    return matchedRow;
  }

  // Add counties and populate map
  svg
    .append("g")
    .attr("class", "county")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.counties).features)
    .join("path")
    .attr("d", path)
    .style("fill", function(d) { 
      let matchedRow = findSectorData(data, d.id)
      if (typeof matchedRow !== 'undefined') {
          return color(matchedRow.all_sector_dependencies)
      }
    ;})

  // Setting stroke
  // Counties
  svg
    .selectAll(".county")
    .attr("stroke", "none");
  // States
  // svg
  //   .select("g")
  //   .append("path")
  //   .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
  //   .attr("fill", "none")
  //   .attr("stroke", "black")
  //   .attr("d", path);

  // Format tooltip
  function callout(g, value) {
    if (!value) return g.style("display", "none");

    g.style("display", null)
        .style("pointer-events", "none")
        .style("font", "10px sans-serif");

    var path = g
        .selectAll("path")
        .data([null])
        .join("path")
        .attr("fill", "white")
        .attr("stroke", "black");

    var text = g
        .selectAll("text")
        .data([null])
        .join("text")
        .call(function(text) {
            text.selectAll("tspan")
                .data((value + "").split("/\n/"))
                .join("tspan")
                .attr("x", 0)
                .attr("y", function(d, i) {
                    return i * 1.1 + "em";
                })
                .style("font-weight", function(_, i) {
                    return i ? null : "bold";
                })
                .text(function(d) {
                    return d;
                });
        });

    var x = text.node().getBBox().x;
    var y = text.node().getBBox().y;
    var w = text.node().getBBox().width;
    var h = text.node().getBBox().height;

    text.attr(
        "transform",
        "translate(" + -w / 2 + "," + (15 - y) + ")"
    );
    path.attr(
        "d",
        "M" +
            (-w / 2 - 10) +
            ",5H-5l5,-5l5,5H" +
            (w / 2 + 10) +
            "v" +
            (h + 20) +
            "h-" +
            (w + 20) +
            "z"
    );
  }

  // Create tooltip
  svg
    .selectAll(".county")
    .on("mouseover", function(d) {
      console.log('td.target', d.target)
      console.log('d.target.__data__.id', d.target.__data__.id)
      //let countyName = d.target.__data__.properties.name;
      let matchedRow = findSectorData(data, d.target.__data__.id);
      var displayText = displayText = 'No Data';

      if (matchedRow) {
        var countyName = matchedRow.County;
        var stateName = matchedRow.State;
        displayText = countyName + ', ' + stateName;
      };

      // tooltip
      //   .style('display', 'box')
      //   .style('left', `${d.offsetX}px`)
      //   .style('top', `${d.offsetY}px`)
      //   .text(displayText);

      // tooltip.call(
      //   callout,
      //   countyName + "/\n/" + stateName
      // );
      
      d3.select(d.target)
        .attr("stroke", "red")
        .raise();

    })
    // .on("mousemove", function() {
    //   tooltip.attr(
    //       "transform",
    //       "translate(" +
    //           d3.mouse(this)[0] +
    //           "," +
    //           d3.mouse(this)[1] +
    //           ")"
    //   );
    // })
    .on('mouseout', function(d) {
      // tooltip
      //   .style('display', 'none')
      //   .text('');
      //tooltip.call(callout, null)

      d3.select(d.target)
        .attr("stroke", "none")
        .lower();
    });

  // Create legend
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

// add mouseleave to entire svg not just tooltip