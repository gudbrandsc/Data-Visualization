

function drawLineChart() {
    let svg = d3.select("body").select("svg#vis2");

    let sortedMap = hourMap.keys().sort(function(x, y) {
        return d3.ascending(parseInt(x), parseInt(y))
    });

    let dataPoints = [];
    for (let i = 0; i < sortedMap.length; i++) {
        dataPoints.push({ "x": i, "y": hourMap.get(i)});
    };

    let countMin = 0;
    let countMax = d3.max(hourMap.values());

    let margin = {
        top:    60,
        right:  15,
        bottom: 90,
        left:   60
    };

    // now we can calculate how much space we have to plot
    let bounds = svg.node().getBoundingClientRect();
    let plotWidth = bounds.width - margin.right - margin.left;
    let plotHeight = bounds.height - margin.top - margin.bottom;

    let countScale = d3.scaleLinear()
        .domain([countMin, countMax])
        .rangeRound([plotHeight, 0])
        .nice();

    let hourScale = d3.scaleBand()
        .domain(sortedMap)
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
        xGroup.attr("transform", "translate(0," + plotHeight + ")");

        let yGroup = plot.append("g").attr("id", "y-axis");
        yGroup.call(yAxis);
        yGroup.attr("transform", "translate(0,0)");
    } else {
        plot.select("g#y-axis").call(yAxis);
    }

    var gridlines = d3.axisLeft(countScale)
        .tickFormat("")
        .tickSize(-plotWidth);

    plot.append("g")
        .call(gridlines)
        .attr("color", "#E2E2E2");

    var lineFunction = d3.line()
        .x(function(d) { return hourScale(d.x); })
        .y(function(d) { return countScale(d.y); });


    svg.append("text")
        .style("font-size", "14")
        .attr("y", 570)
        .attr("x", 10)
        .style("text-anchor", "start")
        .style("fill", "#888888")
        .text("Created by: Gudbrand Schistad");

    svg.append("text")
        .style("font-size", "14")
        .attr("y", 590)
        .attr("x", 10)
        .style("text-anchor", "start")
        .style("fill", "#888888")
        .text("Description: This graps show the total number of incidents that were reported for each hour. The data is represents all incident reports for 2018. ");



    plot.append("path")
        .attr("d", lineFunction(dataPoints))
        .attr("stroke", "#1171e4")
        .attr("stroke-width", 2)
        .attr("fill", "none");

    svg.append("text")
    // .attr("id", "graph-title")
        .style("font-size", "25")
        .attr("y", margin.top/2)
        .attr("x", 10)
        .style("text-anchor", "start")
        .text("Total number of Incidents reported per hour in 2018");

    plot.append("text")
    // .attr("id", "x-axis-title")
        .style("font-size", "14")
        .attr("transform",
            "translate(" + (plotWidth/2) + " ,"
            + (plotHeight + 40) + ")")
        .style("text-anchor", "middle")
        .text("Hour of Incident Time");

    plot.append("text")
    // .attr("id", "y-axis-title")
        .style("font-size", "14")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 8)
        .attr("x", -(plotHeight/2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Number of Incidents");

};