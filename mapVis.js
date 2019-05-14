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
const yearListLine = [
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
]

var urls = {
    basemap: "./data/california-counties.geojson",
};

// calculate date range



const margin = {
    top: 10,
    bottom: 35,
    left: 35,
    right: 15
};


// you need your own app token for this to work

var svg = d3.select("body").select("svg#vis1");
var width = svg.node().getBoundingClientRect().width,
    height = 600;
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
    .attr("overflow","visible")
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
var lineCharMap = d3.map()
var filterYear = "All";
var filterCounty = "";


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
    });
    svg.select("g#color-legend").remove();

    drawColorLegend(colorScale, meanValue)

}

d3.csv("./data/gudbrnad3.csv", convertData).then(function(d) {
    setAllAverages()
    d3.json(urls.basemap).then(function (json) {
        // makes sure to adjust projection to fit all of our regions
        projection.fitSize([width-60, height-60], json);
        drawLineChart();
        drawBasemap(json);
    })

});




function drawBasemap(json) {


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
                "<tr><th>Average violent crime rate: </th><td>" + value["year"][filterYear]["average"] + "</td></tr>" + "\n" +
                "</table>");
            details.style("visibility", "visible");

        }
    }).on("click.lineFilter", function(d) {
        filterCounty = d.properties.name;
        console.log(filterCounty)
        updateLineChart()

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
                    "<tr><th>Average violent crime rate: </th><td>" + value["year"][filterYear]["average"] + "</td></tr>" + "\n" +
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
    if (neighborhood != "" && neighborhood != "California") {
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

    if (neighborhood != "") {
        if (lineCharMap.has(neighborhood)) {
            lineCharObj = lineCharMap.get(neighborhood)
            lineCharObj["year"][year]["count"]++;
            lineCharObj["year"][year]["rate"] += rate;
            lineCharObj["year"][year][strata_name + " count"]++;
            lineCharObj["year"][year][strata_name] += rate;

            lineCharMap.set(neighborhood, lineCharObj)
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
                    "CaliAverage": 0,

                };
            }
            lineCharMap.set(neighborhood, newObj)
            lineCharObj = lineCharMap.get(neighborhood)
            lineCharObj["year"][year]["count"]++;
            lineCharObj["year"][year]["rate"] += rate;
            lineCharObj["year"][year][strata_name + " count"]++;
            lineCharObj["year"][year][strata_name] += rate;

            lineCharMap.set(neighborhood, lineCharObj)
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
            if(currRate === 0){
                data["year"][year]["average"] = 0;
            }else{
                data["year"][year]["average"] = (currRate/currCount).toFixed(2);
            }


            let robRate = data["year"][year]["Robbery"];
            let robCount = data["year"][year]["Robbery count"];
            data["year"][year]["Robbery"] = (robRate/robCount).toFixed(2);
            if(robRate === 0){
                data["year"][year]["Robbery"] = 0;
            }else{
                data["year"][year]["Robbery"] = (robRate/robCount).toFixed(2);
            }


            let rapeRate = data["year"][year]["Forcible rape"];
            let rapeCount = data["year"][year]["Forcible rape count"];
            if(rapeRate === 0){
                data["year"][year]["Forcible rape"] = 0;
            }else{
                data["year"][year]["Forcible rape"] = (rapeRate/rapeCount).toFixed(2);
            }


            let assultRate = data["year"][year]["Aggravated assault"];
            let assultCount = data["year"][year]["Aggravated assault count"];
            if(assultRate === 0){
                data["year"][year]["Aggravated assault"] = 0;
            }else{
                data["year"][year]["Aggravated assault"] = (assultRate/assultCount).toFixed(2);
            }

            let murderRate = data["year"][year]["Murder and non-negligent manslaughter"];
            let murderCount = data["year"][year]["Murder and non-negligent manslaughter count"];

            if(murderRate === 0){
                data["year"][year]["Murder and non-negligent manslaughter"] = 0;
            }else{
                data["year"][year]["Murder and non-negligent manslaughter"] = (murderRate/murderCount).toFixed(2);
            }

            countyMap.set(key, data)
        }
    }


    for(let index in lineCharMap.keys()) {
        let key = lineCharMap.keys()[index];
        if (key != "Califonia") {

            let data = lineCharMap.get(key);
            for (let j = 0; j < yearListLine.length; j++) {
                let year = yearListLine[j];

                let currRate = data["year"][year]["rate"];
                let currCount = data["year"][year]["count"];
                data["year"][year]["average"] = (currRate / currCount).toFixed(2);

                let robRate = data["year"][year]["Robbery"];
                let robCount = data["year"][year]["Robbery count"];
                data["year"][year]["Robbery"] = (robRate / robCount).toFixed(2);

                let rapeRate = data["year"][year]["Forcible rape"];
                let rapeCount = data["year"][year]["Forcible rape count"];
                data["year"][year]["Forcible rape"] = (rapeRate / rapeCount).toFixed(2);


                let assultRate = data["year"][year]["Aggravated assault"];
                let assultCount = data["year"][year]["Aggravated assault count"];
                data["year"][year]["Aggravated assault"] = (assultRate / assultCount).toFixed(2);


                let murderRate = data["year"][year]["Murder and non-negligent manslaughter"];
                let murderCount = data["year"][year]["Murder and non-negligent manslaughter count"];
                data["year"][year]["Murder and non-negligent manslaughter"] = (murderRate / murderCount).toFixed(2);

                lineCharMap.set(key, data)
            }
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

        .text("per 1000 person");


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


function updateLineChart() {
    let svg = d3.select("body").select("svg#vis2");
    updateDataPoints();
    drawLineChartLegion();
    addLineChartInteractivity();


    let margin = {
        top:    90,
        right:  140,
        bottom: 60,
        left:   60
    };

    let bounds = svg.node().getBoundingClientRect();
    let plotWidth = bounds.width - margin.right - margin.left;
    let plotHeight = bounds.height - margin.top - margin.bottom;


    let countScale = d3.scaleLinear()
        .domain([0, maxAverage])
        .rangeRound([plotHeight, 0])
        .nice();

    let hourScale = d3.scaleBand()
        .domain(yearListLine)
        .range([0, plotWidth])
        .paddingInner(5);


    let yAxis = d3.axisLeft(countScale);

    d3.selectAll("g#y-axis").call(yAxis).attr("transform", "translate(0,0)");

    var lineFunction = d3.line()
        .x(function(d) { return hourScale(d.x); })
        .y(function(d) { return countScale(d.y); });
    let plot = svg.select("g#plot");


    plot.selectAll("circle.dot")
        .transition()
        .attr("cx", function(d) {
            return hourScale(d.x)
        })
        .attr("cy", function(d) { return countScale(d.y);});


    if(multiLineVar === "true"){
        d3.selectAll("path#rapeLine").transition().attr("d", lineFunction(forcibleRapeDataPoints))
        d3.selectAll("path#assaultLine").transition().attr("d", lineFunction(aggravatedAssaultDataPoints))
        d3.selectAll("path#murderLine").transition().attr("d", lineFunction(murderDataPoints))
        d3.selectAll("path#robLine").transition().attr("d", lineFunction(robberyDataPoints))

       let circle = plot.selectAll("circle#rapedots")
            .data(forcibleRapeDataPoints);

        circle.exit().remove();//remove unneeded circles
        circle.enter().append("circle")
            .attr("r",0);//create any new circles needed

        circle.transition()
            .attr("cx", function(d) {
                return hourScale(d.x)
            })
            .attr("cy", function(d) { return countScale(d.y);});

        //---
        circle = plot.selectAll("circle#assaultdots")
            .data(aggravatedAssaultDataPoints);

        circle.exit().remove();//remove unneeded circles
        circle.enter().append("circle")
            .attr("r",0);//create any new circles needed

        circle.transition()
            .attr("cx", function(d) {
                return hourScale(d.x)
            })
            .attr("cy", function(d) { return countScale(d.y);});
        //---
        circle = plot.selectAll("circle#murderdots")
            .data(murderDataPoints);

        circle.exit().remove();//remove unneeded circles
        circle.enter().append("circle")
            .attr("r",0);//create any new circles needed

        circle.transition()
            .attr("cx", function(d) {
                return hourScale(d.x)
            })
            .attr("cy", function(d) { return countScale(d.y);});
        //---
        circle = plot.selectAll("circle#robdots")
            .data(robberyDataPoints);

        circle.exit().remove();//remove unneeded circles
        circle.enter().append("circle")
            .attr("r",0);//create any new circles needed

        circle.transition()
            .attr("cx", function(d) {
                return hourScale(d.x)
            })
            .attr("cy", function(d) { return countScale(d.y);});
        //---

    }else{
        d3.selectAll("path#totalLine").transition().attr("d", lineFunction(totalDataPoints))
        let circle = plot.selectAll("circle#totaldots")
            .data(totalDataPoints);

        circle.exit().remove();//remove unneeded circles
        circle.enter().append("circle")
            .attr("r",0);//create any new circles needed

        circle.transition()
            .attr("cx", function(d) {
                return hourScale(d.x)
            })
            .attr("cy", function(d) { return countScale(d.y);});
        //---
    }
    d3.selectAll("path#caliLine").transition().attr("d", lineFunction(caliPoints))

    let circle = plot.selectAll("circle#calidots")
        .data(caliPoints);

    circle.exit().remove();//remove unneeded circles
    circle.enter().append("circle")
        .attr("r",0);//create any new circles needed

    circle.transition()
        .attr("cx", function(d) {
            return hourScale(d.x)
        })
        .attr("cy", function(d) { return countScale(d.y);});


    d3.selectAll("text.line-header").text("County: " + filterCounty);

}



function updateMultiLineChart() {
    d3.selectAll("path.line").remove();
    d3.selectAll("circle.dot").remove();

    updateDataPoints();
    drawAllLines();
    updateLineChart();


}

var totalDataPoints = [];
var robberyDataPoints = [];
var forcibleRapeDataPoints = [];
var aggravatedAssaultDataPoints = [];
var murderDataPoints = [];
var caliPoints = [];
var maxAverage = 0;
function updateDataPoints() {
    totalDataPoints = [];
    robberyDataPoints = [];
    forcibleRapeDataPoints = [];
    aggravatedAssaultDataPoints = [];
    murderDataPoints = [];
    caliPoints = [];
    maxAverage = 0;


    if(filterCounty === ""){
        filterCounty = "Alameda"
    }

    if(multiLineVar === "true"){
        console.log(countyMap.get(filterCounty)["year"])

        for (let i = 0; i < yearListLine.length; i++) {
            if(lineCharMap.get("California")["year"][yearList[i]]["average"] > maxAverage){
                maxAverage = lineCharMap.get("California")["year"][yearList[i]]["average"]
            }
            if(countyMap.get(filterCounty)["year"][yearList[i]]["Robbery"] > maxAverage){
                maxAverage = countyMap.get(filterCounty)["year"][yearList[i]]["Robbery"]
            }
            if(countyMap.get(filterCounty)["year"][yearList[i]]["Forcible rape"] > maxAverage){
                maxAverage = countyMap.get(filterCounty)["year"][yearList[i]]["Forcible rape"]
            }

            if(parseFloat(countyMap.get(filterCounty)["year"][yearList[i]]["Aggravated assault"]) > maxAverage){
                maxAverage = parseFloat(countyMap.get(filterCounty)["year"][yearList[i]]["Aggravated assault"])
            }

            if(countyMap.get(filterCounty)["year"][yearList[i]]["Murder and non-negligent manslaughter"] > maxAverage){
                maxAverage = countyMap.get(filterCounty)["year"][yearList[i]]["Murder and non-negligent manslaughter"]
            }

            caliPoints.push({ "x": yearList[i], "y":lineCharMap.get("California")["year"][yearList[i]]["CaliAverage"]});
            robberyDataPoints.push({ "x": yearList[i], "y":countyMap.get(filterCounty)["year"][yearList[i]]["Robbery"]});
            forcibleRapeDataPoints.push({ "x": yearList[i], "y":countyMap.get(filterCounty)["year"][yearList[i]]["Forcible rape"]});
            aggravatedAssaultDataPoints.push({ "x": yearList[i], "y":countyMap.get(filterCounty)["year"][yearList[i]]["Aggravated assault"]});
            murderDataPoints.push({ "x": yearList[i], "y":countyMap.get(filterCounty)["year"][yearList[i]]["Murder and non-negligent manslaughter"]});

        };
    }else{
        for (let i = 0; i < yearListLine.length; i++) {
            if(lineCharMap.get(filterCounty)["year"][yearList[i]]["average"] > maxAverage){
                maxAverage = lineCharMap.get(filterCounty)["year"][yearList[i]]["average"]
            }
            if(lineCharMap.get("California")["year"][yearList[i]]["average"] > maxAverage){
                maxAverage = lineCharMap.get("California")["year"][yearList[i]]["average"]
            }
            caliPoints.push({ "x": yearList[i], "y":lineCharMap.get("California")["year"][yearList[i]]["CaliAverage"]});
            totalDataPoints.push({ "x": yearList[i], "y":lineCharMap.get(filterCounty)["year"][yearList[i]]["average"]});
        };
    }

}

function drawLineChartLegion(){

    let svg = d3.select("body").select("svg#vis2");
    d3.selectAll("rect.legend").remove();
    d3.selectAll("text.legend-text").remove();
        svg.append("text")
            .attr("x", width - 130)
            .attr("y", 40)
            .attr("text-anchor", "right")
            .attr("class", "legend-text2")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .text("Crime type");

        svg.append("rect")
            .attr("x", width - 130)
            .attr("y", 50)
            .attr("width", 10)
            .attr("height", 10)
            .attr("id", "caliLegendr")
            .attr("class", "legend")
            .style("fill", lineChartColorMap["cali"]);

        svg.append("text")
            .attr("x", width - 118)
            .attr("y", 57)
            .attr("id", "caliLegendt")
            .attr("text-anchor", "right")
            .attr("class", "legend-text")
            .style("font-size", "8px")
            .text("California average");

    if(multiLineVar === "true") {

        svg.append("rect")
            .attr("x", width - 130)
            .attr("y", 65)
            .attr("width", 10)
            .attr("height", 10)
            .attr("id", "robLegendr")

            .attr("class", "legend")
            .style("fill", lineChartColorMap["rob"]);

        svg.append("text")
            .attr("x", width - 118)
            .attr("y", 72)
            .attr("id", "robLegendt")
            .attr("text-anchor", "right")
            .attr("class", "legend-text")
            .style("font-size", "8px")
            .text("Robbery");

        svg.append("rect")
            .attr("x", width - 130)
            .attr("y", 80)
            .attr("width", 10)
            .attr("height", 10)
            .attr("id", "rapeLegendr")
            .attr("class", "legend")
            .style("fill", lineChartColorMap["rape"]);

        svg.append("text")
            .attr("x", width - 118)
            .attr("y", 88)
            .attr("text-anchor", "right")
            .attr("class", "legend-text")
            .attr("id", "rapeLegendt")
            .style("font-size", "8px")
            .text("Forcible rape");

        svg.append("rect")
            .attr("x", width - 130)
            .attr("y", 95)
            .attr("width", 10)
            .attr("height", 10)
            .attr("class", "legend")
            .attr("id", "assaultLegendr")
            .style("fill", lineChartColorMap["assault"]);

        svg.append("text")
            .attr("x", width - 118)
            .attr("y", 103)
            .attr("text-anchor", "right")
            .attr("class", "legend-text")
            .attr("id", "assaultLegendt")

            .style("font-size", "8px")
            .text("Aggravated assault");

        svg.append("rect")
            .attr("x", width - 130)
            .attr("y", 115)
            .attr("width", 10)
            .attr("height", 10)
            .attr("class", "legend")
            .attr("id", "murderLegendr")
            .style("fill", lineChartColorMap["murder"]);

        svg.append("text")
            .attr("x", width - 118)
            .attr("y", 120)
            .attr("text-anchor", "right")
            .attr("class", "legend-text")
            .attr("id", "murderLegendt")
            .style("font-size", "8px")
            .text("Murder and non-negligent");

        svg.append("text")
            .attr("x", width - 118)
            .attr("y", 127)
            .attr("text-anchor", "right")
            .attr("class", "legend-text")
            .attr("id", "murderLegendt")
            .style("font-size", "8px")
            .text("manslaughter");
    }else{
        svg.append("rect")
            .attr("x", width - 130)
            .attr("y", 65)
            .attr("width", 10)
            .attr("height", 10)
            .attr("class", "legend")
            .attr("id", "totalLegendr")
            .style("fill", lineChartColorMap["total"]);

        svg.append("text")
            .attr("x", width - 118)
            .attr("y", 72)
            .attr("text-anchor", "right")
            .attr("class", "legend-text")
            .attr("id", "totalLegendt")

            .style("font-size", "8px")
            .text(filterCounty + " average");
    }
}

function drawLineChart() {
    console.log(countyMap.keys())
    let svg = d3.select("body").select("svg#vis2");
    updateDataPoints();

    let countMin = 0;


    let margin = {
        top:    90,
        right:  140,
        bottom: 60,
        left:   60
    };
    // now we can calculate how much space we have to plot
    let bounds = svg.node().getBoundingClientRect();
    let plotWidth = bounds.width - margin.right - margin.left;
    let plotHeight = bounds.height - margin.top - margin.bottom;

    let countScale = d3.scaleLinear()
        .domain([countMin, maxAverage])
        .rangeRound([plotHeight, 0])
        .nice();

    let hourScale = d3.scaleBand()
        .domain(yearListLine)
        .range([0, plotWidth])
        .paddingInner(5);

    let plot = svg.select("g#plot");

    if (plot.size() < 1) {
        plot = svg.append("g").attr("id", "plot");
        plot.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    }

    let xAxis = d3.axisBottom(hourScale);
    let yAxis = d3.axisLeft(countScale);

    // check if we have already drawn our axes
    if (plot.select("g#y-axis").size() < 1) {
        let xGroup = plot.append("g").attr("id", "x-axis");
        xGroup.call(xAxis);
        xGroup.attr("transform", "translate(0," + plotHeight + ")").style("color", "black");

        let yGroup = plot.append("g").attr("id", "y-axis");
        yGroup.call(yAxis);
        yGroup.attr("transform", "translate(0,0)").style("color", "black");
    } else {
        plot.select("g#y-axis").call(yAxis);
    }

    var gridlines = d3.axisLeft(countScale)
        .tickFormat("")
        .tickSize(-plotWidth);

    plot.append("g")
        .call(gridlines)
        .attr("color", "#bfbfbf");

    drawAllLines();



    svg.append("text")
    // .attr("id", "graph-title")
        .style("font-size", "25")
        .attr("y", margin.top/2)
        .attr("x", 10)
        .attr("class", "line-header")
        .style("text-anchor", "start")
        .text("County: " + filterCounty);

    plot.append("text")
    // .attr("id", "x-axis-title")
        .style("font-size", "14")
        .attr("transform",
            "translate(" + (plotWidth/2) + " ,"
            + (plotHeight + 40) + ")")
        .style("text-anchor", "middle")
        .text("Year");

    plot.append("text")
    // .attr("id", "y-axis-title")
        .style("font-size", "14")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 8)
        .attr("x", -(plotHeight/2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Rate");





    d3.selectAll('#detailSelector')
        .on('change', function(d) {
            if(this.value === "Show-detailed") {
                multiLineVar = "true"
            } else {
                multiLineVar = "false"
            }
            updateMultiLineChart();
        });

    html = "";
    for(var key in countyKeys) {
        html += "<option value=" + key  + ">" +countyKeys[key]+ "</option>"
    }
    document.getElementById("countySelecotor").innerHTML = html;

    d3.selectAll('#countySelecotor')
        .on('change', function(d) {
            filterCounty = countyKeys[this.value];
            console.log(filterCounty);
            updateLineChart()
        });

};

function addLineChartInteractivity() {
    let svg = d3.select("body").select("svg#vis2");

    myLines = svg.selectAll("path.line");
    myDots = svg.selectAll("circle");
    myLegend = svg.selectAll(".legend");
    myLegendText = svg.selectAll(".legend-text");


    myLegendText.on("mouseover.brush5", function(d) {
        let me = d3.select(this);
        let htmlId = me.attr("id").substring(0, me.attr("id").length - 7); // "12345.0"
        htmlId += "Line"

        svg.selectAll(".legend-text#"+ me.attr("id")).style("font-weight", "bold");


        svg.selectAll("path.line#"+htmlId)
            .transition()
            .style("stroke-width", lineStrokeHover)
            .style("opacity", lineOpacityHover);

        myDots
            .transition()
            .style("opacity", otherLinesOpacityHover);


        myLines.nodes().forEach(function(e) {
            if(htmlId != e.id){
                console.log(e.id);
                svg.selectAll("path.line#"+ e.id)
                    .transition()
                    .style("opacity", otherLinesOpacityHover)
            }
        });

    });


    myLegendText.on("mouseout.brush5", function(d) {
        myLegendText.style("font-weight", "normal");
        myLines
            .transition()
            .style("stroke-width", lineStroke)
            .style("opacity", lineOpacity)
            .style("font-weight", "normal");

        myDots
            .style("opacity", lineOpacity)
    });



    myLegend.on("mouseover.brush4", function(d) {
        let me = d3.select(this);
        let htmlId = me.attr("id").substring(0, me.attr("id").length - 7); // "12345.0"
        svg.selectAll(".legend-text#"+ htmlId +"Legendt").style("font-weight", "bold");

        htmlId += "Line"

        svg.selectAll("path.line#"+htmlId)
            .transition()
            .style("stroke-width", lineStrokeHover)
            .style("opacity", lineOpacityHover);

        myDots
            .transition()
            .style("opacity", otherLinesOpacityHover);


        myLines.nodes().forEach(function(e) {
            if(htmlId != e.id){
                console.log(e.id);
                svg.selectAll("path.line#"+ e.id)
                    .transition()
                    .style("opacity", otherLinesOpacityHover)
            }
        });

    });


    myLegend.on("mouseout.brush4", function(d) {
        myLegendText.style("font-weight", "normal");

        myLines
            .transition()
            .style("stroke-width", lineStroke)
            .style("opacity", lineOpacity);
        myDots
            .style("opacity", lineOpacity)
    });


    myLines.on("mouseover.brush1", function(d) {
        let me = d3.select(this);
        let htmlId = me.attr("id");
        console.log(htmlId)


        myLegendText.nodes().forEach(function(e) {
            let legendText = htmlId.substring(0, htmlId.length - 4) + "Legendt"
            if(legendText === e.id){
                svg.selectAll(".legend-text#"+ e.id)
                    .transition()
                    .style("font-weight", "bold");
            }
        });




        myLines.nodes().forEach(function(e) {
            if(htmlId != e.id){
                console.log(e.id);
                svg.selectAll("path.line#"+ e.id)
                    .transition()
                    .style("opacity", otherLinesOpacityHover)
            }
        });

        me.raise()
            .style("stroke-width", lineStrokeHover)
            .style("opacity", lineOpacityHover);
        myDots
            .style("opacity", otherLinesOpacityHover)
    });

    myLines.on("mouseout.brush1", function(d) {
        myLegendText.style("font-weight", "normal");
        d3.select(this)
            .style("stroke-width", lineStroke)
            .style("opacity", lineOpacity);

        myLines
            .transition()
            .style("stroke-width", lineStroke)
            .style("opacity", lineOpacity);
        myDots
            .style("opacity", lineOpacity)
    });

    let div = d3.select("body").append("div")
        .attr("class", "gtooltip")
        .style("display", "none");

    myDots.on("mouseover.brush2", function(d) {
        div.style("display", "inline");
        let me = d3.select(this);
        let htmlId = me.attr("id");

        myLegendText.nodes().forEach(function(e) {
            let legendText = htmlId.substring(0, htmlId.length - 4) + "Legendt"
            if(legendText === e.id){
                svg.selectAll(".legend-text#"+ e.id)
                    .transition()
                    .style("font-weight", "bold");
            }
        });
        me.raise()
            .style("stroke-width", lineStrokeHover)
            .style("r", 6)
            .style("opacity", lineOpacityHover);

    });

    myDots.on("mousemove.brush2", function(d,i) {
        let me = d3.select(this);
        let htmlId = me.attr("id").substring(0, me.attr("id").length - 4); // "12345.0"
        let text = d.y;
        if(htmlId === "cali"){
            text = parseFloat(text).toFixed(2)
        }

        div
            .text("Rate: " + text)
            .style("left", (d3.event.pageX-10) + "px")
            .style("top", (d3.event.pageY-40) + "px")
            .style("color", lineChartColorMap[htmlId]);

    });

    myDots.on("mouseout.brush2", function(d) {
        myLegendText.style("font-weight", "normal");

        div.style("display", "none");
        myDots
            .style("stroke-width", lineStroke)
            .style("r", 3.5)
            .style("opacity", lineOpacity);
    });


}
function drawAllLines() {
    let svg = d3.select("body").select("svg#vis2");

    let margin = {
        top:    90,
        right:  140,
        bottom: 60,
        left:   60
    };

    let bounds = svg.node().getBoundingClientRect();
    let plotWidth = bounds.width - margin.right - margin.left;
    let plotHeight = bounds.height - margin.top - margin.bottom;


    let countScale = d3.scaleLinear()
        .domain([0, maxAverage])
        .rangeRound([plotHeight, 0])
        .nice();

    let hourScale = d3.scaleBand()
        .domain(yearListLine)
        .range([0, plotWidth])
        .paddingInner(5);



    var lineFunction = d3.line()
        .x(function(d) { return hourScale(d.x); })
        .y(function(d) { return countScale(d.y); });



    let plot = svg.select("g#plot");

    myDots = plot.selectAll("dot")
        .data(caliPoints)
        .enter()
        .append("circle")
        .style("fill", lineChartColorMap["cali"])
        .attr("r", 3.5)
        .attr("class", "dot")
        .attr("id","calidots")

        .attr("cx", function(d) {

            return hourScale(d.x)
        })
        .attr("cy", function(d) { return countScale(d.y);})
        .style("opacity", lineOpacity);


    plot.append("path")
        .attr("d",lineFunction(caliPoints) )
        .attr("i", "somthing")
        .attr("stroke", lineChartColorMap["cali"])
        .attr("stroke-width", 2)
        .attr("class", "line")
        .attr("id", "caliLine")
        .attr("fill", "none")
        .style("opacity", lineOpacity);



    if(multiLineVar === "true"){
        plot.selectAll("dot")
            .data(robberyDataPoints)
            .enter()
            .append("circle")
            .style("fill", lineChartColorMap["rob"])
            .attr("r", 3.5)
            .attr("class", "dot")
            .attr("id","robdots")
            .attr("cx", function(d) {
                return hourScale(d.x)
            })
            .attr("cy", function(d) { return countScale(d.y);})
            .style("opacity", lineOpacity);


        plot.append("path")
            .attr("d", lineFunction(robberyDataPoints))
            .attr("stroke", lineChartColorMap["rob"])
            .attr("stroke-width", 2)
            .attr("class", "line")
            .attr("id", "robLine")
            .attr("fill", "none")
            .style("opacity", lineOpacity);



        plot.selectAll("dot")
            .data(murderDataPoints)
            .enter()
            .append("circle")
            .style("fill", lineChartColorMap["murder"])
            .attr("r", 3.5)
            .attr("class", "dot")
            .attr("id","murderdots")
            .attr("cx", function(d) {
                return hourScale(d.x)
            })
            .attr("cy", function(d) { return countScale(d.y);})
            .style("opacity", lineOpacity);


        plot.append("path")
            .attr("d", lineFunction(murderDataPoints))
            .attr("stroke", lineChartColorMap["murder"])
            .attr("stroke-width", 2)
            .attr("class", "line")
            .attr("id", "murderLine")
            .attr("fill", "none")
            .style("opacity", lineOpacity);



        plot.selectAll("dot")
            .data(aggravatedAssaultDataPoints)
            .enter()
            .append("circle")
            .style("fill", lineChartColorMap["assault"])
            .attr("r", 3.5)
            .attr("class", "dot")
            .attr("id","assaultdots")
            .attr("cx", function(d) {
                return hourScale(d.x)
            })
            .attr("cy", function(d) { return countScale(d.y);})
            .style("opacity", lineOpacity);


        plot.append("path")
            .attr("d", lineFunction(aggravatedAssaultDataPoints))
            .attr("stroke", lineChartColorMap["assault"])
            .attr("stroke-width", 2)
            .attr("class", "line")
            .attr("id", "assaultLine")
            .attr("fill", "none")
            .style("opacity", lineOpacity);



        plot.selectAll("dot")
            .data(forcibleRapeDataPoints)
            .enter()
            .append("circle")
            .style("fill", lineChartColorMap["rape"])
            .attr("r", 3.5)
            .attr("class", "dot")
            .attr("id","rapedots")
            .attr("cx", function(d) {
                return hourScale(d.x)
            })
            .attr("cy", function(d) { return countScale(d.y);})
            .style("opacity", lineOpacity);

        plot.append("path")
            .attr("d", lineFunction(forcibleRapeDataPoints))
            .attr("stroke", lineChartColorMap["rape"])
            .attr("stroke-width", 2)
            .attr("class", "line")
            .attr("id", "rapeLine")
            .attr("fill", "none")
            .style("opacity", lineOpacity)
        ;
    } else {
        plot.selectAll("dot")
            .data(totalDataPoints)
            .enter()
            .append("circle")
            .style("fill", lineChartColorMap["total"])
            .style("opacity", lineOpacity)
            .attr("r", 3.5)
            .attr("class", "dot")
            .attr("id","totaldots")
            .attr("cx", function(d) {
                return hourScale(d.x)
            })
            .attr("cy", function(d) { return countScale(d.y);});

        plot.append("path")
            .attr("d", lineFunction(totalDataPoints))
            .attr("stroke", lineChartColorMap["total"])
            .attr("stroke-width", 2)
            .attr("class", "line")
            .attr("id", "totalLine")
            .attr("fill", "none")
            .style("opacity", lineOpacity)
        ;
    }
    drawLineChartLegion();
    addLineChartInteractivity();



}

var lineChartColorMap = { 'total': "#1171e4", 'rape': "orange", 'assault': "#b07aa1", "murder": "green","rob": "#1171e4","cali":"red"  };

var multiLineVar = "true"
var lineOpacity = "0.85";
var lineOpacityHover = "0.95";
var otherLinesOpacityHover = "0.2";
var lineOpacityFull = "1.0";

var lineStroke = "1.5px";
var lineStrokeHover = "2.5px";
var countyKeys = ["Alameda", "Alpine", "Amador", "Butte", "Calaveras", "Colusa", "Contra Costa", "Del Norte", "El Dorado", "Fresno", "Glenn", "Humboldt", "Imperial", "Inyo", "Kern", "Kings", "Lake", "Lassen", "Los Angeles", "Madera", "Marin", "Mariposa", "Mendocino", "Merced", "Modoc", "Mono", "Monterey", "Napa", "Nevada", "Orange", "Placer", "Plumas", "Riverside", "Sacramento", "San Benito", "San Bernardino", "San Diego", "San Francisco", "San Joaquin", "San Luis Obispo", "San Mateo", "Santa Barbara", "Santa Clara", "Santa Cruz", "Shasta", "Sierra", "Siskiyou", "Solano", "Sonoma", "Stanislaus", "Sutter", "Tehama", "Trinity", "Tulare", "Tuolumne", "Ventura", "Yolo", "Yuba"]