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
    .attr("width", 300)
    .attr("height", 600)
    .attr("x", width-310)
    .attr("y", 80);

var body = details.append("xhtml:body")
    .style("text-align", "left")
    .style("background", "rgba(69, 69, 69, 0.10)")
    .style("border-radius", "10px")
    .style("box-shadow","0px 0px 2px 0px #a6a6a6")
    .attr("class", "tooltip-table");

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
    console.log(countyMap);


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

        tooltipFlag = d3.select(".selector").node().value

        if(tooltipFlag == "Show detailed tooltip"){
            let htmlData =
                "<p> <b>County:</b> " + d.properties.name + "</p>" +
                "<p> <b>Violent crime rate:</b> " + value["year"][filterYear]["average"] + "</p>"

            tooltip.style("left", d3.event.pageX - 50 + "px")
                .style("top", d3.event.pageY - 70 + "px")
                .style("display", "inline-block")
                .html(htmlData);
        } else {
            body.html("<table border=0 cellspacing=0 cellpadding=2>" + "\n" +
                "<tr><th>County name:</th><td>" + d.properties.name + "</td></tr>" + "\n" +
                "<tr><th>Robbery rate:</th><td>" + value["year"][filterYear]["Robbery"] + "</td></tr>" + "\n" +
                "<tr><th>Forcible rape rate:</th><td>" + value["year"][filterYear]["Forcible rape"] + "</td></tr>" + "\n" +
                "<tr><th>Aggravated assault rate:</th><td>" + value["year"][filterYear]["Aggravated assault"] + "</td></tr>" + "\n" +
                "<tr><th>Murder and non-negligent manslaughter rate:</th><td>" + value["year"][filterYear]["Murder and non-negligent manslaughter"] + "</td></tr>" + "\n" +
                "<tr><th>Average violent crime rate in "+d.properties.name +":</th><td>" + value["year"][filterYear]["average"] + "</td></tr>" + "\n" +
                "</table>");
            details.style("visibility", "visible");

        }
    })
        .on("mousemove.tooltip", function(d) {
            let value = countyMap.get(d.properties.name);

            tooltipFlag = d3.select(".selector").node().value;

            if(tooltipFlag == "Show detailed tooltip"){
                let htmlData =
                    "<p> <b>County:</b> " + d.properties.name + "</p>" +
                    "<p> <b>Violent crime rate:</b> " + value["year"][filterYear]["average"] + "</p>"

                tooltip.style("left", d3.event.pageX - 50 + "px")
                    .style("top", d3.event.pageY - 70 + "px")
                    .style("display", "inline-block")
                    .html(htmlData);
            } else {
                body.html("<table border=0 cellspacing=0 cellpadding=2>" + "\n" +
                    "<tr><th>County name:</th><td>" + d.properties.name + "</td></tr>" + "\n" +
                    "<tr><th>Robbery rate:</th><td>" + value["year"][filterYear]["Robbery"] + "</td></tr>" + "\n" +
                    "<tr><th>Forcible rape rate:</th><td>" + value["year"][filterYear]["Forcible rape"] + "</td></tr>" + "\n" +
                    "<tr><th>Aggravated assault rate:</th><td>" + value["year"][filterYear]["Aggravated assault"] + "</td></tr>" + "\n" +
                    "<tr><th>Murder and non-negligent manslaughter rate:</th><td>" + value["year"][filterYear]["Murder and non-negligent manslaughter"] + "</td></tr>" + "\n" +
                    "<tr><th>Average violent crime rate in "+d.properties.name +":</th><td>" + value["year"][filterYear]["average"] + "</td></tr>" + "\n" +
                    "</table>");
                details.style("visibility", "visible");

            }



        })
        .on("mouseout.tooltip", function(d) {
            tooltipFlag = d3.select(".selector").node().value;
            if(tooltipFlag == "Show detailed tooltip"){
                tooltip
                    .style("display", "none");
            } else {
               details.style("visibility", "hidden");
            }

        });
    d3.selectAll('#myRange')
        .on('input', function(d) {
            if(this.value == 1999){
                update("All");
            }else{
                update(this.value);
            }
        });

    d3.selectAll('.selector')
        .on('click', function(d) {
            if(this.value == "Show detailed tooltip") {
                this.value = "Show less detail"
            } else {
                this.value = "Show detailed tooltip"

            }

        });


    svg.call(d3.zoom().on("zoom", zoomed));

    drawColorLegend(colorScale, meanValue)


}




function translate(x, y) {
    return "translate(" + String(x) + "," + String(y) + ")";
}
function convertData(row) {
    let neighborhood = row["county_name"];
    let year = row["reportyear"];
    let rate =  parseFloat(row["rate"]);
    let strata_name = row["strata_level_name"];
    //strata_name.split(' ').join('-');
    if (neighborhood != "") {
        if (countyMap.has(neighborhood)) {
            countyObj = countyMap.get(neighborhood)
            countyObj["year"][year]["count"]++;
            countyObj["year"][year]["rate"] += rate;
            countyObj["year"][year][strata_name + " count"]++;
            countyObj["year"][year][strata_name] += rate;

            countyObj["year"]["All"]["rate"] += rate;
            countyObj["year"]["All"]["count"]++;
            countyObj["year"]["All"][strata_name + " count"]++;
            countyObj["year"]["All"][strata_name] += rate;

            countyMap.set(neighborhood, countyObj)
        } else {
            newObj = {
                "year": {},
            };
            for (let j = 0; j < yearList.length; j++) {
                let year = yearList[j];
                newObj["year"][year] = {
                    "rate" : 0,
                    "count": 0,
                    "average": 0,
                    "Murder and non-negligent manslaughter": 0,
                    "Robbery" : 0,
                    "Forcible rape": 0,
                    "Aggravated assault": 0,
                    "Violent crime total": 0,
                    "Murder and non-negligent manslaughter count": 0,
                    "Robbery count" : 0,
                    "Forcible rape count": 0,
                    "Aggravated assault count": 0,
                    "Violent crime total count": 0

                };
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

            let robRate = data["year"][year]["Robbery"];
            let robCount = data["year"][year]["Robbery count"];
            data["year"][year]["Robbery"] = (robRate/robCount).toFixed(2);

            let rapeRate = data["year"][year]["Forcible rape"];
            let rapeCount = data["year"][year]["Forcible rape count"];
            data["year"][year]["Forcible rape"] = (rapeRate/rapeCount).toFixed(2);


            let assultRate = data["year"][year]["Aggravated assault"];
            let assultCount = data["year"][year]["Aggravated assault count"];
            data["year"][year]["Aggravated assault"] = (assultRate/assultCount).toFixed(2);


            let murderRate = data["year"][year]["Murder and non-negligent manslaughter"];
            let murderCount = data["year"][year]["Murder and non-negligent manslaughter count"];
            data["year"][year]["Murder and non-negligent manslaughter"] = (murderRate/murderCount).toFixed(2);

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
        .style("font-size", "9px")
        .text("Number of violent crimes");

    legend.append("text")
        .attr("class", "axis-title")
        .attr("dy", 17)
        .style("font-size", "9px")

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