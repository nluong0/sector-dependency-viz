import {select} from 'd3-selection';
import './main.css';
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { count, schemeGnBu } from 'd3';

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

  // Set constraints for map
  var margin = {top: 0, right: 0, bottom: 0, left: 0}
  let width = 960 - margin.left - margin.right
  let height = 600 - margin.top - margin.bottom;
  var projection = d3.geoAlbersUsa().scale(1000).translate([450, 300]);
  let path = d3.geoPath().projection(projection)

  // Set colors
  let uniqueSectors = ["Farming", "Government", "Manufacturing", "Mining", "Nonspecialized", "Recreation"];
  const color = d3.scaleOrdinal()
    .domain(uniqueSectors)
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
    .attr('id', 'tooltip')
    .style('display', 'none');

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

  // Add options to dropdown
  d3.select("#selectButton")
    .selectAll('myOptions')
    .data(['All'].concat(uniqueSectors))
    .enter()
    .append('option')
    .text(function (d) { return d; })
    .attr("value", function (d) { return d; })

  // Manage updates with dropdown selections
  d3.select('#selectButton')
    .on("change", function(d) {
      // Grab selected option
      var selectedSector = d3.select(this).property("value")
      // Filter data according to selected option
      var dataFilter = data.filter(function(d){return d.all_sector_dependencies==selectedSector})
      if (selectedSector === 'All') {
        dataFilter = data
      }
      // Render plot with filtered data
      renderMap(dataFilter)
      renderScatter(dataFilter, true)
  });

  renderMap(data);
  renderScatter(data, false);

  function renderMap(data) {

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
      if (typeof matchedRow !== "undefined") {
          return color(matchedRow.all_sector_dependencies)
      }
      else {
        return "#C8C8C8"
      }
    ;}
    )

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
          .style("font", "10px Avenir");
  
      var path = g
          .selectAll("path")
          .data([null])
          .join("path")
          .attr("fill", "white")
          .attr("stroke", "black");
  
      console.log('it', (value + "").split("/\n/"))
      
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
                     return i * 2 + "em";
                  })
                  .style("font-weight", function(_, i) {
                      return i ? null : "bold";
                  })
                  .text(function(d) {
                      return d;
                  });
          });
    }
  
    // Create tooltip
    svg
      .selectAll(".county")
      .on("mouseover", function(d) {
  
        let matchedRow = findSectorData(data, d.target.__data__.id);
        var displayText = 'No Data';
  
        if (matchedRow) {
          var countyName = matchedRow.County;
          var stateName = matchedRow.State;
          var sector = matchedRow.all_sector_dependencies;
          displayText = sector + "/\n/" + ' ' + countyName + ', ' + stateName;
        };
  
        tooltip.call(
          callout,
          displayText
        )
        .style('left', `${d.offsetX}px`)
        .style('top', `${d.offsetY}px`);
        
        d3.select(d.target)
          .attr("stroke", "black")
          .raise();
  
      })
      .on('mouseout', function(d) {
        tooltip.call(callout, null)
  
        d3.select(d.target)
          .attr("stroke", "none")
          .lower();
      });
  
    // Create legend
    var legend = svg.selectAll('g.legend')
        .data(color.range())
        .enter()
        .append('g').attr('class', 'legend')
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend
        .append('rect')
        .attr("x", width - 150)
        .attr("y", height - 200)
        .attr("width", 10)
        .attr("height", 10)
        .style("stroke", 'none')
        .style("fill", function(d){return d;}); 
    
    legend
        .append('text')
        .attr("x", width - 130) 
        .attr("y", height - 200)
        .attr("dy", "0.9em")
        .text(function(d, i) {
            return uniqueSectors[i]
        });
  }

  function renderScatter(data, update) {

    // Constraints for scatter
    //const height = 400;
    //const width = 500;
    const margin = {top: 10, left: 120, right: 10, bottom: 50};
    let width = 1300 - margin.left - margin.right
    let height = 600 - margin.top - margin.bottom;
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // Remove elements and redraw if updating for sector
    if (update) {
      d3.selectAll("#scatter")
      .select("div")
      .remove();

    d3.selectAll("#scatter")
      .select("svg")
      .remove();
    }

    // Get all possible variables
    var columns = Object.keys(data[0]);
    console.log(columns)
    columns = columns.filter(val => 
      !['id', 'all_sector_dependencies', 'State', 'County'].includes(val)
    );
    let xCol = columns[18]; // Set default to Median Income
    let yCol = columns[8]; // Set default to Percent Less than High School
  
    // Create dropdowns
    const dropdowns = select('#scatter')
      .append('div')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .selectAll('.drop-down')
      .data(['xCol', 'yCol'])
      .join('div');
    dropdowns
      .append('div')
      .text(d => d);
  
    // Render plot with selections from dropdown
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
  
    // Define SVG Elements and axes
    const svgContainer = select('#scatter')
      .select('div')
      .attr('id', 'svgContainer')
      .style('position', 'relative');  
    const svg = svgContainer
      .append('svg')
      .attr('id', 'svg')
      .attr('height', height)
      .attr('width', width)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    const xAxis = svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${plotHeight})`);
    const yAxis = svg.append('g').attr('class', 'y-axis');
    const tooltip = svgContainer
    .append('div')
    .attr('id', 'scatter-tooltip');
    
    // Adjust SVG place on page
    svg
      .append('g')
      .attr('class', 'x-label')
      .attr('transform', `translate(${width / 2}, ${height - 20})`)
      .append('text')
      .text(xCol)
      .attr('text-anchor', 'middle')
  
    svg
      .append('g')
      .attr('class', 'y-label')
      .attr('transform', `translate(${-margin.left / 2}, ${plotHeight / 2})`)
      .append('text')
      .text(yCol)
      .attr('transform', `rotate(-90)`)
      .attr('text-anchor', 'middle');

  
    renderPlot();
  
    function renderPlot() {

      const t = d3.transition().duration();

      const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d[xCol]))
        .range([0, plotWidth]);

      const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d[yCol]))
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
        .style('fill', '#6e4555')
        .style('opacity', 0.5)
        .style('stroke', 'white')
        .attr('r', 3)
        .on('mouseenter', function(d, x) {
          // tooltip
          //   .style('display', 'block')
          //   .style('left', `${d.offsetX}px`)
          //   .style('top', `${d.offsetY}px`)
          //   .text('just see me');
          tooltip.call(
            callout,
            'just see me'
          )
          .style('left', `${d.offsetX}px`)
          .style('top', `${d.offsetY}px`)
        })
        .on('mouseleave', function(d, x) {
          //tooltip.style('display', 'none').text('');
          tooltip.call(callout, null)
        });
      
      xAxis.call(d3.axisBottom(xScale));
      yAxis.call(d3.axisLeft(yScale));
  
      select('.x-label text').text(xCol);
      select('.y-label text').text(yCol);
    }
  }

}

