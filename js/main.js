var MONTHNAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
    ]

function drawMapFigure(dataID, config){
 // data is an array of objects, each of form
// {
//   "geography":
//      {"code": "AK", "fips": "2", "name": "Alaska"},
//    "value": 6.3
// }
    var containerID = config.id

    var slice = figureData[dataID]["data"]
    var minIn = Math.min.apply(Math,slice.map(function(o){return parseVal(o.value,"draw");}))
    var maxIn = Math.max.apply(Math,slice.map(function(o){return parseVal(o.value,"draw");}))
    var breaks = parseBreaks(minIn, maxIn)
    
    var breaks = getNiceBreaks(minIn,maxIn,5),
        min = breaks.min,
        max = breaks.max;
    var step = (max-min)/5.0
    var tempBreaks = parseBreaks(minIn, maxIn)

    var quantize = function(d){
      if(typeof(d) == "undefined"){
        return "no-data"
      }
      else{
        for(var i = 0; i < tempBreaks.length-1; i++){
          if(d > tempBreaks[i] && d <= tempBreaks[i+1]){
            return "q" + i + "-4"
            break
          }
        }
      }
      
    }

    var parent = d3.select("#"+containerID)
    parent.on("click",function(){mouseEvent(dataID,{"type":"Background"},"click")})
    $("#"+containerID).empty()
    parent.attr("class", "figure-container")

    parent.append("div")
      .attr("id",containerID + "_title")
    parent.append("div")
      .attr("id",containerID + "_bar-chart")
    parent.append("div")
      .attr("id",containerID + "_tooltip")
    parent.append("hr")
    parent.append("div")
      .attr("id",containerID + "_map")
      .attr("class", "map-container")
    parent.append("div")
      .attr("id", containerID + "_source")
      .attr("class", "map-source")

    drawMap()
    drawBars()
    drawTooltip()
    drawTitle()

  function drawMap(){

    var $graphic = $("#"+containerID + "_map");
    
    var aspect_width = 10;
    var aspect_height = 4;
    var margin = { top: 10, right: 10, bottom: 10, left: 20 };
    var width = ($graphic.width() - margin.left - margin.right);

    var height = Math.ceil((width * aspect_height) / aspect_width) - margin.top - margin.bottom;




    var svg = d3.select("#"+containerID + "_map")
      .attr("height", height)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("transform", "translate("   + margin.left + "," + margin.top + ")")



  

      var projection = d3.geo.albersUsa()
          .scale(width*.7 + margin.left + margin.right)
          .translate([(width+margin.left+margin.right) / 2, (height+margin.top+margin.bottom)/ 2]);

      var path = d3.geo.path()
          .projection(projection);



      var legend = svg.append("g")
      			   .attr("width",width+margin.left+margin.right)
      			   .attr("height",50)

      var keyWidth = 30
      var keyHeight = 15

      for (i=0; i<=5; i++){
        if(i !== 5){
          legend.append("rect")
            .attr("width",keyWidth)
            .attr("height",keyHeight)
            .attr("class",dataID + " q" + i + "-4")
            .attr("x",keyWidth*i)
            .on("mouseover",function(){ mouseEvent(dataID, {type: "Legend", "class": "q" + (this.getAttribute("x")/keyWidth) + "-4"}, "hover") })
            .on("mouseout", function(){mouseEvent(dataID,this,"exit")})
            .on("click",function(){ mouseEvent(dataID, {type: "Legend", "class": "q" + (this.getAttribute("x")/keyWidth) + "-4"}, "click") })

        }

        legend.append("text")
          .attr("x",-5+keyWidth*i)
          .attr("class","legend-labels " + dataID)
          .attr("y",-5)
          .text(function(){
            if (config["unit-type"] == "percent"){
              return tempBreaks[i] + "%"
            }
            else if (config["unit-type"] == "dollar"){
              var formatter = d3.format("$")
              return formatter(tempBreaks[i])
            }
            else{
              return tempBreaks[i]
            }
          })
      }

      // mouseEvent


      legend.attr("transform","translate("+ (width+margin.left+margin.right - keyWidth*5)/2 +",20)")

      d3.select(self.frameElement).style("height", height + "px");

      queue()
        .defer(d3.json, "shapefile/us-counties.json")
        .await(ready);

      function ready(error,us) {
        svg.append("g")
          .attr("id", "map-states")
        .selectAll("path")
          .data(topojson.feature(us, us.objects.states).features)
        .enter().append("path")
          .attr("class", function(d) {
            var state = slice.filter(function(obj){return obj.geography.fips == d.id})  ;
              if(state.length > 0){
              return "states " + dataID + " " + quantize(parseVal(state[0].value,"color")) + " FIPS_" + d.id
            }
            else{
              return "states NA " + dataID + " FIPS_" + d.id
            }
        })
          .attr("id", function(d) { return "state-outline_" + dataID + "_" + d.id ;})
          .attr("d", path)
          .on("mouseover", function(d){mouseEvent(dataID,d,"hover")})
          .on("mouseout", function(d){mouseEvent(dataID,d,"exit")})
          .on("click", function(d){mouseEvent(dataID,d,"click")})

    }
  }


var barSvg, barXAxis, barBase;

  function drawBars(){
    var $graphic = $("#"+containerID + "_bar-chart");

    var aspect_width = 41;
    var aspect_height = 6;
    var margin = { top: 20, right: 0, bottom: 0, left: 20 };
    var width = $graphic.width() - margin.left - margin.right;
    var height = Math.ceil((width * aspect_height) / aspect_width) - margin.top - margin.bottom;

    // Bar chart axes
    var x = d3.scale.ordinal()
        .rangeBands([margin.left, width],0.285)
        .domain(slice.sort(function(a,b){ return parseVal(b.value,"sort")-parseVal(a.value,"sort")}).map(function(d) { return d.geography.code; }));


    var svg = d3.select("#"+containerID + "_bar-chart")
      .attr("height", height)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("transform", "translate("   + margin.left + "," + margin.top + ")")

    var lowerBound;
    if(min < 0){
      lowerBound = min
    }
    else{
      lowerBound = 0
    }

    var y = d3.scale.linear()
        .range([height,0])
        .domain([lowerBound,min+step*7])


    svg
    .append("svg:line")
            .attr("x1", 0+margin.left)
            .attr("y1", y(min+step))
            .attr("x2", width - margin.right)
            .attr("y2", y(min+step))
        .attr("class","grid-line");
    svg.append("svg:line")
            .attr("x1", 0+margin.left)
            .attr("y1", y(min+6*step))
            .attr("x2", width - margin.right)
            .attr("y2", y(min+6*step))
        .attr("class","grid-line");

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickSize(0);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickValues([min+step, min+step*6])
        .tickFormat(function(d){
          // Check tick val and format accordingly. N -> int, N.5 -> 1 decimal place, N.25 -> 2 decimal places
          var formatter;
          if(parseInt(d) === d){
            formatter = d3.format(".0f")
            return formatter(d)
          }
          else if(parseInt(d*2) === d*2){
            formatter = d3.format(".1f")
            return formatter(d)
          }
          else if(parseInt(d*4) === d*4){
            formatter = d3.format(".2f")
            return formatter(d)
          }
          else{
            formatter = d3.format(".0f")
            return formatter(d)
          }
        })
        .tickSize(0)

      svg.append("g")
          .attr("class", "y axis")
          .attr("transform","translate(" + margin.left + ",0)")
          .call(yAxis)

      svg.selectAll(".bar")
          .data(slice)
        .enter().append("rect")
          .attr("class", function(d){
            var isUS;
            if(d.geography.fips == -99){
              isUS = "usa-bar "
            }
            else{
              isUS = ""
            }
            return isUS + "states " + dataID + " " + quantize(parseVal(d.value,"color")) + " FIPS_" + d.geography.fips
          })
          .attr("id", function(d) { return "bar-outline_" + dataID + "_" + d.geography.fips ;})
          .attr("x", function(d) { return x(d.geography.code); })
          .attr("width", x.rangeBand())
          //to handle negative bars, Bars either start at 0 or at neg value
          .attr("y", function(d) { return y(Math.max(0, parseVal(d.value,"draw"))) })
          .attr("height", function(d) { return Math.abs(y(0) - y(parseVal(d.value,"draw")));})
          .on("mouseover", function(d){ mouseEvent(dataID, {"value": parseVal(d.value,"text"), "type": "Bar", "id": this.id.replace("bar-outline_","").replace(dataID,"").replace("_","")}, "hover") })
          .on("mouseout", function(){ mouseEvent(dataID,this,"exit")})
          .on("click",function(d){ mouseEvent(dataID, {"value": parseVal(d.value,"text"), "type": "Bar", "id": this.id.replace("bar-outline_","").replace(dataID,"").replace("_","")}, "click") })
          ;

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + y(0)+ ")")
          .call(xAxis);
      barSvg = svg
      barXAxis = xAxis
      barBase = y(0)

      reapppendAxis()

//Grab all the x axis ticks, if the state they label has a negative value bar, pop them up above the x axis

  }

  function reapppendAxis(){
    d3.selectAll("#"+containerID + "_bar-chart .x.axis .tick text").remove()
    barSvg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + barBase+ ")")
      .call(barXAxis);

    var xTicks = $("#"+containerID + "_bar-chart .x.axis .tick text")
    xTicks.each(function(index,tick){
      if(tick.innerHTML == "US"){
        $(tick).attr("class", "usa-tick")
      }
      var value = parseVal(slice.filter(function(obj){return obj.geography.code == tick.innerHTML})[0].value,"color")
      if(typeof(value) == "undefined"){
        $(tick).attr("class","nullTick")
      }
      else if(value <= 0){
        $(tick).attr("dy","-.71em")  
      }
    });

  }

  function drawTooltip(){
    var data = figureData[dataID]
    var yearUpdated = data.yearUpdated
    //Get quarter from month, then subtract 1 to make it zero indexed
    // var quarterUpdated = Math.ceil(data.monthUpdated/3) - 1
   
    var usAvg = slice.filter(function(obj){return obj.geography.code == "US"})[0].value

    var graphic = d3.select("#"+containerID + "_tooltip");
    var tooltip = graphic.append('div')
      .attr('class',"tooltip-container " + dataID)

    var region = tooltip.append('div')
      .attr('class',"region-text")
    region.append('div')
        .attr('class','tooltip-title')
        .text('REGION/STATE')
    region.append('div')
        .attr('class','tooltip-data')
        .text("United States of America")

    var value = tooltip.append('div')
      .attr('class',"value-text")
    value.append('div')
        .attr('class','tooltip-title')
        .text('VALUE')
    value.append('div')
        .attr('class','tooltip-data')
        .text(function(){
          var formatter = d3.format(".1f")
          var dollarFormatter = d3.format("$0f")
          if (config["unit-type"] == "percent") { return formatter(usAvg) + "%" }
          else if (config["unit-type"] == "dollar"){ return dollarFormatter(usAvg)}
        })

    var quarter = tooltip.append('div')
      .attr('class',"quarter-text")
    quarter.append('div')
        .attr('class','tooltip-title')
        .text(function(){
          if (config["date-format"] == "month"){ return 'MONTH' }
          else if (config["date-format"] == "quarter"){ return 'QUARTER' } 
        })
    quarter.append('div')
        .attr('class','tooltip-data')
        .text(function(){
          if (config["date-format"] == "month"){ return MONTHNAMES[data.monthUpdated] }
          else if (config["date-format"] == "quarter"){ return getQuarter(data.monthUpdated) } 

        })
    if(typeof(data.monthUpdated) == "undefined"){
      quarter.remove()
    }

    var year = tooltip.append('div')
      .attr('class',"year-text")
    year.append('div')
        .attr('class','tooltip-title')
        .text('YEAR')
    year.append('div')
        .attr('class','tooltip-data')
        .text(yearUpdated)
    if(typeof(data.yearUpdated) == "undefined"){
      year.remove()
    }

    resizeTooltip(dataID);

  }

  function resizeTooltip(dataID){
  //Make width of tooltip text shrink-wrapped to width of elements. 3 margins, 3 px extra for rounding errors,
  //plus the widths of the elements
    var totalWidth = 30*3 + 1
    $(".tooltip-container." + dataID + " .tooltip-data")
    .each(function(index,value) {
      totalWidth += $(value).width();
    });
    d3.select("#"+containerID + "_tooltip .tooltip-container").attr("style","width:" + totalWidth + "px")
  }

  function drawTitle(){
//Writes out title, subtitle, units, and source line
    var data = figureData[dataID]
    var monthUpdated = data.monthUpdated
    var yearUpdated = data.yearUpdated

    var titleText = config.title
    var usAvg = slice.filter(function(obj){return obj.geography.code == "US"})[0].value
    var subtitleText = parseConfigText(config, dataID, config.subtitle, monthUpdated, yearUpdated, usAvg)

    var sourceText = "Source: " + parseConfigText(config, dataID, config.source, monthUpdated, yearUpdated, usAvg)
    d3.select("#" + containerID + "_source").html(sourceText)
    
    var graphic = d3.select("#"+containerID + "_title");

    var title = graphic.append('div')
      .attr('class',"title-container " + dataID)
    title.append('div')
      .attr('class','title-text')
      .text(titleText)

    .append('span')
      .attr('class','title-unit')
      .text('(' + config.unit + ')')

    title.append('div')
      .attr('class','title-subtitle')
      .html(subtitleText)

  }

  function parseBreaks(min, max){
    var breaks = config.breaks
    for (var i = 0; i < breaks.length; i++) {
      var val = breaks[i]
      if(typeof(val) != "number"){
        if ((val) == "{{min}}"){
          breaks[i] = Math.floor(min)
          continue
        }
        else if ((val) == "{{max}}"){
          breaks[i] = Math.ceil(max)
          continue
        }
      }
    }
    return breaks
  }

  function mouseEvent(dataID,element,event){
    // stopPropagation() means that clicks on bars and map do not trigger click on background

    d3.event.stopPropagation();

// state case
    if(element.type == "Feature" || element.type == "Bar"){
      var state = d3.select("#state-outline_" + dataID + "_" + element.id)
      var bar = d3.select("#bar-outline_" + dataID + "_" + element.id)

      var states = d3.selectAll(".FIPS_" + element.id)
      var stateNode = state[0][0]
      var barNode = bar[0][0]

      var obj = slice.filter(function(obj){return obj.geography.fips == element.id})[0]
      var name = obj.geography.name
      var formatter = d3.format(".1f")
      var dollarFormatter = d3.format("$0f")
      var value = formatter(obj.value)

      d3.selectAll(".tooltip-container." + dataID + " .year-text").classed("hidden",false)
      d3.selectAll(".tooltip-container." + dataID + " .value-text").classed("hidden",false)
      d3.selectAll(".tooltip-container." + dataID + " .quarter-text").classed("hidden",false)

      barNode.parentNode.appendChild(barNode)

      var nameDiv = d3.select("#"+containerID + "_tooltip .region-text .tooltip-data")
      var valueDiv = d3.select("#"+containerID + "_tooltip .value-text .tooltip-data")
      nameDiv.text(name)

      if(bar.classed("usa-bar")){
        bar.classed("hover",true)
        d3.selectAll('.usa-text_' + dataID)
          .classed('text-highlight',true)
        resizeTooltip(dataID);
      }
      else{
        stateNode.parentNode.appendChild(stateNode)


        var usAvg = slice.filter(function(obj){return obj.geography.code == "US"})[0].value
        if(config["unit-type"] == "percent"){
          usAvg = formatter(usAvg) + "%"
        }
        else if(config["unit-type"] == "dollar"){
          usAvg = dollarFormatter(usAvg)
        }

        nameDiv.append("div")
        .attr("class","tooltip-usa-average")
        .html("US Average: " + "<span class = usa_text-" + dataID + ">" + usAvg + "</span>" )

        resizeTooltip(dataID);

        if(event == "hover"){
          state.classed(event,true)
          bar.classed(event,true)
        }
        if(event == "click"){
          var clicked;
          if(element.type == "Feature"){
            clicked = state.classed(event)
          }
          if(element.type == "Bar"){
            clicked = bar.classed(event)

          }
          states.classed(event, !clicked)
          states.classed("hover",false)
          bar.classed(event, !clicked)
          bar.classed("hover",false)
        }
      }
      reapppendAxis()
      valueDiv.text(function(){
        //handle here instead of in parseVal bc formatter returns strings
          if (value == "NaN"){
            return "No Data"
          }
          else if(config["unit-type"] == "percent"){
            return formatter(value) + "%"
          }
          else if(config["unit-type"] == "dollar"){
            return dollarFormatter(value)
          }

        })
      resizeTooltip(dataID);



    }
// legend case
    else if(element.type == "Legend"){
      d3.selectAll("path." + dataID + ".states")
      .classed("demphasized",true)

      var states = d3.selectAll("." + dataID + "." + element.class)
      states.classed({"demphasized": false})
      states[0].forEach(function(s){ s.parentNode.appendChild(s)})
    }

    else if(element.type == "Background"){
      d3.selectAll(".click").classed("click",false)
    }

    if(event == "exit"){
      d3.selectAll(".hover").classed("hover",false)
      d3.selectAll(".demphasized").classed("demphasized",false)
      d3.selectAll(".text-highlight").classed("text-highlight",false)
      reapppendAxis()

    }
  }
}


function parseVal(value, useCase){
  if(typeof(value) == "number"){
      return value
  }
  else{
    switch(useCase){
      case "text":
        return "No Data"
      case "sort":
        return Number.NEGATIVE_INFINITY
      case "draw":
        return 0
      case "color":
        return undefined
    }
  }

}



function drawScatterPlot(config){
  var containerID = config.id

  var xSlice = figureData[config.x.id]["data"]
  var ySlice = figureData[config.y.id]["data"]
  var data = []

  for(i=0; i<xSlice.length; i++){
    data[i] = {}
    data[i]["x"] = xSlice[i]
    var result = ySlice.filter(function( obj ) {
      return obj.geography.fips == xSlice[i].geography.fips;
    });
    data[i]["y"] = result[0]
  }

  var parent = d3.select("#"+containerID)
  $("#"+containerID).empty()

  parent.append("div")
    .attr("id",containerID + "_title")
  parent.append("div")
    .attr("id",containerID + "_tooltip")
  parent.append("hr")
  parent.append("div")
    .attr("id",containerID + "_plot")
    .attr("class", "plot-container")
  parent.append("div")
    .attr("id",containerID + "_source")
    .attr("class", "plot-source")

  parent.attr("class","figure-container")

  var usAvgX = xSlice.filter(function(obj){return obj.geography.code == "US"})[0].value
  var usAvgY = ySlice.filter(function(obj){return obj.geography.code == "US"})[0].value

  drawTooltip()
  drawTitle()
  drawPlot()


  function drawTitle(){
    var monthUpdatedX = config.x.monthUpdated
    var yearUpdatedX = config.x.yearUpdated
    var monthUpdatedY = config.x.monthUpdated
    var yearUpdatedY = config.x.yearUpdated

    var titleText = config.title
    var subtitleText = parseConfigText(config, [config.x.id, config.y.id], config.subtitle, [monthUpdatedX, monthUpdatedY], [yearUpdatedX, yearUpdatedY], [usAvgX, usAvgY])

    var sourceText = "Source: " + parseConfigText(config, [config.x.id, config.y.id], config.source, [monthUpdatedX, monthUpdatedY], [yearUpdatedX, yearUpdatedY], [usAvgX, usAvgY])

    d3.select("#" + containerID + "_source").html(sourceText)

    var graphic = d3.select("#"+containerID + "_title");

    var title = graphic.append('div')
      .attr('class',"title-container " + config.x.id + "v" + config.y.id)
    title.append('div')
      .attr('class','title-text')
      .text(titleText)

    title.append('div')
      .attr('class','title-unit')
      .text(config.unit)
    title.append('div')
      .attr('class','title-subtitle')
      .html(subtitleText)

  }

  function drawTooltip(){
    var graphic = d3.select("#"+containerID + "_tooltip");
    var tooltip = graphic.append('div')
      .attr('class',"tooltip-container scatter " + config.x.id + "v" + config.y.id)

    var region = tooltip.append('div')
      .attr('class',"region-text")
    region.append('div')
        .attr('class','tooltip-title')
        .text('REGION/STATE')
    region.append('div')
        .attr('class','tooltip-data')
        .text("UNITED STATES OF AMERICA")

    var formatter = d3.format(".1f")
    var dollarFormatter = d3.format("$0f")
    
    var xValue = tooltip.append('div')
      .attr('class',"value-text x")
    xValue.append('div')
        .attr('class','tooltip-title')
        .text("X-VALUE")
    xValue.append('div')
        .attr('class','tooltip-data')
        .text(function(){
          if (config.x["unit-type"] == "percent") { return formatter(usAvgX) + "%" }
          else if (config.x["unit-type"] == "dollar"){ return dollarFormatter(usAvgX)}
        })

    var yValue = tooltip.append('div')
      .attr('class',"value-text y")
    yValue.append('div')
        .attr('class','tooltip-title')
        .text("Y-VALUE")
    yValue.append('div')
        .attr('class','tooltip-data')
        .text(function(){
          if (config.y["unit-type"] == "percent") { return formatter(usAvgY) + "%" }
          else if (config.y["unit-type"] == "dollar"){ return dollarFormatter(usAvgY)}
        })


    resizeTooltip(config.x.id + "v" + config.y.id);

  }


  function resizeTooltip(dataID){
  //Make width of tooltip text shrink-wrapped to width of elements. 3 margins, 3 px extra for rounding errors,
  //plus the widths of the elements
    var totalWidth = 30*2 + 2
    $(".tooltip-container." + dataID + " .tooltip-data")
    .each(function(index,value) {
      if($(value).text() == "United States of America"){
//man this is some janky nonsense, wasn't pulling in the correct width for USA text...ugh
        totalWidth += 290
      }
      else{
        totalWidth += $(value).width();
      }
    });
    d3.select("#"+containerID + "_tooltip .tooltip-container").attr("style","width:" + totalWidth + "px")
  }


  function drawPlot(){
    var $graphic = $("#"+containerID + "_plot");

    var aspect_width = 2;
    var aspect_height = 1;
    var margin = { top: 30, right: 20, bottom: 30, left: 40 };
    var width = $graphic.width() - margin.left - margin.right;

    var height = Math.ceil((width * aspect_height) / aspect_width) - margin.top - margin.bottom;

    var x = d3.scale.linear()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var color = d3.scale.category10();

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(4)

    var svg = d3.select("#"+containerID + "_plot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var legend = svg.append("g")
      .attr("transform", "translate(-19 ,-20)");
    var regions = ["Northeast", "Midwest", "South", "West"]
    for(var i = 0; i< regions.length; i++){
      legend.append("rect")
        .attr("class", "plot-key " + regions[i])
        .attr("width", 10)
        .attr("height", 10)
        .attr("transform", "translate(" + i*width/8 + ",0)")
        .on("mouseover", function(){
          var region  = this.getAttribute("class").replace("plot-key ","")
          d3.selectAll("#" + containerID + " " + ".dot")
          .classed("demphasized",true)

          d3.selectAll("#" + containerID + " " + ".dot." + region)
          .classed("demphasized",false)

        })
        .on("mouseout",function(){ d3.selectAll(".dot").classed("demphasized",false) });   
      
      legend.append("text")
        .attr("class","legend-labels")
        .text(regions[i])
        .attr("transform","translate(" + parseInt(15 + (i*width/8)) + ",10)")
        .on("mouseover", function(){
          var region  = this.innerHTML
          d3.selectAll("#" + containerID + " " + ".dot")
          .classed("demphasized",true)

          d3.selectAll("#" + containerID + " " + ".dot." + region)
          .classed("demphasized",false)

        })
        .on("mouseout",function(){ d3.selectAll(".dot").classed("demphasized",false) });
    }

    x.domain(d3.extent(xSlice, function(d) { return d.value; })).nice();
    y.domain(d3.extent(ySlice, function(d) { return d.value; })).nice();
    svg.selectAll(".dot-line")
        .data(data)
      .enter().append("line")
        .attr("class", "dot-line")
        .attr("x1",function(d) { return x(d.x.value); })
        .attr("x2",function(d) { return x(d.x.value); })
        .attr("y1",function(d) { return y(d.y.value); })
        .attr("y2", y(0))



    svg.append("g")
        .attr("class", "x axis scatter")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
      .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text(config.x.label);

    svg.append("g")
        .attr("class", "y axis scatter")
        .call(yAxis)
      .append("text")
        .attr("class", "label")
        .attr("y", 6)
        .attr("dx", "-2em")
        .attr("dy", ".71em")
        .text(config.y.label)

    svg.append("line")
        .attr("class","scatter-baseline")
        .attr("x1",x(0))
        .attr("x2",x(0))
        .attr("y1",20)
        .attr("y2",height)

    svg.selectAll(".y.axis.scatter .tick line")
      .attr("x1",0)
      .attr("x2",width)
      .attr("class","scatter-grid")

    svg.append("line")
        .attr("class","scatter-baseline")
        .attr("x1",0)
        .attr("x2",width)
        .attr("y1",y(0))
        .attr("y2",y(0))



    svg.selectAll(".dot")
        .data(data)
      .enter().append("circle")
        .attr("class", function(d) {return "dot " + d.x.geography.region + " FIPS_" + d.x.geography.fips;})
        .attr("r", 7)
        .attr("cx", function(d) { return x(d.x.value); })
        .attr("cy", function(d) { return y(d.y.value); })
        .on("mouseover", function(d){
          if(d.x.geography.fips == -99){
            d3.select(".usa-text_" + config.x.id).classed("text-highlight", true)
            d3.select(".usa-text_" + config.y.id).classed("text-highlight", true)
          }
          else{
            d3.select(this).classed("hover",true)
          }
          d3.select(".tooltip-container." + config.x.id + "v" + config.y.id + " .region-text .tooltip-data").text(d.x.geography.name)
          d3.selectAll(".tooltip-container." + config.x.id + "v" + config.y.id + " .value-text").classed("hidden",false)
          var formatter = d3.format(".1f")
          var dollarFormatter = d3.format("$0f")
          d3.selectAll(".tooltip-container." + config.x.id + "v" + config.y.id + " .value-text.x .tooltip-data").text(function(){
            if(config.x["unit-type"] == "percent"){
              return formatter(d.x.value) + "%"
            }
            else if(config.x["unit-type"] == "dollar"){
              return dollarFormatter(d.x.value)
            }
          })
          d3.selectAll(".tooltip-container." + config.x.id + "v" + config.y.id + " .value-text.y .tooltip-data").text(function(){
            if(config.y["unit-type"] == "percent"){
              return formatter(d.y.value) + "%"
            }
            else if(config.y["unit-type"] == "dollar"){
              return dollarFormatter(d.y.value)
            }
          })

          resizeTooltip(config.x.id + "v" + config.y.id);
        })
        .on("mouseout", function(){
          d3.selectAll(".dot").classed("hover",false)
          d3.selectAll(".text-highlight").classed("text-highlight",false)
        })
        .on("click",function(d){
          if(d.x.geography.fips != -99){
            var clicked = d3.select(this).classed("click")
            d3.selectAll(".FIPS_" + d.x.geography.fips).classed("click",!clicked)
            d3.select(this).classed("click", !clicked).classed("hover",false)
          }
        })
    }
}



function parseConfigText(config, dataID, text, excelMonth, excelYear, usAvg){
  var outStr
  if (dataID.constructor !== Array){
    outStr = parseText(config, dataID, text, config["date-updated"], excelMonth, excelYear, usAvg, "")
  }
  else{
    tempStr = parseText(config.x, dataID[0], text, config.x["date-updated"], excelMonth[0], excelYear[1], usAvg[0], "x-")
    outStr = parseText(config.y, dataID[1], tempStr, config.y["date-updated"], excelMonth[0], excelYear[1], usAvg[1], "y-")

  }

  function parseText(conf, dID, text, cDate, eMonth, eYear, avg, prefix){
    var configFormat = conf["date-format"]
    var unitType = conf["unit-type"]
    var inStr = text;

    var month, year, prevYear;
    if (cDate == "{{excel}}"){
      month = eMonth
      year = eYear
      prevYear = year -1
    }
    else{
      month = parseInt(cDate.split("/")[0])
      year = parseInt(cDate.split("/")[1])
      prevYear = year -1
    }

    var datePrevious, dateUpdated, usaValue, usaChanged;
    if (configFormat == "month"){
      dateUpdated = MONTHNAMES[month - 1] + ", " + year
      datePrevious = MONTHNAMES[month - 1] + ", " + prevYear
    }
    else if (configFormat == "quarter"){
      dateUpdated = "the " + getQuarter(month).toLowerCase() + " quarter of " + year
      datePrevious = "the " + getQuarter(month).toLowerCase() + " quarter of " + prevYear
    }

    var formatter = d3.format(".1f");
    if(unitType == "percent"){
      usaValue = formatter(Math.abs(avg)) + "%"
    }
    else if(unitType == "dollar"){
      var dollarFormatter = d3.format("$0f")
      usaValue = dollarFormatter(Math.abs(avg))
    }

    
    usaValue = "<span class = \"usa-text_" + dID + "\">" + usaValue + "</span>"

    if(formatter(avg) == "0.0"){
      usaChanged = " did not change"
    }
    else if(avg > 0){
      usaChanged = "increased by " + usaValue 
    }
    else if(avg < 0){
      usaChanged = "decreased by " + usaValue
    }

    return inStr
                .replace("{{" + prefix + "date-updated}}", dateUpdated)
                .replace("{{" + prefix + "date-previous}}", datePrevious)
                .replace("{{" + prefix + "usa-value}}", usaValue)
                .replace("{{" + prefix + "usa-changed}}", usaChanged)
  }
  return outStr

}

function getQuarter(q){
  var quarterNames = ["First","Second","Third","Fourth"]
  return quarterNames[Math.ceil(q/3)-1]
}

function getNiceBreaks(min,max,bins){
	function isNice(val){
		if (val%bins == 0){
			return true;
		}
		else{
			return false;
		}
	}
	breaks = {"min":null,"max":null}
	if (isNice(Math.ceil(max)-Math.floor(min))){
		breaks.min = Math.floor(min)
		breaks.max = Math.ceil(max)
	}
	else if (isNice(Math.ceil(max*2)/2 - Math.floor(min*2)/2)){
		breaks.min = Math.floor(min*2)/2
		breaks.max = Math.ceil(max*2)/2
	}
	else if (isNice(Math.ceil(max*4)/4 - Math.floor(min*4)/4)){
		breaks.min = Math.floor(min*4)/4
		breaks.max = Math.ceil(max*4)/4
	}
	else if (isNice(Math.ceil(max)+1 - Math.floor(min))){
		breaks.min = Math.floor(min)
		breaks.max = Math.ceil(max)+1
	}
	else{
		breaks.min = Math.floor(min)
		breaks.max = Math.floor(max)
	}

	return breaks
}


function drawGraphic(){

  $(document).keyup(function(e) {
    if (e.keyCode == 27) { d3.selectAll(".click").classed("click",false) }// escape key deselects everything
  });

  $.each(semConfig.Maps, function(dataID, config) {
      drawMapFigure(dataID, config)
  });
  $.each(semConfig.ScatterPlots, function(figureName, config) {
      drawScatterPlot(config)
  });
}

drawGraphic();
window.onresize = drawGraphic;