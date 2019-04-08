const yearList = [
    "2000",
    "2001",
    "2002",
    "2003",
    "2004",
    "2005",
    "2006",
    "2007",
    "2008",
    "2009",
    "2010",
    "2011",
    "2012",
    "2013",
    "All"
]


var urls = {
    basemap: "./data/california-counties.geojson",
};

// calculate date range

var width = 960,
    height = 600;

const margin = {
    top: 10,
    bottom: 35,
    left: 35,
    right: 15
};


// you need your own app token for this to work

var svg = d3.select("body").select("svg#vis1");

var g = {
    basemap: svg.select("g#basemap"),
    streets: svg.select("g#streets"),
    outline: svg.select("g#outline"),
    tooltip: svg.select("g#tooltip"),
    details: svg.select("g#details")
};

// setup tooltip (shows neighborhood name)
var tip = g.tooltip.append("text").attr("id", "tooltip");
tip.attr("text-anchor", "end");
tip.attr("dx", -5);
tip.attr("dy", -5);
tip.style("visibility", "hidden");

// add details widget
// https://bl.ocks.org/mbostock/1424037
var details = g.details.append("foreignObject")
    .attr("id", "details")
    .attr("width", 960)
    .attr("height", 600)
    .attr("x", 0)
    .attr("y", 0);

var body = details.append("xhtml:body")
    .style("text-align", "left")
    .style("background", "none")
    .html("<p>N/A</p>");

details.style("visibility", "hidden");

// setup projection
// https://github.com/d3/d3-geo#geoConicEqualArea
var projection = d3.geoConicEqualArea();
projection.parallels([37.692514, 37.840699]);
projection.rotate([122, 0]);





// setup path generator
var path = d3.geoPath().projection(projection);
var countyMap = d3.map();
var filterYear = "All"


// update function:
function update(source) {
    filterYear = source;


    let countMax = 0;
    let min = 0.0;

    let loopCount = 0;
    let meansum = 0;

    countyMap.values().forEach(function(d) {
        if(d["year"][filterYear]["average"] > countMax){
            countMax = d["year"][filterYear]["average"];
        }
        meansum += parseFloat(d["year"][filterYear]["average"]);
        loopCount++
    });

    let meanValue = meansum/loopCount; // 2

    const colorScale = d3.scaleDiverging(d3.interpolateReds)
        .domain([min,meanValue, countMax]);


    let myBasemapG = g.basemap.selectAll("path.land");
    myBasemapG.transition().style("fill", function(d) {
        let value = countyMap.get(d.properties.name);
        return colorScale(value["year"][filterYear]["average"]);
    })
    svg.select("g#color-legend").remove();



    drawColorLegend(colorScale, meanValue)

}

d3.csv("./data/gudbrnad3.csv", convertData).then(function(d) {
    setAllAverages()
    d3.json(urls.basemap).then(function (json) {
        // makes sure to adjust projection to fit all of our regions
        projection.fitSize([width-60, height-60], json);
        drawBasemap(json);
    })

});




function drawBasemap(json) {

    console.log("Draw map");
    console.log(filterYear);


    let countMax = 0;
    let min = 0.0;

    let loopCount = 0;
    let meansum = 0;
    countyMap.values().forEach(function(d) {
        if(d["year"][filterYear]["average"] > countMax){
            countMax = d["year"][filterYear]["average"];
        }
        meansum += parseFloat(d["year"][filterYear]["average"]);
        loopCount++
    });


    let meanValue = parseInt(meansum/loopCount, 10); // 2

    //Create a color scale
    const colorScale = d3.scaleDiverging(d3.interpolateReds)
        .domain([min, meanValue, countMax]);


    let basemap = g.basemap.selectAll("path.land")
        .data(json.features)
        .enter()
        .append("path")
        .attr("transform", translate(0, 20))
        .attr("d", path)
        .style("fill", function(d) {
            let value = countyMap.get(d.properties.name);
            console.log("New color");

            return colorScale(value["year"][filterYear]["average"]);
        })
        .attr("class", "land");

    let outline = g.outline.selectAll("path.county")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "county").attr("transform", translate(0, 20))
        .each(function(d) {
            // save selection in data for interactivity
            // saves search time finding the right outline later
            d.properties.outline = this;
        });


    // add highlight
    basemap.on("mouseover.highlight", function(d) {
        d3.select(d.properties.outline).raise();
        d3.select(d.properties.outline).classed("active", true);
    })
        .on("mouseout.highlight", function(d) {
            d3.select(d.properties.outline).classed("active", false);
        });


    var tooltip = d3.select("body").append("div").attr("class", "tooltip");


    // add tooltip
    basemap.on("mouseover.tooltip", function(d) {
        let value = countyMap.get(d.properties.name);

        let htmlData = "<p> <b>County:</b> " + d.properties.name + "</p>" + "<p> <b>Average :</b> " + value["year"][filterYear]["average"] + "</p>"

        tooltip.style("left", d3.event.pageX - 50 + "px")
            .style("top", d3.event.pageY - 70 + "px")
            .style("display", "inline-block")
            .html(htmlData);

    })
        .on("mousemove.tooltip", function(d) {
            let value = countyMap.get(d.properties.name);

            let htmlData = "<p> <b>County:</b> " + d.properties.name + "</p>" + "<p> <b>Average :</b> " + value["year"][filterYear]["average"] + "</p>"

            tooltip
                .style("left", d3.event.pageX - 50 + "px")
                .style("top", d3.event.pageY - 70 + "px")
                .style("display", "inline-block")
                .html(htmlData);
        })
        .on("mouseout.tooltip", function(d) {
            tooltip
                .style("display", "none");

            console.log("out")

        });

    d3.selectAll('.selector')
        .on('click', function(d) {
            update(this.id);
        });
    d3.selectAll('#myRange')
        .on('input', function(d) {
            if(this.value == 1999){
                update("All");
            }else{
                update(this.value);
            }
        });

    basemap.call(d3.zoom().on("zoom", zoomed));

    drawColorLegend(colorScale, meanValue)


}




function translate(x, y) {
    return "translate(" + String(x) + "," + String(y) + ")";
}

function convertData(row) {
    let neighborhood = row["county_name"];
    let year = row["reportyear"];
    let rate =  parseFloat(row["rate"]);

    if (neighborhood != "") {
        if (countyMap.has(neighborhood)) {
            countyObj = countyMap.get(neighborhood)
            countyObj["year"][year]["count"]++;
            countyObj["year"][year]["rate"] += rate;

            countyObj["year"]["All"]["rate"] += rate;
            countyObj["year"]["All"]["count"]++;


            countyMap.set(neighborhood, countyObj)
        } else {
            newObj = {
                "year": {},
            };
            for (let j = 0; j < yearList.length; j++) {
                let year = yearList[j];
                newObj["year"][year] = {"rate" : 0, "count": 0, "average": 0};
            }
            countyMap.set(neighborhood, newObj)
        }
    }
    //TODO on return call method to calculate average for all values
}
function setAllAverages() {
    for(let index in countyMap.keys()) {
        let key = countyMap.keys()[index];
        let data = countyMap.get(key);

        for (let j = 0; j < yearList.length; j++) {
            let year = yearList[j];

            let currRate = data["year"][year]["rate"];
            let currCount = data["year"][year]["count"];
            data["year"][year]["average"] = (currRate/currCount).toFixed(2);
            countyMap.set(key, data)
        }
    }

}

function drawColorLegend(colorScale, total) {
    let legendWidth = 150;
    let legendHeight = 20;

    let legend = svg.append("g").attr("id", "color-legend");

    legend.attr("transform", translate(width - margin.right - legendWidth, margin.top))

    legend.append("text")
        .attr("class", "axis-title")
        .attr("dy", 6)
        .text("Number of violent crimes");

    legend.append("text")
        .attr("class", "axis-title")
        .attr("dy", 17)
        .text("pr. 1000 person");


    // lets draw the rectangle, but it won't have a fill just yet
    let colorbox = legend.append("rect")
        .attr("x", 0)
        .attr("y", 24)
        .attr("width", legendWidth)
        .attr("height", legendHeight);

    // we need to create a linear gradient for our color legend
    // this defines a color at a percent offset
    // https://developer.mozilla.org/en-US/docs/Web/SVG/Element/linearGradient

    // this is easier if we create a scale to map our colors to percents

    // get the domain first (we do not want the middle value from the diverging scale)
    let colorDomain = [d3.min(colorScale.domain()), d3.max(colorScale.domain())];

    let percentScale = d3.scaleLinear()
        .range([0, 100])
        .domain(colorDomain);

    // we have to first add gradients
    let defs = svg.append("defs");

   /* legend.append("text")
        .attr("x", 0)
        .attr("y", 75)
        .style("text-anchor", "start")
        .text("Year");*/

    legend.append("text")
        .attr("x", 0)
        .attr("y", 90)
        .style("text-anchor", "start")
        .style("font-size", "16")

        .text("Selected Year: " + filterYear);

    // add a stop per tick
    defs.append("linearGradient")
        .attr("id", "gradient")
        .selectAll("stop")
        .data(colorScale.ticks())
        .enter()
        .append("stop")
        .attr("offset", d => percentScale(d) + "%")
        .attr("stop-color", d => colorScale(d));

    // draw the color rectangle with the gradient
    colorbox.attr("fill", "url(#gradient)");

    // now we need to draw tick marks for our scale
    // we can create a legend that will map our data domain to the legend colorbox
    let legendScale = d3.scaleLinear()
        .domain(colorDomain)
        .range([0, legendWidth]);


    let legendAxis = d3.axisBottom(legendScale)
    legendAxis.tickValues(colorScale.domain());
    legendAxis.tickSize(legendHeight);
    legendAxis.tickSizeOuter(0);

    let axisGroup = legend.append("g")
        .attr("id", "color-axis")
        .attr("transform", translate(0, 24))
        .call(legendAxis);

    // now lets tighten up the tick labels a bit so they don't stick out
    axisGroup.selectAll("text")
        .each(
            function(d, i) {
                // set the first tick mark to anchor at the start
                if (i == 0) {
                    d3.select(this).attr("text-anchor", "start");
                }
                // set the last tick mark to anchor at the end
                else if (i == legendAxis.tickValues().length - 1) {
                    d3.select(this).attr("text-anchor", "end");
                }
            }
        );

}
function zoomed() {
    g
        .basemap
        .selectAll('path.land') // To prevent stroke width from scaling
        .attr('transform', d3.event.transform);
    g
        .outline
        .selectAll('path.county') // To prevent stroke width from scaling
        .attr('transform', d3.event.transform);
}