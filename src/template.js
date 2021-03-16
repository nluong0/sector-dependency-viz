import {myExampleUtil} from './utils';
import {select} from 'd3-selection';
import './main.css';

import * as d3 from "d3";
import * as topojson from "topojson-client";
import scrollama from "scrollama";
import "intersection-observer";
//import * as d3Collection from 'd3-collection';

//npm install d3 --save
//npm install topojson-client
//npm install scrollama intersection-observer --save
//npm install d3-collection


// this is just one example of how to import data. there are lots of ways to do it!

Promise.all([
    //d3.json("https://unpkg.com/us-atlas@1/us/10m.json"),
    d3.json("https://unpkg.com/us-atlas@3/counties-10m.json"),
    d3.csv("data/transit.csv"),
    d3.csv("data/cities.csv"),
    d3.csv("data/time.csv"),
    d3.csv("data/income.csv"),
    d3.csv("data/donut_data.csv")
]).then(results => {
    console.log("loading data")
    const [us, data, cities, time, income, donut_data] = results;
    const transit_data = {}
    data.forEach(d => (transit_data[d.GEOID] = d.percent_transit))
    const time_data = {}
    time.forEach(d => (time_data[d.GEOID] = d.time))
    const income_data = {}
    income.forEach(d => (income_data[d.GEOID] = d.gap + 1))
    myVis(us, transit_data, cities, time_data, income_data)
    donut(donut_data)
})


function myVis(us, data, cities, time_data, income_data){

    var margin = {top: 0, right: 0, bottom: 0, left: 0}
    let width = 960 - margin.left - margin.right
    let height = 600 - margin.top - margin.bottom;
    var projection = d3.geoAlbersUsa().scale(1100).translate([487.5, 305]);
    let path = d3.geoPath().projection(projection)

    
    const color = d3.scaleThreshold()
        .domain([.1, .2, .5, 1, 2, 5, 10, 20])
        //.range(d3.schemeBuPu[9])
        .range(["#f1fbfb", "#bfd3e6", "#9ebcda", "#8c96c6",
        "#8c6bb1", "#88419d", "#732b6d", "#4d004b", "#3f0722"]);
    
    const color1 = d3.scaleThreshold()
        .domain([0.5, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 3.0])
        .range(["#e9effb",
        "#dee7f8",
        "#d0d1e6",
        "#a6bddb",
        "#74a9cf",
        "#3690c0",
        "#0570b0",
        "#045a8d",
        "#023858"]);
  
    // Create SVG
    let svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    
    let g = svg.append("g")


function update1(){
    svg.selectAll(".textCity").remove();
    svg.selectAll(".subtitle").remove();
    svg.selectAll(".titleMap").remove();
    svg.selectAll(".source").remove();

    d3.selectAll("circle").remove();

    d3.selectAll("g.legendEntry")
        .remove();
    // Bind TopoJSON data
    g.attr("class", "county").selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features) // Bind TopoJSON data elements
    // pass through what objects you want to use -- in this case we are doing county lines
        .join("path")
        .attr("d", path)
        .style("fill", function(d) {      
            return color(data[d.id])  
        ;})
        .attr("stroke", "#EEEEEE")
        
    g.append("path")
        .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("d", path);
    
    svg.selectAll("circle")
        .data(cities)
        .enter()
        .append("circle")
        .attr("cx",function(d) { return projection([d.lon,d.lat])[0];
        })
        .attr("cy",function(d) { return projection([d["lon"],d["lat"]])[1];
        })
        .style("opacity", 0.7)
        .attr("r",4)
        
    g.selectAll("text")
        .data(cities)
        .enter()
        .append("text")
        .text(function(d){
            return d.city;
        })
        .attr("x",function(d) { return projection([d.lon,d.lat])[0];
        })
        .attr("y",function(d) { return projection([d["lon"],d["lat"]])[1];
        })
        .attr("class", "textCity")
        .attr("id", "textCity")
        .attr("text-anchor","right")
        .attr('font-size','8pt')
        .attr("font-weight", 550)

    var legend = svg.selectAll('g.legendEntry')
        .data(color.range().reverse())
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
    
    legend
       .append('text')
       .attr("x", width - 100) //leave 5 pixel space after the <rect>
       .attr("y", height - 200)
       .attr("dy", "0.8em") //place text one line *below* the x,y point
       .text(function(d,i) {
           var extent = color.invertExtent(d);
           if (extent[0] == null) extent[0] = 0;
           if (extent[1] == null) extent[1] = 61;
           //extent will be a two-element array, format it however you want:
           var format = d3.format("0.1f");
           return format(+extent[0]) + " - " + format(+extent[1]);
       });
    
    //Create Title 
    svg.append("text")
        .attr("x", width/2)             
        .attr("y", 30)
        .attr("class", "titleMap")
        .attr("id", "titleMap")
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .attr("font-weight", 550)
        .text("Percentage of public transit commuters by county");
    
    svg.append("text")
        .attr("x", width/2)             
        .attr("y", 55)
        .attr("class", "subtitle")
        .attr("id", "subtitle")
        .attr("text-anchor", "start")  
        .style("font-size", "14px")
        .style("text-anchor", "middle") 
        .attr("font-weight", 550)
        .style("fill", "#696969")
        .text("At least 0% commuters use public transit");

    svg.append("text")
        .attr("x", 80)             
        .attr("y", height - 10)
        .attr("class", "source")
        .attr("id", "source")
        .attr("text-anchor", "start")  
        .style("font-size", "10px")
        .style("text-anchor", "start") 
        //.attr("font-weight", 550)
        .style("fill", "#696969")
        .text("Source: American Community Survey 5-Year Data (2019)");
 
        transition1()
    }
    

    function transition1(){
        const vals =  [.1, .2, .5, .6, .7, .8, .8, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 35, 40, 65, 0]
        let delay = 2000
        
            vals.forEach( (val, idx) => {
            timeOuts.push(setTimeout(function () {
                mytransition1(val);
            }, delay));
            delay += 500;
        })
    
    g.append("path")
        .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("d", path);
}
  
    function mytransition1(val){
        g.selectAll("path").data(topojson.feature(us, us.objects.counties).features)
                .join("path")
                .attr("d", path)
                .transition().delay(0)
                .style("fill", function(d) {
                if (data[d.id] >= val) {return color(data[d.id])}
                else { return "#EEEEEE" }           
            ;}).duration(0)
        
        d3.selectAll("circle").remove();
        svg.selectAll("circle")
            .data(cities.filter(function(d) { return (data[d.county] >= val) }))
            .enter()
            .append("circle")
            .attr("cx",function(d) { return projection([d.lon,d.lat])[0];
            })
            .attr("cy",function(d) { return projection([d["lon"],d["lat"]])[1];
            })
            .style("opacity", 0.7)
            .attr("r",4)
     
        svg.selectAll(".textCity").remove();
        g.selectAll("text")
            .data(cities.filter(function(d) { return (data[d.county] >= val) }))
            .enter()
            .append("text")
            .text(function(d){
            return d.city;
            })
            .attr("x",function(d) { return projection([d.lon,d.lat])[0];
            })
            .attr("y",function(d) { return projection([d["lon"],d["lat"]])[1];
            })
            .attr("class", "textCity")
            .attr("id", "textCity")
            .attr("text-anchor","right")
            .attr('font-size','8pt')
            .attr("font-weight", 550)
        
            svg.selectAll(".subtitle").remove();

            svg.append("text")
                .attr("x", width/2)             
                .attr("y", 55)
                .attr("class", "subtitle")
                .attr("id", "subtitle")
                .attr("text-anchor", "start")  
                .style("font-size", "14px")
                .style("text-anchor", "middle") 
                .attr("font-weight", 550)
                .style("fill", "#696969")
                .text(`At least ${val}% of commuters use public transit`);

    }


function update2(){
 
    d3.selectAll("path").interrupt();

    g.selectAll("path").data(topojson.feature(us, us.objects.counties).features)
        .join("path")
        .attr("d", path)
        .transition()
        //.style("fill", d => color1(time_data[d.id]))
        .style("fill", d => (d.id in time_data) ? color1(time_data[d.id]) : "#EEEEEE")
    
    g.append("path")
        .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("d", path);
    
    svg.selectAll(".textCity").remove();
    svg.selectAll(".subtitle").remove();
    svg.selectAll(".titleMap").remove();
    svg.selectAll(".source").remove();

    d3.selectAll("circle").remove();
    
    d3.selectAll("g.legendEntry")
        .remove();
    
    svg.selectAll("circle")
        .data(cities)
        //.data(cities.filter(function(d) { return (d.county in time_data)}))
        .enter()
        .append("circle")
        .attr("cx",function(d) { return projection([d.lon,d.lat])[0];
            })
        .attr("cy",function(d) { return projection([d["lon"],d["lat"]])[1];
            })
        .style("opacity", 0.7)
        .attr("r",4)
     
    g.selectAll("text")
        .data(cities)
        .enter()
        .append("text")
        .text(function(d){
            return d.city;
        })
        .attr("x",function(d) { return projection([d.lon,d.lat])[0];
            })
        .attr("y",function(d) { return projection([d["lon"],d["lat"]])[1];
            })
        .attr("class", "textCity")
        .attr("id", "textCity")
        .attr("text-anchor","right")
        .attr('font-size','8pt')
        .attr("font-weight", 550)
    
    var legend = svg.selectAll('g.legendEntry')
        .data(color1.range().reverse())
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
    
    legend
       .append('text')
       .attr("x", width - 100) //leave 5 pixel space after the <rect>
       .attr("y", height - 200)
       .attr("dy", "0.8em") //place text one line *below* the x,y point
       .text(function(d,i) {
           var extent = color1.invertExtent(d);
           if (extent[0] == null) extent[0] = 0;
           if (extent[1] == null) extent[1] = 5;
           var format = d3.format("0.1f");
           return format(+extent[0]) + " - " + format(+extent[1]);});

    //Create Title 
    svg.append("text")
        .attr("x", width/2)             
        .attr("y", 30)
        .attr("class", "titleMap")
        .attr("id", "titleMap")
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .attr("font-weight", 550)
        .text("Additional commute lenght for public transit users");
    
    svg.append("text")
        .attr("x", width/2)             
        .attr("y", 55)
        .attr("class", "subtitle")
        .attr("id", "subtitle")
        .attr("text-anchor", "start")  
        .style("font-size", "14px")
        .style("text-anchor", "middle") 
        .attr("font-weight", 550)
        .style("fill", "#696969")
        .text("Using public transit takes less than 5 times as than driving");
    
    svg.append("text")
        .attr("x", 80)             
        .attr("y", height-10)
        .attr("class", "source")
        .attr("id", "source")
        .attr("text-anchor", "start")  
        .style("font-size", "10px")
        .style("text-anchor", "start") 
        //.attr("font-weight", 550)
        .style("fill", "#696969")
        .text("Source: American Community Survey 5-Year Data (2019)");

        transition2()

        g.append("path")
            .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("d", path);
    }
    
    function transition2(){

        const vals = [5.0, 3.5, 3.0, 2.8, 2.6, 2.4, 2.2, 2.0, 1.9, 1.8, 1.7, 1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1.0, 0.5, 0, 5]
        let delay = 2000
        vals.forEach( (val, idx) => {
            timeOuts.push(setTimeout(function () {
                    mytransition2(val);
                }, delay));
                delay += 500;
            })   
    }
      
    function mytransition2(val){
        
        g.selectAll("path").data(topojson.feature(us, us.objects.counties).features)
            .join("path")
            .attr("d", path)
            .transition().delay(0)
            .style("fill", function(d) {
                    if (time_data[d.id] <= val) {return color1(time_data[d.id])}
                    else { return "#EEEEEE" }           
            ;}).duration(0)
            
        d3.selectAll("circle").remove();

        svg.selectAll("circle")
            .data(cities.filter(function(d) { return (time_data[d.county] <= val) }))
            .enter()
            .append("circle")
            .attr("cx",function(d) { return projection([d.lon,d.lat])[0];
                })
            .attr("cy",function(d) { return projection([d["lon"],d["lat"]])[1];
                })
            .style("opacity", 0.7)
            .attr("r",4)
         
            svg.selectAll(".textCity").remove();
            g.selectAll("text")
                .data(cities.filter(function(d) { return (time_data[d.county] <= val) }))
                .enter()
                .append("text")
                .text(function(d){
                return d.city;
                })
                .attr("x",function(d) { return projection([d.lon,d.lat])[0];
                })
                .attr("y",function(d) { return projection([d["lon"],d["lat"]])[1];
                })
                .attr("class", "textCity")
                .attr("id", "textCity")
                .attr("text-anchor","right")
                .attr('font-size','8pt')
                .attr("font-weight", 550)
            
            svg.selectAll(".subtitle").remove();
    
            svg.append("text")
                .attr("x", width/2)             
                .attr("y", 55)
                .attr("class", "subtitle")
                .attr("id", "subtitle")
                .attr("text-anchor", "start")  
                .style("font-size", "14px")
                .style("text-anchor", "middle") 
                .attr("font-weight", 550)
                .style("fill", "#696969")
                .text(`Using public transit takes less than ${val} times as than driving`);
    
        }


function update3(){
     
    const color2 = d3.scaleThreshold()
        .domain([0, 0.2, 0.6, 0.8, 1.0, 1.5, 2.0, 2.5])
        .range(["#cec2e6",
        "#bebed5",
        "#9fa0c4",
        "#9e9ac8",
        "#807dba",
        "#6a51a3",
        "#54278f",
        "#3f007d",
        "#240050"]);

    g.selectAll("path").data(topojson.feature(us, us.objects.counties).features)
        .join("path")
        .attr("d", path)
        .transition()
        .style("fill", d => (d.id in income_data) ? color2(income_data[d.id]) : "#EEEEEE")
    
    g.append("path")
        .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("d", path);
    
    svg.selectAll(".textCity").remove();
    svg.selectAll(".subtitle").remove();
    svg.selectAll(".titleMap").remove();
    svg.selectAll(".source").remove();

    d3.selectAll("circle").remove();
    
    d3.selectAll("g.legendEntry").remove();
    
    svg.selectAll("circle")
        .data(cities)
        .enter()
        .append("circle")
        .attr("cx",function(d) { return projection([d.lon,d.lat])[0];
            })
        .attr("cy",function(d) { return projection([d["lon"],d["lat"]])[1];
            })
        .style("opacity", 0.7)
        .attr("r",4)
     
    g.selectAll("text")
        .data(cities)
        .enter()
        .append("text")
        .text(function(d){
            return d.city;
        })
        .attr("x",function(d) { return projection([d.lon,d.lat])[0];
            })
        .attr("y",function(d) { return projection([d["lon"],d["lat"]])[1];
            })
        .attr("class", "textCity")
        .attr("id", "textCity")
        .attr("text-anchor","right")
        .attr("font-size","8pt")
        .attr("font-weight", 550)
    
    var legend = svg.selectAll('g.legendEntry')
        .data(color2.range().reverse())
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
    
    legend
       .append('text')
       .attr("x", width - 100) //leave 5 pixel space after the <rect>
       .attr("y", height - 200)
       .attr("dy", "0.8em") //place text one line *below* the x,y point
       .text(function(d,i) {
           var extent = color2.invertExtent(d);
           if (extent[0] == null) extent[0] = -1;
           if (extent[1] == null) extent[1] = 10;
           var format = d3.format("0.1f");
           return format(+extent[0]) + " - " + format(+extent[1]);});

    //Create Title 
    svg.append("text")
        .attr("x", width/2)             
        .attr("y", 30)
        .attr("class", "titleMap")
        .attr("id", "titleMap")
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .attr("font-weight", 550)
        .text("Difference in earnings between drivers and public transit riders");
    
    svg.append("text")
        .attr("x", width/2)             
        .attr("y", 55)
        .attr("class", "subtitle")
        .attr("id", "subtitle")
        .attr("text-anchor", "start")  
        .style("font-size", "14px")
        .style("text-anchor", "middle") 
        .attr("font-weight", 550)
        .style("fill", "#696969")
        .text("Earnings of drivers are less than 10 times the earnings of transit riders");
    
    svg.append("text")
        .attr("x", 80)             
        .attr("y", height -10)
        .attr("class", "source")
        .attr("id", "source")
        .attr("text-anchor", "start")  
        .style("font-size", "10px")
        .style("text-anchor", "start") 
        //.attr("font-weight", 550)
        .style("fill", "#696969")
        .text("Source: American Community Survey 5-Year Data (2019)");
    
    const vals = [10.0, 4.0, 3.5, 3.0, 2.8, 2.6, 2.4, 2.2, 2.0, 1.8, 1.6, 1.4, 1.2, 1.0, 0.8, 0.6, 0.4, 0.2, 0, -0.5, -1, 10.0]
    let delay = 2000
    vals.forEach( (val, idx) => {
        timeOuts.push(setTimeout(function () {
                mytransition3(val);
            }, delay));
            delay += 500;
        })

    g.append("path")
        .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("d", path);
      
    function mytransition3(val){
        
        g.selectAll("path").data(topojson.feature(us, us.objects.counties).features)
            .join("path")
            .attr("d", path)
            .transition().delay(0)
            .style("fill", function(d) {
                    if (income_data[d.id] <= val) {return color2(income_data[d.id])}
                    else { return "#EEEEEE" }           
            ;}).duration(0)
            
        d3.selectAll("circle").remove();

        svg.selectAll("circle")
            .data(cities.filter(function(d) { return (income_data[d.county] <= val) }))
            .enter()
            .append("circle")
            .attr("cx",function(d) { return projection([d.lon,d.lat])[0];
                })
            .attr("cy",function(d) { return projection([d["lon"],d["lat"]])[1];
                })
            .style("opacity", 0.7)
            .attr("r",4)
         
            svg.selectAll(".textCity").remove();
            g.selectAll("text")
                .data(cities.filter(function(d) { return (income_data[d.county] <= val) }))
                .enter()
                .append("text")
                .text(function(d){
                return d.city;
                })
                .attr("x",function(d) { return projection([d.lon,d.lat])[0];
                })
                .attr("y",function(d) { return projection([d["lon"],d["lat"]])[1];
                })
                .attr("class", "textCity")
                .attr("id", "textCity")
                .attr("text-anchor","right")
                .attr('font-size','8pt')
                .attr("font-weight", 550)
            
            svg.selectAll(".subtitle").remove();
    
            svg.append("text")
                .attr("x", width/2)             
                .attr("y", 55)
                .attr("class", "subtitle")
                .attr("id", "subtitle")
                .attr("text-anchor", "start")  
                .style("font-size", "14px")
                .style("text-anchor", "middle") 
                .attr("font-weight", 550)
                .style("fill", "#696969")
                .text(`Earnings of drivers are less than ${val} times the earnings of transit riders`);
            
            
        }
}

var main = d3.select("main");
var scrolly = main.select("#scrolly");
var figure = scrolly.select("figure");
var article = scrolly.select("article");
var step = article.selectAll(".step");
var timeOuts = [];
// initialize the scrollama
var scroller = scrollama();

// generic window resize listener event
function handleResize() {
  // 1. update height of step elements
  var stepH = Math.floor(window.innerHeight * 0.75);
  step.style("height", stepH + "px");

  var figureHeight = window.innerHeight / 2;
  var figureMarginTop = (window.innerHeight - figureHeight) / 2;

  figure
    .style("height", height + "px")
    .style("top", figureMarginTop  + "px");

  // 3. tell scrollama to update new element dimensions
  scroller.resize();
}

// scrollama event handlers
function handleStepEnter(response) {
  // response = { element, direction, index }
  console.log("response.index")
    console.log(response.index)
  // add color to current step only
  step.classed("is-active", function(d, i) {
    return i === response.index;
  });

  // update graphic based on step
  figure.select("p").text(response.index + 1);
  if (response.index + 1 == 1){
    timeOuts.forEach(function(timeOutFn) {
        clearTimeout(timeOutFn);
      });
    update1();
    
  }
  else if (response.index + 1 == 2){
    timeOuts.forEach(function(timeOutFn) {
        clearTimeout(timeOutFn);
      });
    update2()
  }
  else if (response.index + 1 == 3){
    timeOuts.forEach(function(timeOutFn) {
        clearTimeout(timeOutFn);
      });
    update3()
  }
}

function setupStickyfill() {
  d3.selectAll(".sticky").each(function() {
    Stickyfill.add(this);
  });
}

function init() {
  setupStickyfill();

  // 1. force a resize on load to ensure proper dimensions are sent to scrollama
  handleResize();

  // 2. setup the scroller passing options
  // 		this will also initialize trigger observations
  // 3. bind scrollama event handlers (this can be chained like below)
  scroller
    .setup({
      step: "#scrolly article .step",
      offset: 0.66,
      debug: false
    })
    .onStepEnter(handleStepEnter);

  // setup resize event
  window.addEventListener("resize", handleResize);
}

// kick things off
init();

//return svg.node();
    
}

function donut(data){
    // set the dimensions and margins of the graph
    let width = 500
    let height = 500
    let margin = 40

    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    let radius = Math.min(width, height) / 2 - margin

    // append the svg object to the div called 'donut'
    var svg = d3.select("#donut")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    
    svg.append("g")
        .attr("class", "slices");
    svg.append("g")
        .attr("class", "labels");
    svg.append("g")
        .attr("class", "lines");

    // Create dummy data
    //var data = {a: 9, b: 20, c:30, d:8, e:12, f:3, g:7, h:14}
    // set the color scale
    var color = d3.scaleOrdinal()
        .domain(["Driving", "Public transportation", 
        "Bicycle", "Walked", "Worked at home", "Other"])
        .range(d3.schemeSet2);

    // Compute the position of each group on the pie:
    var pie = d3.pie()
        .sort(null) // Do not sort group by size
        .value(function(d) {return d.value; })

    // The arc generator
    var arc = d3.arc()
        .innerRadius(radius * 0.5)         // This is the size of the donut hole
        .outerRadius(radius * 0.8)

    // Another arc that won't be drawn. Just for labels positioning
    var outerArc = d3.arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9)
    
    svg.append("text")
        .attr("x", 0)             
        .attr("y", - height + 300)
        .attr("text-anchor", "middle")  
        .style("font-size", "14px")
        .attr("font-weight", 700) 
        .text("Mode of transportation to work");
    
    svg.append("text")
        .attr("x", -width /2 + 80)             
        .attr("y",  +200)
        .attr("class", "source")
        .attr("id", "source")
        .attr("text-anchor", "start")  
        .style("font-size", "10px")
        .style("text-anchor", "start") 
        //.attr("font-weight", 550)
        .style("fill", "#696969")
        .text("Source: American Community Survey 5-Year Data (2019)");
    
    var key = function(d){ return d.data.key; };

    var legend = svg.selectAll('g.legend')
    .data(color.domain())
    .enter()
    .append('g').attr('class', 'legend')
    .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend
        .append('rect')
        .attr("x", -30)
        .attr("y", -50)
        .attr("width", 10)
        .attr("height", 10)
        .style("stroke", "black")
        .style("stroke-width", 1)
        .style("fill", color); 

    legend
        .append('text')
        .attr("x", -12) //leave 5 pixel space after the <rect>
        .attr("y", -50)
        .attr("dy", "0.8em") //place text one line *below* the x,y point
        .text(function(d) { return d } );

    function update_donut(city){
    
        //var data_ready = pie(d3Collection.entries(city))
    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
        
        //d3.selectAll(".allSlices").remove();


        let slice = svg
            .selectAll("path")
            .data(pie(city), key)
        
            
        slice.enter().append("path")
            .merge(slice)
            .transition()
            .duration(1000)
            .attr("d", arc)
            .attr('fill', function(d){ return(color(d.data.key)) })
            .attr("class", "allSlices")
            .attr("id", "allSlices")
            .attr("stroke", "white")
            .style("stroke-width", "2px")
            .style("opacity", 0.7)
            .attrTween("d", function(d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    return arc(interpolate(t));
                };
            })
        
        slice.exit().remove();
        d3.selectAll("#textSlice.textSlice").remove()
        
        let textSlice = svg
            .selectAll("textSlice")
            .data(pie(city), key)
        
        textSlice.enter().append("text") 
            .merge(textSlice)
            .transition()
            .duration(500)
            .attr("class", "textSlice")
            .attr("id", "textSlice")
            .attr("transform", function(d) {  
            //set the label's origin to the center of the arc
                d.innerRadius = 0;
                d.outerRadius = radius;
                return "translate(" + arc.centroid(d) + ")"; })
            .attr("text-anchor", "middle") 
            .style("font-size", "12px")
            .style("fill", "black")
            .attrTween("d", function(d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    return arc(interpolate(t));
                };
            })
            .text(function(d, i) { 
                if (d.data.value >= .01){
                return Math.round(d.data.value * 100) + "%";}
                else{
                    return ''
                }
            })
        
        //textSlice.exit().remove();
 
        }
    
    var dropdownChange = function() {
            console.log("changed!!!!")
            
            let newCity = d3.select(this).property("value")//,
            let city_all = data.filter(d => d.city == newCity)[0];

            let city = [{"key": "Driving", "value": city_all["Car, truck, or van"] / city_all["Total transport"]},
                {"key": "Public transportation", "value":city_all["Public transportation"] / city_all["Total transport"]}, 
                {"key": "Bicycle", "value": city_all["Bicycle"] / city_all["Total transport"]},
                {"key": "Walked", "value": city_all["Walked"] / city_all["Total transport"]},
                {"key": "Worked at home", "value": city_all["Worked at home"] / city_all["Total transport"]},
                {"key": "Other", "value": city_all["Taxicab, motorcycle, or other"] / city_all["Total transport"]}]
            
            let time = [{"key": "Driving", "value": city_all["Time driving"] / city_all["Car, truck, or van"]},
            {"key": "Public transportation", "value":city_all["Time public transportation"] /city_all["Public transportation"]}, 
            {"key": "Walked", "value": city_all["Time walking"] / city_all["Walked"]},
            {"key": "Other", "value": city_all["Time Taxicab, motorcycle, bicycle, or other"] / (+city_all["Taxicab, motorcycle, or other"] + +city_all["Bicycle"])}]

            let income = [{"key": "Driving", "value": city_all["Earnings Drove alone"]},
            {"key": "Public transportation", "value":city_all["Earnings Public transportation"]}, 
            {"key": "Walked", "value": city_all["Earnings Walked"]},
            {"key": "Worked at home", "value": city_all["Earnings Worked at home"]},
            {"key": "Other", "value": city_all["Earnings Taxicab, motorcycle, bicycle, or other"]}]

            update_donut(city);
            updateBars(time);
            updateIncome(income);
            };

    let cities = data.map(a => a.city).sort();
    
    let dropdown = d3.select("#donut")
                    .insert("select", "svg")
                    .on("change", dropdownChange);
    
        
    dropdown.selectAll("option")
        .data(cities)
        .enter().append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) {
            return d[0].toUpperCase() + d.slice(1,d.length); // capitalize 1st letter
        });
        
    // Handler for dropdown value change
    let anaheim_data = data.filter(d => d.city == "Anaheim")[0]

    let anaheim_donut = [{"key": "Driving", "value": anaheim_data["Car, truck, or van"] / anaheim_data["Total transport"]},
                {"key": "Public transportation", "value":anaheim_data["Public transportation"] / anaheim_data["Total transport"]}, 
                {"key": "Bicycle", "value": anaheim_data["Bicycle"] / anaheim_data["Total transport"]},
                {"key": "Walked", "value": anaheim_data["Walked"] / anaheim_data["Total transport"]},
                {"key": "Worked at home", "value": anaheim_data["Worked at home"] / anaheim_data["Total transport"]},
                {"key": "Other", "value": anaheim_data["Taxicab, motorcycle, or other"] / anaheim_data["Total transport"]}]
    
    let anaheim_time = [{"key": "Driving", "value": anaheim_data["Time driving"] / anaheim_data["Car, truck, or van"]},
                {"key": "Public transportation", "value":anaheim_data["Time public transportation"] / anaheim_data["Public transportation"]}, 
                {"key": "Walked", "value": anaheim_data["Time walking"] / anaheim_data["Walked"]},
                {"key": "Other", "value": anaheim_data["Time Taxicab, motorcycle, bicycle, or other"] / (+anaheim_data["Taxicab, motorcycle, or other"] + +anaheim_data["Bicycle"])}]

    update_donut(anaheim_donut);
    

    ///////TIME CHART////
    var margin_bar = {top: 50, right: 30, bottom: 70, left: 60},
    width_bar = 460 - margin_bar.left - margin_bar.right,
    height_bar = 420 - margin_bar.top - margin_bar.bottom;

    var svg_bar = d3.select("#time")
        .append("svg")
        .attr("width", width_bar + margin_bar.left + margin_bar.right)
        .attr("height", height_bar + margin_bar.top + margin_bar.bottom)
        .append("g")
        .attr("transform",
          "translate(" + margin_bar.left + "," + margin_bar.top + ")");

    // X axis
    var x = d3.scaleBand()
        .range([ 0, width_bar ])
        .padding(0.2);

    var xAxis = svg_bar.append("g")
        .attr("transform", "translate(0," + height_bar + ")")
    

    // Add Y axis
    var y = d3.scaleLinear()
        .range([ height_bar, 0]);
    
    var yAxis = svg_bar.append("g")
        .attr("class", "myYaxis")

    svg_bar.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin_bar.left + 20)
        .attr("x",0 - (height_bar / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "10px")
        .text("Commuting time (minutes)");      
      
    svg_bar.append("text")
        .attr("x", (width_bar / 2))             
        .attr("y", 0 - (margin_bar.top / 2) - 10)
        .attr("text-anchor", "middle")  
        .style("font-size", "14px") 
        .attr("font-weight", 700)
        .text("Average Commute length");
    
    svg_bar.append("text")
        .attr("x", - width_bar/2 + 150 )             
        .attr("y",  height_bar + 50)
        .attr("class", "source")
        .attr("id", "source")
        .attr("text-anchor", "start")  
        .style("font-size", "10px")
        .style("text-anchor", "start") 
        //.attr("font-weight", 550)
        .style("fill", "#696969")
        .text("Source: American Community Survey 5-Year Data (2019)");

    var updateBars = function(city) {
    
        console.log(city)
        x.domain(city.map(function(d) { return d.key; }))
        xAxis.transition().duration(1000).call(d3.axisBottom(x))

        y.domain([0, d3.max(city, function(d) { return d.value; })])
        yAxis.transition().duration(1000).call(d3.axisLeft(y));

    
    // Bars
        var u = svg_bar.selectAll("rect")
            .data(city)
        
        u.enter()
            .append("rect")
            .merge(u)
            .transition()
            .duration(1000)
            .attr("x", function(d) { return x(d.key); })
            .attr("y", function(d) { return y(d.value); })
            .attr("width", x.bandwidth())
            .attr("height", function(d) { return height_bar - y(d.value); })
            .attr("fill", "#726a95")
    }
    updateBars(anaheim_time)

    /// Income Chart

    let anaheim_income = [{"key": "Driving", "value": anaheim_data["Earnings Drove alone"]},
        {"key": "Public transportation", "value":anaheim_data["Earnings Public transportation"]}, 
        {"key": "Walked", "value": anaheim_data["Earnings Walked"]},
        {"key": "Worked at home", "value": anaheim_data["Earnings Worked at home"]},
        {"key": "Other", "value": anaheim_data["Earnings Taxicab, motorcycle, bicycle, or other"]}]
        
    var svg_income = d3.select("#income")
        .append("svg")
        .attr("width", width_bar + margin_bar.left + margin_bar.right)
        .attr("height", height_bar + margin_bar.top + margin_bar.bottom)
        .append("g")
        .attr("transform",
          "translate(" + margin_bar.left + "," + margin_bar.top + ")");

    // X axis
    var x_income = d3.scaleBand()
        .range([ 0, width_bar])
        .padding(0.2);

    var xAxis_income = svg_income.append("g")
        .attr("transform", "translate(0," + height_bar + ")")

    // Add Y axis
    var y_income = d3.scaleLinear()
        .range([ height_bar, 0]);
    
    var yAxis_income = svg_income.append("g")
        .attr("class", "myYaxis")
    
    svg_income.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin_bar.left )
        .attr("x",0 - (height_bar / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "10px")
        .text("Median earnings (dollars)");
    
    svg_income.append("text")
        .attr("x", (width_bar / 2))             
        .attr("y", 0 - (margin_bar.top / 2) - 10)
        .attr("text-anchor", "middle")  
        .style("font-size", "14px") 
        .attr("font-weight", 700)
        .text("Median earnings of commuters");

    svg_income.append("text")
        .attr("x", - width_bar/2 + 150 )             
        .attr("y",  height_bar + 50)
        .attr("class", "source")
        .attr("id", "source")
        .attr("text-anchor", "start")  
        .style("font-size", "10px")
        .style("text-anchor", "start") 
        //.attr("font-weight", 550)
        .style("fill", "#696969")
        .text("Source: American Community Survey 5-Year Data (2019)");
    
    var updateIncome = function(city_income) {

        x_income.domain(city_income.map(function(d) { return d.key; }))
        xAxis_income.transition().duration(1000).call(d3.axisBottom(x_income))

        y_income.domain([0, d3.max(city_income, function(d) { return d.value; })])
        yAxis_income.transition().duration(1000).call(d3.axisLeft(y_income));

    // Bars
        var u = svg_income.selectAll("rect")
            .data(city_income)
        
        u.enter()
            .append("rect")
            .merge(u)
            .transition()
            .duration(1000)
            .attr("x", function(d) { return x_income(d.key); })
            .attr("y", function(d) { return y_income(d.value); })
            .attr("width", x_income.bandwidth())
            .attr("height", function(d) { return height_bar - y_income(d.value); })
            .attr("fill", "#b67171")
    }
    updateIncome(anaheim_income)


}  