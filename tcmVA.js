// global variables
// Scatterplot
var g_scwidth = 600;
var g_scheight = 600;
var g_sgwidth = 1400;
var g_sgLegendWidth = 100;
var g_sgheight = 300;
var gBrushes = [];
var gSympData = [];
var gSqwwData = [];
var gRxTimeData = [];
var margin = { left: 20, right: 20, top: 40, bottom: 40 };

// Scatterplot objects
var gScatterSymp = [];
var gScatterSqww = [];
// Streamgraph objects
var gStreamRx = [];

//User selection with burshing
var brushes = [];
var gPoints = [];
var gSelectedPoints = [];
var gNotSelectedPoints = [];
// colors of streamgraph bands by user brushing
var gStreamGraphLayers = [];
var gStreamGraphKeys = [];
var gStreamBandColors = [];
var gStreamGraphSelected = null;
// Expert classified colors and default (text book) colors
var gExpColRange = [];
var gDefaultColRange = [];
// Patients' data

var gPatient = 0;
var gPatientVisitDate = [];
var gPatientCompare = 0;
var gRxFilenameList = ["medByVisitP1fixed.csv", "medByVisitP2fixed.csv", "medByVisitP3fixed.csv"];
var gRxAllPatientsKeys = []; // record medicine used by each patient
var gTestFilenameList = ["bingren1.csv", "bingren2.csv", "bingren3.csv"];
// Medicine attributes
var gMedProperties = [];
var gDefaultMedClass = [];
var gExpertMedClass = [];
var gDefaultMedMajorClass = ["利水渗湿药", "化湿药", "收敛药", "泻下药", "止血药", "消食药", "活血祛瘀药", "清热类", "理气药", "补虚药", "解表药"];

// Lasso functions
// create a container with position relative to handle our canvas layer
// and our SVG interaction layer
var visRoot = [];
var canvas = [];
// Linked views
var linkedView1 = [];
var linkedView2 = [];
var linkedView3 = [];
var linkedView4 = [];
var linkedView5 = [];
var colorMap = d3.scaleOrdinal(d3.schemePaired);
// Save data to CSV
function exportToCsv(filename, rows) {
  var processRow = function (row) {
    var finalVal = '';
    for (var j = 0; j < row.length; j++) {
      var innerValue = row[j] === null ? '' : row[j].toString();
      if (row[j] instanceof Date) {
        innerValue = row[j].toLocaleString();
      };
      var result = innerValue.replace(/"/g, '""');
      if (result.search(/("|,|\n)/g) >= 0)
        result = '"' + result + '"';
      if (j > 0)
        finalVal += ',';
      finalVal += result;
    }
    return finalVal + '\n';
  };

  var csvFile = '';
  for (var i = 0; i < rows.length; i++) {
    csvFile += processRow(rows[i]);
  }

  var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
  if (navigator.msSaveBlob) { // IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    var link = document.createElement("a");
    if (link.download !== undefined) { // feature detection
      // Browsers that support HTML5 download attribute
      var url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

function defaultColoring(d) {
  if (gDefaultMedMajorClass.length > 0) {
    // Default classification by medicine classification
    var medClass = -1;
    for (var ii = 0; ii < gMedProperties.length; ii++) {
      if (d.name == gMedProperties[ii].name) {
        // Search the name of medicine classification in the major classification list
        for (var j = 0; j < gDefaultMedMajorClass.length; j++) {
          if (gMedProperties[ii].class.search(gDefaultMedMajorClass[j]) >= 0) {
            medClass = j;
            break;
          }
        }
      }

      if (medClass >= 0)
        break;
    }
    if (medClass < 0)
      return "blue";
    else
      return gDefaultColRange(gDefaultMedMajorClass[medClass]);
  }
  else
    return "blue";
}

function expColoring(d) {
  if (gExpertMedClass.length > 0) {
    // Default classification by medicine classification
    var medClass = -1;
    for (var ii = 0; ii < gMedProperties.length; ii++) {
      if (d.name == gMedProperties[ii].name) {
        // Search the name of medicine classification in the major classification list
        for (var j = 0; j < gExpertMedClass.length; j++) {
          if (gMedProperties[ii].classExp.search(gExpertMedClass[j]) >= 0) {
            medClass = j;//gExpertMedClass.length - j -1;
            break;
          }
        }
      }

      if (medClass >= 0)
        break;
    }
    if (medClass < 0)
      return "blue";
    else
      return gExpColRange(gExpertMedClass[medClass]);
  }
  else
    return "blue";
}


// when a lasso is completed, filter to the points within the lasso polygon
function handleLassoEnd(lassoPolygon) {

  var points = gPoints;
  gSelectedPoints = points.filter(d => {
    // note we have to undo any transforms done to the x and y to match with the
    // coordinate system in the svg.
    const x = d.x + margin.left; //padding.left;
    const y = d.y + margin.top; //padding.top;
    // const name = d.name;
    // const pinyin = d.pinyin;
    return d3.polygonContains(lassoPolygon, [x, y]);
  });

  //   var selectedPointsSqww = points.filter(d => {
  //     // note we have to undo any transforms done to the x and y to match with the
  //     // coordinate system in the svg.
  //     const x2 = d.x2+ margin.left; //padding.left;
  //     const y2 = d.y2+ margin.top; //padding.top;
  //     // const name = d.name;
  //     // const pinyin = d.pinyin;
  //     return d3.polygonContains(lassoPolygon, [x2, y2]);
  // });

  // gSelectedPoints = gSelectedPoints.concat(selectedPointsSqww);

  gNotSelectedPoints = [];
  for (var i = 0; i < gPoints.length; i++) {
    var isSelected = false;
    for (var j = 0; j < gSelectedPoints.length; j++) {
      if (gSelectedPoints[j].id == gPoints[i].id) {
        isSelected = true;
        break;
      }
    }
    if (!isSelected)
      gNotSelectedPoints.push(gPoints[i]);
  }
  // Add brush to the brush array
  // var brush = lassoFunction(d3.select("#scSymp"));
  gBrushes.push({
    id: gBrushes.length,
    // brush: brush,
    color: colorMap(gBrushes.length),
    points: gSelectedPoints
  });
  updateSelectedPoints(gSelectedPoints);
}

function handleLassoEndInstance2(lassoPolygon) {

  var points = gPoints;
  gSelectedPoints = points.filter(d => {
    // note we have to undo any transforms done to the x and y to match with the
    // coordinate system in the svg.
    const x2 = d.x2 + margin.left; //padding.left;
    const y2 = d.y2 + margin.top; //padding.top;
    // const name = d.name;
    // const pinyin = d.pinyin;
    return d3.polygonContains(lassoPolygon, [x2, y2]);
  });

  gNotSelectedPoints = [];
  for (var i = 0; i < gPoints.length; i++) {
    var isSelected = false;
    for (var j = 0; j < gSelectedPoints.length; j++) {
      if (gSelectedPoints[j].id == gPoints[i].id) {
        isSelected = true;
        break;
      }
    }
    if (!isSelected)
      gNotSelectedPoints.push(gPoints[i]);
  }
  // Add brush to the brush array
  // var brush = lassoFunction(d3.select("#scSymp"));
  gBrushes.push({
    id: gBrushes.length,
    // brush: brush,
    color: colorMap(gBrushes.length),
    points: gSelectedPoints
  });
  updateSelectedPoints(gSelectedPoints);
}

// reset selected points when starting a new polygon
function handleLassoStart(_lassoPolygon) {
  updateSelectedPoints([]);
}

// when we have selected points, update the colors and redraw
function updateSelectedPoints(selectedPoints) {
  var points = gPoints;
  // if no selected points, reset to all tomato
  if (!selectedPoints.length) {
    // reset all
    points.forEach(d => {
      d.color = 'tomato';
    });

    // otherwise gray out selected and color selected black
  } else {
    points.forEach(d => {
      d.color = '#eee';
      // Check if it's lately selected
      for (var i = 0; i < selectedPoints.length; i++) {
        if (d.id == selectedPoints[i].id) {
          d.brushedId = gBrushes.length - 1;
          // Check if the medicine is in the streamgraph
          for (var j = 0; j < gStreamGraphLayers.length; j++) {
            if (d.name == gStreamGraphLayers[j].key) {
              gStreamBandColors.push({ name: d.name, color: colorMap(d.brushedId) });
              break;
            }
          }
          break;
        }
      }
    });
    selectedPoints.forEach(d => {
      d.color = '#000';
      d.brushedId = gBrushes.length - 1; // Set brushed Id
    });

  }

  // redraw with new colors
  redrawAll();
}

// helper to actually draw points on the canvas
function redrawAll() {

  // Check what medicine are used in the streamgraph

  // Need to update multiple linked views!!!
  // Symptoms view
  const context1 = d3.select("#scSymp");
  var allDotsSymp = context1.selectAll(".dot");
  allDotsSymp.data(gPoints)
    .attr("r", function (d) {
      // check if the point is selected by SelectedPoints
      for (var i = 0; i < gSelectedPoints.length; i++) {
        if (gSelectedPoints[i].id == d.id)
          return 18;
      }
      return 15.5;
    })
    .style("fill", function (d) {
      // Check all brushed groups
      if (d.brushedId >= 0)
        return gBrushes[d.brushedId].color;
      else
        return defaultColoring(d);//"#045A8D";
    })
    .style("stroke",function(d){
      // check if gStreamSelected is true
      if(gStreamGraphSelected != null)
      {
        if(d.name === gStreamGraphSelected)
          return "red";
        else
          return "none";
      }
      else
        return "none";
    })
    .style("stroke-width",5)
    .attr("opacity", function (d) {
      // for(var i = 0; i < gStreamGraphKeys.length; i++){
      //   if(d.name == gStreamGraphKeys[i])
      //     return 1;
      // }

      if (gRxAllPatientsKeys.length == 0)
        return 0;
      for (var i = 0; i < gRxAllPatientsKeys[gPatient].length; i++) {
        if (d.name == gRxAllPatientsKeys[gPatient][i])
          return 1;
      }
      return 0.02;
    });
  // update opacity of text
  var textSymp = context1.selectAll(".dotLabel");
  textSymp.data(gPoints)
    // draw text of medicine
    .attr("opacity", function (d) {
      if (gRxAllPatientsKeys.length == 0)
        return 0;
      for (var i = 0; i < gRxAllPatientsKeys[gPatient].length; i++) {
        if (d.name == gRxAllPatientsKeys[gPatient][i])
          return 1;
      }
      return 0.02;
    });
  // interactive lens
  context1.on("mouseover", function () {
    // magicLens(50, this);
    mousex = d3.mouse(this);
    var r = 100;
    var ww = 14;
    // draw items within the lens area
    var r2 = r * r;
    var pointsInLens = [];
    for(var i = 0; i < gPoints.length; i++)
    {
      // Mind the offest between canvas and the svg due to the margin!!!
      var pointCorrected = {};
      pointCorrected.x = gPoints[i].x + margin.left;
      pointCorrected.y = gPoints[i].y + margin.bottom;


      var dist2 = (pointCorrected.x - mousex[0])*(pointCorrected.x - mousex[0]) +
      (pointCorrected.y-mousex[1])*(pointCorrected.y-mousex[1]);

      if(dist2 <= r2)
      {
        pointsInLens.push(gPoints[i]);
      }
    }
    var canvas = d3.select(".scSymp_canvas");
    // draw the lens covering the original layer
    canvas.selectAll(".lens").remove();
    var lensNode = canvas.append("g")
      .attr("class", "lens");

    lensNode.append("circle")
      .attr("r", r)
      .attr("opacity", 0.8)
      .attr("cx", function () { return mousex[0]- margin.left;  }) //;
      .attr("cy", function () { return mousex[1]- margin.bottom;}) //- margin.bottom;
      .style('stroke', '#AAA')
      .style('fill', '#CCC');
    // add extra info
   lensNode.append("text")
   .text(function () { return "VS. Patient "+ (gPatientCompare+1); })
   .style("font-size", "12px")
   .attr("x", function () { return mousex[0]- margin.left + 45; })
   .attr("y", function () { return mousex[1]- margin.bottom -5 + r; });

  // remove old items
  canvas.selectAll(".magicLensDot").remove();
  canvas.selectAll(".magicLensSquare").remove();
  canvas.selectAll(".magicLensDotLabel").remove();
  canvas.selectAll(".magicLensCurrMissMark").remove();
  // draw new items
    var node = canvas.selectAll(".magicLensDot")
       .data(pointsInLens)
      .enter();
      // .append("g");
     // draw the glyph
     node.append("circle")
     .attr("class", "magicLensDot")
     .attr("r", 15.5)
     .attr("cx", function (d) { return d.x; })
     .attr("cy", function (d) { return d.y; })
     .style("fill", function (d) {
       // Check all brushed groups
       if (d.brushedId >= 0)
         return gBrushes[d.brushedId].color;
       else
         return defaultColoring(d);
       //  return "#045A8D";

     })
     .attr("opacity", function (d) {
       // if the medicine is present in the comparison view
       for (var j = 0; j < gRxAllPatientsKeys[gPatientCompare].length; j++) {
         if (d.name == gRxAllPatientsKeys[gPatientCompare][j])
           return 1;
       }
       return 0.02;
     });
    // With inner rectangle
    var node2 = canvas.selectAll(".magicLensSquare")
      .data(pointsInLens)
      .enter();
    node2.append("rect")
      .attr("class", "magicLensSquare")
      .attr("width", ww)
      .attr("height", ww)
      .attr("x", function (d) { return d.x - ww / 2; })
      .attr("y", function (d) { return d.y - ww / 2; })
      .style("fill", function (d) {
        return expColoring(d);
      })
      .attr("opacity", function (d) {
        for (var j = 0; j < gRxAllPatientsKeys[gPatientCompare].length; j++) {
          if (d.name == gRxAllPatientsKeys[gPatientCompare][j])
            return 1;
        }
        return 0.02;
      });
      // Draw text
      var textNode = canvas.selectAll(".magicLensDotLabel");
      textNode.data(pointsInLens)
      .enter()
      .append("text")
      .attr("class","magicLensDotLabel")
      .text(function (d) { return d.name; })
      .style("font-size", "12px")
      .attr("x", function (d) { return d.x - 30; })
      .attr("y", function (d) { return d.y - 10; })
      // draw text of medicine
      .attr("opacity", function (d) {
        if (gRxAllPatientsKeys.length == 0)
          return 0;
          for (var j = 0; j < gRxAllPatientsKeys[gPatientCompare].length; j++) {
            if (d.name == gRxAllPatientsKeys[gPatientCompare][j])
              return 1;
          }
          return 0.02;
      });
        // Draw current not present mark
        var xMarkNode = canvas.selectAll(".magicLensCurrMissMark");
        xMarkNode.data(pointsInLens)
        .enter()
        .append("text")
        .attr("class","magicLensCurrMissMark")
        .text(function () { return "X"; })
        .style("font-size", "12px")
        .attr("x", function (d) { return d.x-5; })
        .attr("y", function (d) { return d.y+2; })
        // draw the X mark if the medicine is not present in the current patient's Rx
        .attr("opacity", function (d) {
          // check if the medicine is present
            for (var j = 0; j < gRxAllPatientsKeys[gPatient].length; j++) {
              if (d.name == gRxAllPatientsKeys[gPatient][j])
                return 0;
            }
            for(var j = 0; j <gRxAllPatientsKeys[gPatientCompare].length;j++)
            {
              if (d.name == gRxAllPatientsKeys[gPatientCompare][j])
                return 0.8;
            }
            return 0;
        });
  });

  var allRectsSymp = context1.selectAll(".square");
  allRectsSymp.data(gPoints)
    .attr("opacity", function (d) {
      for (var i = 0; i < gRxAllPatientsKeys[gPatient].length; i++) {
        if (d.name == gRxAllPatientsKeys[gPatient][i])
          return 1;
      }
      return 0.02;
    });

  // Compare View
  const context2 = d3.select("#scCompare");
  var allDotsSqww = context2.selectAll(".dot");
  allDotsSqww.data(gPoints)
    .attr("r", function (d) {
      // check if the point is selected by SelectedPoints
      for (var i = 0; i < gSelectedPoints.length; i++) {
        if (gSelectedPoints[i].id == d.id)
          return 18;
      }
      return 15.5;
    })
    .style("fill", function (d) {
      // Check all brushed groups
      if (d.brushedId >= 0)
        return gBrushes[d.brushedId].color;
      else
        return defaultColoring(d);
      //  return "#045A8D";
    })
    .attr("opacity", function (d) {
      for (var i = 0; i < gRxAllPatientsKeys[gPatientCompare].length; i++) {
        if (d.name == gRxAllPatientsKeys[gPatientCompare][i])
          return 1;
      }
      return 0.02;
    });
  // update opacity of text
  var textSqww = context2.selectAll(".dotLabel");
  textSqww.data(gPoints)
    // draw text of medicine
    .attr("opacity", function (d) {
      if (gRxAllPatientsKeys.length == 0)
        return 0;
      for (var i = 0; i < gRxAllPatientsKeys[gPatientCompare].length; i++) {
        if (d.name == gRxAllPatientsKeys[gPatientCompare][i])
          return 1;
      }
      return 0.02;
    });
  // interactive lens
  context2.on("mouseover", function () {
    mousex = d3.mouse(this);
    // mousey = mousex[0] + 5;
    context2.selectAll(".lens").remove();
    context2.
      append("circle")
      .attr("class", "lens")
      .attr("r", 80)
      .attr("opacity", 0.1)
      .attr("cx", function () { return mousex[0]; })
      .attr("cy", function () { return mousex[1]; })
      .style('stroke', '#AAA')
      .style('fill', '#CCC');
  });


  var allRectsSqww = context2.selectAll(".square");
  allRectsSqww.data(gPoints)
    .attr("opacity", function (d) {
      for (var i = 0; i < gRxAllPatientsKeys[gPatientCompare].length; i++) {
        if (d.name == gRxAllPatientsKeys[gPatientCompare][i])
          return 1;
      }
      return 0.02;
    });

  // Stream graph
  const context3 = d3.select("#streamGraph");
  var bands = context3.selectAll(".layer");
  bands.attr("class", "layer")
    .style("fill", function (d, _i) {
      // for(var j = 0; j < gStreamBandColors.length; j++){
      //   if(d.key == gStreamBandColors[j].name)
      //     return gStreamBandColors[j].color;
      // }
      // return gDefaultColRange(i);
      var medClass = -1;
      for (var ii = 0; ii < gMedProperties.length; ii++) {
        if (d.key == gMedProperties[ii].name) {
          // Search the name of medicine classification in the major classification list
          for (var j = 0; j < gExpertMedClass.length; j++) {
            if (gMedProperties[ii].classExp.search(gExpertMedClass[j]) >= 0) {
              medClass = j;
              break;
            }
          }
        }

        if (medClass >= 0)
          break;
      }
      return gExpColRange(gExpertMedClass[medClass]);
      // expColoring(d);
    });
}

// attach lasso to interaction SVG
function lassoFunction(interactionSvg) {
  // console.log(interactionSvg);
  var lassoInstance = lasso(interactionSvg)
    .on('end', handleLassoEnd)
    .on('start', handleLassoStart);

  interactionSvg.call(lassoInstance);

  return lassoInstance;
}

function lassoFunctionInstance2(interactionSvg) {
  // console.log(interactionSvg);
  var lassoInstance = lasso(interactionSvg)
    .on('end', handleLassoEndInstance2)
    .on('start', handleLassoStart);

  interactionSvg.call(lassoInstance);

  return lassoInstance;
}

// Draw linecharts
function drawLinecharts(csvName, divName, sgWidth, sgHeight, isPulse = false) {
  var margin = { top: 5, right: 40, bottom: 25, left: 50 };
  // var parseDate = d3.time.format("%d-%b-%y").parse;
  var parseDate = d3.timeParse("%d-%b-%y");

  var width = sgWidth - margin.left - margin.right;
  var height = sgHeight - margin.top - margin.bottom;
  // var x = d3.scaleTime().range([0, width]);
  var x = d3.scaleLinear().range([0, width]);
  var y0 = d3.scaleLinear().range([height, 0]);
  var y1 = d3.scaleLinear().range([height, 0]);

  var yAxisLeft = d3.axisLeft(y0).ticks(5);
  var yAxisRight = d3.axisRight(y1).ticks(5);

  var svg = d3.select(divName)
    .append("svg")
    .attr('class', function(){
        if(isPulse)
        return "linechart";
        else
        return "linechartPulse";
    })
    .attr("width", width + margin.left + margin.right + g_sgLegendWidth)
    .attr("height", height + margin.bottom + margin.top)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

  // Get the data
  gPatientVisitDate = [];
  d3.csv(csvName, function (_error, data) {
    data.forEach(function (d) {
      d.date = (d.date);
      if (gPatientVisitDate.indexOf(d.date) == -1)
        gPatientVisitDate.push(d.date);
      d.visit = +d.visit;
      if (d.v0 == "x") {
        d.v0 = NaN;
        d.v1 = +d.v1;
      }
      else if(d.v1 == "x")
      {
        d.v1 = NaN;
        d.v0 = +d.v0;
      }
      else {
        d.v0 = +d.v0;
        d.v1 = +d.v1;
      }
      d.sbp = +d.SBP;
      d.dbp = +d.DBP;
    });

    var vl1data = data;
    // var valueline = d3.line()
    //   .x(function (d) { return x(d.visit); })
    //   .y(function (d,i) {
    //     if (d.v0 >= 0)
    //       return y0(d.v0);
    //     else
    //       return y0(vl1data[i-1].v0);
    //   });

    var line = [];
    var line2 = [];
    if(!isPulse){
      line = d3.line().defined(d => !isNaN(d.v0))
      .x(d => x(d.visit))
      .y(d => y0(d.v0));

      line2 = d3.line().defined(d => !isNaN(d.v1))
      .x(d => x(d.visit))
      .y(d => y1(d.v1));
    }
    else{
      line = d3.line().defined(d => !isNaN(d.sbp))
      .x(d => x(d.visit))
      .y(d => y0(d.sbp));

      line2 = d3.line().defined(d => !isNaN(d.dbp))
      .x(d => x(d.visit))
      .y(d => y0(d.dbp));
    }

    // Scale the range of the data
    // x.domain(d3.extent(data, function (d) { return d.date; }));
    x.domain(d3.extent(data, function (d) { return d.visit; }));

    if(!isPulse){
      y0.domain([0, d3.max(data, function (d) {
        return Math.max(d.v0);
      })]);
      y1.domain([0, d3.max(data, function (d) {
        return Math.max(d.v1);
      })]);
    }else{

      y0.domain([0, d3.max(data, function (d) {
        return Math.max(d.sbp, d.dbp);
      })]);
    }

    var xAxis = d3.axisBottom(x)
    // .ticks(function(_d,_i){
    //   console.log(data.length);
    //   return data.length;})
    .tickFormat(function(_d, i){
      var date = data[i].date;
      // console.log(date);
      return date;
    });

    if (data.length >= 30)
      xAxis.ticks(30);
    else if (data.length >= 20)
      xAxis.ticks(20);
    else if (data.length >= 10)
      xAxis.ticks(10);
    else
      xAxis.ticks(5);
    // svg.append("path")        // Add the valueline path.
    //   .attr("d", valueline(data))
    //   .attr("stroke", "steelblue")
    //   .style("stroke-width", 2)
    //   .style("fill", "none");
    // draw line1 with missing data
    svg.append("path")
      .datum(data.filter(line.defined()))
      .attr("stroke", "#ccc")
      .attr("d", line)
      .style("fill", "none");

    svg.append("path")
      .datum(data)
      // .attr("stroke", "steelblue")
      .attr("stroke", function(){
        if (isPulse)
          return "#67a9cf";
        else
          return "steelblue";
      })
      .attr("stroke-width", 2.5)
      .attr("d", line)
      .style("fill", "none");
    // draw line 2 with missing data
    svg.append("path")
      .datum(data.filter(line2.defined()))
      .attr("stroke", "#ccc")
      .attr("d", line2)
      .style("fill", "none");

    svg.append("path")
      .datum(data)
      // .attr("stroke", "#FFB018")
      .attr("stroke", function(){
        if (isPulse)
          return "#ef8a62";
        else
          return "#FFB018";
      })
      .attr("stroke-width", 2.5)
      .attr("d", line2)
      .style("fill", "none");

    // svg.append("path")        // Add the valueline2 path.
    //   .style("stroke", "red")
    //   .style("stroke-width", 2)
    //   .attr("d", valueline2(data))
    //   .style("fill", "none");

    var circleNode = svg.selectAll("line-circle")
      .data(data)
      .enter();

    if(!isPulse) // for test results
    {
      circleNode.append("circle")
      .attr("class", "data-circle")
      .attr("r", 5)
      .attr("cx", function (d) { return x(d.visit); })
      .attr("cy", function (d) {
        if (d.v0 >= 0)
          return y0(d.v0);
        else
          return 0;
      })
      .style("fill", function (d) {
        if (d.v0 >= 0)
          return "steelblue";
        else
          return "none";
      });

    circleNode.append("circle")
      .attr("class", "data-circle")
      .attr("r", 5)
      .style("fill", function (d) {
        if (!isNaN(d.v1))
          return "#FFB018";
        else
          return "none";
      })
      .attr("cx", function (d) { return x(d.visit); })
      .attr("cy", function (d) { return y1(d.v1); })
    }
    else{ // for pulse
      circleNode.append("circle")
        .attr("class", "data-circle")
        .attr("r", 5)
        .attr("cx", function (d) { return x(d.visit); })
        .attr("cy", function (d) {
          if (d.sbp >= 0)
            return y0(d.sbp);
          else
            return 0;
        })
        .style("fill", function (d) {
          if (d.sbp >= 0)
            return "#67a9cf";
          else
            return "none";
        });

      circleNode.append("circle")
        .attr("class", "data-circle")
        .attr("r", 5)
        .style("fill", function (d) {
          if (!isNaN(d.dbp))
            return "#ef8a62";
          else
            return "none";
        })
        .attr("cx", function (d) { return x(d.visit); })
        .attr("cy", function (d) { return y0(d.dbp); })
    }

    svg.append("g")            // Add the X Axis
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .style("fill", "none")
      .call(xAxis)
      .selectAll("text")
      .attr("y", 8)
      .attr("x", -20)
      .attr("dy", ".7em")
      .attr("transform", "rotate(15)")
      .style("text-anchor", "start");

    ////
    // svg.append("text")
    //   .attr("transform",
    //     "translate(" + (width / 2) + " ," +
    //     (height + margin.top + 10) + ")")
    //   .style("text-anchor", "middle")
    //   .text("就诊日期");
    ////
    svg.append("g")
      .attr("class", "y axis")
      .style("stroke", "steelblue")
      .style("fill", "none")
      .call(yAxisLeft);
    ////
    if(!isPulse)
    {
      svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (0.7 * height ))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text(function(){
       if(gPatient == 0)
        return "蛋白尿g/L";
       else
        return "蛋白尿mg/24h";
      });
      /////

      if(gPatient != 0){
        svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + width + " ,0)")
        .style("fill", "none")
        .style("stroke", "#FFB018")
        .call(yAxisRight);

       svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.left + 1300)
        .attr("x", 0 - (0.7 * height))
        .attr("dy", "0.5em")
        .style("font-size", "12px")
        .style("text-anchor", "middle")
        .text("血肌酐 umol/L");
      }
    }
    else
    {
      svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (0.7 * height ))
      .attr("dy", "1em")
      .style("font-size", "12px")
      .style("text-anchor", "middle")
      .text("血压 mmHg");
    }



    // svg.append("g").selectAll("expLabels")
    // .data(gExpertMedClass)
    // .enter()
    // .append("text")
    // .attr("x", width+12)
    // .attr("y", function (d, i) { return  i * 25; }) // 100 is where the first dot appears. 25 is the distance between dots
    // // .style("fill", function (d,i) { return gDefaultColRange(i); })
    // .text(function (d) { return d })
    // .attr("text-anchor", "left")
    // .style("alignment-baseline", "middle")


  });
}

// Draw scatterplots
function drawSConDiv(data, scSvgName, divName, scwidth, scheight) {
  var legendWidth = 40;
  var margin = { top: 5, right: 40, bottom: 5, left: 40 };
  var scSvg = d3.select(divName)
    .append("svg")
    .attr('class', scSvgName)
    .attr('id', scSvgName)
    .attr("width", scwidth + margin.left + margin.right + legendWidth)
    .attr("height", scheight + margin.top + margin.bottom)
    .append("g")
    .attr('class', function(){
      var canv = scSvgName+"_canvas";
      return canv;
    })
    .attr("transform", function(){
      if (scSvgName != "scSymp")
        return "translate(" + margin.left + "," + margin.top + ")";
      else
        return "translate(15,"+margin.top+")";
      });

  var x = d3.scaleLinear()
    // .range([0, scwidth - legendWidth]);
    .range([0, scwidth]);

  var y = d3.scaleLinear()
    .range([scheight, 0]);
  var xAxis = d3.axisBottom(x).ticks(0).tickSize(0);
  var xAxis2 = d3.axisTop(x).ticks(0).tickSize(0);

  var yAxis = d3.axisLeft(y).ticks(0).tickSize(0);
  var yAxis2 = d3.axisRight(y).ticks(0).tickSize(0);


  x.domain(d3.extent(data, function (d) { return d.V0; })).nice();
  y.domain(d3.extent(data, function (d) { return d.V1; })).nice();

  scSvg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + scheight + ")")
    .attr("opacity", 0.1)
    .call(xAxis)
    .append("text")
    .attr("class", "label")
    .attr("x", scwidth)
    .attr("y", 0)
    .style("text-anchor", "end")
    .text("V0");

  scSvg.append("g")
    .attr("class", "x axis")
    .attr("opacity", 0.1)
    .attr("transform", "translate(0, 0)")
    .call(xAxis2);

  scSvg.append("g")
    .attr("class", "y axis")
    .attr("opacity", 0.1)
    .call(yAxis)
    .append("text")
    .attr("class", "label")
    .attr("transform", "rotate(-90)")
    .attr("y", 0)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("V1");

  scSvg.append("g")
    .attr("class", "y axis")
    .attr("opacity", 0.1)
    .attr("transform", "translate(" + (scwidth) + ",0)")
    .call(yAxis2);


  var node = scSvg.selectAll(".dot")
    .data(data)
    .enter()
    .append("g");

  node.append("circle")
    .attr("class", "dot")
    .attr("r", 15.5)
    .attr("cx", function (d) { return x(d.V0); })
    .attr("cy", function (d) { return y(d.V1); })
    .style("fill", function (d) {
      return defaultColoring(d);
    })
    .attr("opacity", 0.1);

  // interactive lens
  scSvg.selectAll(".lens").remove();
  scSvg.on("mouseover", function () {
    mousex = d3.mouse(this);
    // mousey = mousex[0] + 5;
    scSvg.append("circle")
      .attr("class", "lens")
      .attr("r", 30)
      .attr("opacity", 0.1)
      .attr("cx", function () { return mousex[0]; })
      .attr("cy", function () { return mousex[1]; })
      .style('stroke', '#AAA')
      .style('fill', '#CCC');
  });
  var ww = 14;

  // // With concentric circles
  // node.append("circle")
  // // node.append("rect")
  //     .attr("class","square")
  //     // .attr("width",ww)
  //     // .attr("height",ww)
  //     // .attr("x",function(d){return x(d.V0)- ww/2;})
  //     // .attr("y",function(d){return y(d.V1)-ww/2;})
  //     .attr("r",10)
  //     .attr("cx", function (d) { return x(d.V0); })
  //     .attr("cy", function (d) { return y(d.V1); })
  //     .style("fill", function(d){
  //       return expColoring(d);
  //     })

  // With inner rectangle
  node.append("rect")
    .attr("class", "square")
    .attr("width", ww)
    .attr("height", ww)
    .attr("x", function (d) { return x(d.V0) - ww / 2; })
    .attr("y", function (d) { return y(d.V1) - ww / 2; })
    .style("fill", function (d) {
      return expColoring(d);
    })

  // draw text of medicine
  node.append("text")
    .attr("class","dotLabel")
    .text(function (d) { return d.name; })
    .style("font-size", "12px")
    .attr("x", function (d) { return x(d.V0) - 30; })
    .attr("y", function (d) { return y(d.V1) - 10; });



  if (scSvgName == "scSymp") {
    // just record once
    gPoints = data.map(function (d, i) {
      var obj = {};
      // obj.x = x(d.symp1);
      // obj.y = y(d.symp2);
      obj.x = x(d.V0);
      obj.y = y(d.V1);
      obj.r = 5;
      obj.id = i;
      obj.pinyin = d.Pinyin;
      obj.name = d.Name;
      obj.brushedId = -1; // not selected by any brush
      return obj;
    });

    // Draw legends
    scSvg.append("g").selectAll("expLabelsRect")
      .data(gExpertMedClass)
      .enter()
      .append("rect")
      .attr("width", ww)
      .attr("height", ww)
      .attr("x", scwidth + 20)
      .attr("y", function (_d, i) { return 20 + i * 25 - ww / 2; })
      .style("fill", function (d, _i) {
        return gExpColRange(d);
      })

    scSvg.append("g").selectAll("expLabels")
      .data(gExpertMedClass)
      .enter()
      .append("text")
      .style("font-size", "12px")
      .attr("x", scwidth+35)
      .attr("y", function (_d, i) { return 20 + i * 25; }) // 100 is where the first dot appears. 25 is the distance between dots
      // .style("fill", function (d,i) { return gDefaultColRange(i); })
      .text(function (d) {
          var newStr = d.replace(/ *\（[^)]*\） */g, "");
           return newStr;
      })
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle")

    scSvg.append("g").selectAll("defaultDots")
      .data(gDefaultMedClass)
      .enter()
      .append("circle")
      .attr("cx", scwidth+ 20 )
      .attr("cy", function (_d, i) { return 320 + i * 25; }) // 100 is where the first dot appears. 25 is the distance between dots
      .attr("r", 7)
      .style("fill", function (d, _i) {
        return gDefaultColRange(d);
      })

    scSvg.append("g").selectAll("defaultLabels")
      .data(gDefaultMedClass)
      .enter()
      .append("text")
      .style("font-size", "12px")
      .attr("x", scwidth+35)
      .attr("y", function (_d, i) { return 320 + i * 25; }) // 100 is where the first dot appears. 25 is the distance between dots
      // .style("fill", function (d,i) { return gDefaultColRange(i); })
      .text(function (d) {
        var newStr = d.replace(/ *\（[^)]*\） */g, "");
        return newStr;
      })
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle")

  }


  var scatterplot = {};
  scatterplot.svg = scSvg;
  scatterplot.xXform = x;
  scatterplot.yXform = y;

  return scatterplot;
}

//streamgraph
function streamChart(csvpath, color, divName, sgWidth, sgHeight) {
  var datearray = [];
  var colorrange = [];


  var keys = [];

  if (color == "blue") {
    // colorrange = ["#045A8D", "#2B8CBE", "#74A9CF", "#A6BDDB", "#D0D1E6", "#F1EEF6"];
    colorrange = ["#A6BDDB", "#D0D1E6", "#F1EEF6"];
  }
  else if (color == "pink") {
    colorrange = ["#980043", "#DD1C77", "#DF65B0", "#C994C7", "#D4B9DA", "#F1EEF6"];
  }
  else if (color == "orange") {
    colorrange = ["#B30000", "#E34A33", "#FC8D59", "#FDBB84", "#FDD49E", "#FEF0D9"];
  }
  else if (color == "gray") {
    // colorrange = ["#252525", "#525252","#737373","#969696","#bdbdbd","#d9d9d9","#f0f0f0"];
    colorrange = ["#bdbdbd", "#d9d9d9", "#f0f0f0"];
  }

  strokecolor = colorrange[0];

  // var format = d3.time.format("%m/%d/%y");
  // var format = d3.time.format("%Y/%m/%d");
  var format = d3.timeFormat("%M %d %Y");
  var parseDate = d3.timeParse("%M %d %Y");

  var margin = { top: 20, right: 40, bottom: 30, left: 50 };
  var width = sgWidth - margin.left - margin.right;
  var height = sgHeight - margin.top - margin.bottom;

  var tooltip = d3.select("body")
    .append("div")
    .attr("class", "remove")
    .style("position", "absolute")
    .style("z-index", "20")
    .style("visibility", "hidden")
    .style("top", "30px")
    .style("left", "55px");

  var x = d3.scaleLinear()
    .range([0, width]);

  var y = d3.scaleLinear()
    .range([height - 10, 0]);

  var z = d3.scaleOrdinal()
    .range(colorrange);
  var xAxis = d3.axisBottom(x);
 
  // .ticks(20);
  // .ticks(function(d){return d.visit;});

  var yAxis = d3.axisLeft(y)
    .scale(y).ticks(0);

  var yAxisr = d3.axisRight(y)
    .scale(y).ticks(0);

  var nest = d3.nest()
    .key(function (d) { return d.key; });

  var area = d3.area()
    .x(function (d) { return x(d.data.visit); })
    .y0(function (d) { return y(d.y0); })
    .y1(function (d) { return y(d.y0 + d.y); });

  var svg = d3
    .select(divName)
    .append("svg")
    .attr("width", width + margin.left + margin.right + g_sgLegendWidth)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

  var graph = d3.csv(csvpath, function (data) {
    var maxTimeSteps = -1;
    var allDates = [];
    var totalVisits = 0;
    data.forEach(function (d, _i) {
      // we have to sort the datum by class here

      d.date = parseDate(d.date);
      d.value = +d.value;
      d.visit = +d.visit;

      totalVisits = Math.max(d.visit, totalVisits);
    });
    // transform data to a matrix (rows: date, columns: keys)

    // List of groups = header of the csv files
    var keys = data.columns.slice(1);
    keys.sort(function (a, b) {
      a; b;
      var i_a = -1;
      var i_b = -1;
      //a and b are medicine names
      for (var i = 0; i < gMedProperties.length; i++) {
        if (a === gMedProperties[i].name)
          i_a = i;
        if (b === gMedProperties[i].name)
          i_b = i;
        if (i_a >= 0 && i_b >= 0)
          break;
      }
      return i_a - i_b;
    });
    // console.log(keys);
    // var dataByClass = data.map(function(d){
    //   d.sort(function(a,b){
    //     // get name of a and b
    //     for(var k = 0; k < keys.length; k++)
    //     {
    //       if(a[keys[k]])
    //     }

    //   }
    // });
    var classKeys = gExpertMedClass;
    // Group by classification
    // keys = classKeys;

    gStreamGraphKeys = keys;
    var stackGen = d3.stack()
      .keys(keys)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetSilhouette)
      // .offset(d3.stackOffsetWiggle)
      ;
    // .value(function(d) { return d.values; })
    var layers = stackGen(data);
    gStreamGraphLayers = layers;
    // var layers = stack.keys(keys)(dataForStack);

    // TODO: need to fix the y range
    //   x.domain(d3.extent(data, function(d) { return d.date; }));
    x.domain(d3.extent(data, function (d) { return d.visit; }));
    y.domain([-120, 140]);

    var layernode = svg.selectAll(".layer")
      .data(layers)
      .enter();

    // find the thickest region of each layer
    var maxYloc = [];
    for(var l = 0; l < layers.length; l++)
    {
      var thisLayer = layers[l];
      var loc = {x:[], h:-Infinity, y0:[], y1:[]};
      var hlist =[];

      for(var t = 0; t < thisLayer.length; t++)
      {
          var hh = Math.abs(thisLayer[t][1]-thisLayer[t][0]);
          hlist.push(hh);
          if(hh >= loc.h)
          {
            loc.h = hh;

          }
      }

      // Find x pos that has equal height of loc.h
      for(var t = 0; t < thisLayer.length; t++)
      {
        if(hlist[t] >= loc.h)
        {
          loc.x.push(t);
          loc.y0.push(thisLayer[t][0]);
          loc.y1.push(thisLayer[t][1]);
        }
      }
      loc.hStd = math.std(hlist);
      loc.hMed = math.median(hlist);
      loc.key = thisLayer.key;
      maxYloc.push(loc);
    }

    var layerTextCol = [];
    layernode.append("path")
      .attr("class", "layer")
      .attr("d", d3.area()
        .curve(d3.curveBasis)
        .x(function (d, _i) { return x(d.data.visit); })
        .y0(function (d,_i) {
          return y(d[0]); })
        .y1(function (d,_i) {
          return y(d[1]); })
      )
      .style("fill", function (d, _i) {
        var medClass = -1;
        for (var ii = 0; ii < gMedProperties.length; ii++) {
          if (d.key == gMedProperties[ii].name) {
            // Search the name of medicine classification in the major classification list
            for (var j = 0; j < gExpertMedClass.length; j++) {
              if (gMedProperties[ii].classExp.search(gExpertMedClass[j]) >= 0) {
                medClass = j;
                break;
              }
            }
          }

          if (medClass >= 0)
            break;
        }
        if (medClass < 0)
          return "blue";
        else
        {
          // return gDefaultColRange(medClass);
          var color = gExpColRange(gExpertMedClass[medClass]);
          var labC = d3.lab(color);
          if(labC.l > 50)
            layerTextCol.push("black");
          else
            layerTextCol.push("white");
          return color;

        }
        // expColoring(d);
      });
    ;

    var textLoc = [];
    var delta = 1;
    for(var ii = 0; ii < maxYloc.length; ii++)
    {
       var randX = 0;
       var locInfo = maxYloc[ii];
      var xBest = 0;
      var yBest = 0;
      if(locInfo.hMed + delta < locInfo.h)
      {
        var randInd = Math.round(math.random(0, locInfo.x.length-1));
        var randMaxX = locInfo.x[randInd];
        xBest = x(randMaxX) + math.random(0,5);
        yBest = 0.5 * (y(locInfo.y0[randInd]) + y(locInfo.y1[randInd]));// + math.random(0,5);
      }
      else
      {
        randX = Math.random() * (width - 20);
        xBest = randX;
        var rvisit = randX / (width - 1) * totalVisits;
        yBest = 0.5 * (y(layers[ii][Math.round(rvisit)][0]) + y(layers[ii][Math.round(rvisit)][1])) ;
        // return randX;
      }
      textLoc.push({x: xBest, y: yBest});
    }

    // Draw text!
    var textnode = svg.selectAll("text").data(textLoc)
      .enter()
      .append("text")
      .text(function (_d,i) { return layers[i].key; })
      .style("font-size", "11px")
      .style("fill",function(_d,i){return layerTextCol[i];})
      .attr("x", function (d) {
        return d.x;
        // randX = Math.random() * (width - 20);//(totalVisits-1));
        // return randX; //x(randVisit);
        // if(d.h > maxYloc.mean + maxYloc.std)


        // else
        //   randX = Math.random()
      })
      // .attr("y", function (d) { return 0.5 * (y(d[0])+y(d[1])); });
      .attr("y", function (d, _i) {
        return d.y;

      });

    var ww = 14;
      svg.append("g").selectAll("expLabelsRect")
      .data(gExpertMedClass)
      .enter()
      .append("rect")
      .attr("width", ww)
      .attr("height", ww)
      .attr("x", width + margin.left-5 )
      .attr("y", function (_d, i) { return 20 + i * 25 - ww / 2; })
      .style("fill", function (d, _i) {
        return gExpColRange(d);
      })

      svg.append("g").selectAll("expLabels")
      .data(gExpertMedClass)
      .enter()
      .append("text")
      .attr("x", width + margin.left + 12)
      .attr("y", function (_d, i) { return 20 + i * 25; }) // 100 is where the first dot appears. 25 is the distance between dots
      // .style("fill", function (d,i) { return gDefaultColRange(i); })
      .text(function (d) {
          var newStr = d.replace(/ *\（[^)]*\） */g, "");
           return newStr;
      })
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle")

    if (gPatientVisitDate.length >= 30)
      xAxis.ticks(30);
    else if (gPatientVisitDate.length >= 20)
      xAxis.ticks(20);
    else if (gPatientVisitDate.length >= 10)
      xAxis.ticks(10);
    else
      xAxis.ticks(5);

    xAxis.tickFormat(function(i){
      if(gPatientVisitDate.length > 0)
      {
        var date = gPatientVisitDate[i];
        // // console.log(date);
        // return i +"\r\n("+date+")";
        return date;

      }
      // return i;
    });
    svg.append("g")
      .attr("class", "x axis")
      //  .attr("transform", "translate(0," + height + ")")
       .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .selectAll("text")
      .attr("y", 8)
      .attr("x", -20)
      .attr("dy", ".7em")
      .attr("transform", "rotate(15)")
      .style("text-anchor", "start");;

    svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + width + ", 0)")
      .call(yAxisr);

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);

    svg.selectAll(".layer")
      .attr("opacity", 1)
      .on("mouseover", function (_d, i) {
        svg.selectAll(".layer").transition()
          .duration(250)
          .attr("opacity", function (_d, j) {
            return j != i ? 0.4 : 1;
          })
      })
      .on("mousemove", function (d, _i) {
        mousex = d3.mouse(this);
        mousex = mousex[0];
        var invertedx = Math.round(x.invert(mousex));
        // invertedx = invertedx.getMonth() + invertedx.getDate();
        var selected = (d[invertedx].data);
        // set global variable to update other views

        //   console.log(selected);
        // for (var k = 0; k < selected.length; k++) {
        //   datearray[k] = selected[k].visit
        //   // datearray[k] = datearray[k].getMonth() + datearray[k].getDate();
        // }
        mousedate = selected.visit;
        // mousedate = datearray.indexOf(invertedx);
        pro = selected[d.key];//d.data[mousedate].value;
        gStreamGraphSelected = d.key;
        d3.select(this)
          .classed("hover", true)
          .attr("stroke", strokecolor)
          .attr("stroke-width", "0.5px"),
          tooltip.html("<p>" + d.key + "<br>" + pro + "</p>").style("visibility", "visible");
        if(d.key != null)
          redrawAll();

      })
      .on("mouseout", function (d, _i) {
        svg.selectAll(".layer")
          .transition()
          .duration(250)
          .attr("opacity", "1");

        d3.select(this)
          .classed("hover", false)
          .attr("stroke-width", "0px"), tooltip.html("<p>" + d.key + "<br>" + pro + "</p>").style("visibility", "hidden");
        if( gStreamGraphSelected != null )
        {
          gStreamGraphSelected = null;
          redrawAll();
        }
      })

    // // The vertical slice line
    // var vertical = d3.select(divName)
    //   .append("div")
    //   .attr("class", "remove")
    //   .style("position", "absolute")
    //   .style("z-index", "19")
    //   .style("width", "1px")
    //   .style("height", "380px")
    //   .style("top", "10px")
    //   .style("bottom", "30px")
    //   .style("left", "0px")
    //   .style("background", "#fff");

    // d3.select(divName)
    //   .on("mousemove", function () {
    //     mousex = d3.mouse(this);
    //     mousex = mousex[0] + 5;
    //     vertical.style("left", mousex + "px")
    //   })
    //   .on("mouseover", function () {
    //     mousex = d3.mouse(this);
    //     mousex = mousex[0] + 5;
    //     vertical.style("left", mousex + "px")
    //   });

    redrawAll();
  });
}

function drawStreamGraph(csvPath, divName, sgwidth, sgheight) {
  streamChart(csvPath, 'blue', divName, sgwidth, sgheight);
}

function drawTable() {
  var tableFname = "Result-MedicalTable.csv";
  d3.csv(tableFname, function (error, data) {
    if (error) throw error;

    var sortAscending = true;
    var table = d3.select('#page-wrap').append('table');


    var dimensions = {};
    dimensions.width = 500;
    dimensions.height = 1200;
    var width = dimensions.width + "px";
    var height = dimensions.height + "px";
    var twidth = (dimensions.width - 25) + "px";
    var divHeight = (dimensions.height - 60) + "px";
    var inner = table.append("tr").append("td")
      .append("div").attr("class", "scroll").attr("width", width).attr("style", "height:" + divHeight + ";")
      .append("table").attr("class", "bodyTable").attr("border", 1).attr("width", twidth).attr("height", height).attr("style", "table-layout:fixed");

    var titles = d3.keys(data[0]);
    gMedProperties = data;

    var dataByCategory = d3.nest()
      .key(function (d) { return d.class })
      .entries(data);

    var dataByExpCategory = d3.nest()
      .key(function (d) { return d.classExp; })
      .entries(data);

    if(gDefaultMedClass==[])
    {
      for (var k = 0; k < dataByCategory.length; k++) {
        gDefaultMedClass.push(dataByCategory[k].key);
      }
       var textbookOrder = [1, 3, 9, 0, 2, 7, 6, 10, 5, 4, 8];
       var tmpNameList1 = [];
       for(var i = 0 ; i < textbookOrder.length; i++)
         tmpNameList1.push(gDefaultMedClass[textbookOrder[i]]);
       gDefaultMedClass = tmpNameList1;
      // sort by name
      // gDefaultMedClass.sort(function (a, b) { return d3.ascending(a, b); });
       //sort med property by class order

    }

    for (var k = 0; k < dataByExpCategory.length; k++) {
      gExpertMedClass.push(dataByExpCategory[k].key);
    }
    // // sort by name
    // gExpertMedClass.sort(function (a, b) { return d3.ascending(a, b); });
    var expOrder =  [1,3,7,0,2,5,6,4];
    var tmpNameList = [];
    for(var i = 0 ; i < expOrder.length; i++)
      tmpNameList.push(gExpertMedClass[expOrder[i]]);
     gExpertMedClass = tmpNameList;

    if (gDefaultMedClass.length < 15)
      gDefaultMedMajorClass = gDefaultMedClass;

    //sort med property by class order
    gMedProperties.sort(function (a, b) { return d3.ascending(a.expClass, b.expClass); });
    console.log(gMedProperties);

    var headers = inner.append('thead').append('tr')
      .selectAll('th')
      .data(titles).enter()
      .append('th')
      .text(function (d) {
        return d;
      });


    // var rows = table.append('tbody').selectAll('tr')
    var rows = inner.append('tbody').selectAll('tr')
      .data(data).enter()
      .append('tr');
    rows.selectAll('td')
      .data(function (d) {
        return titles.map(function (k) {
          return { 'value': d[k], 'name': k };
        });
      }).enter()
      .append('td')
      .attr('data-th', function (d) {
        return d.name;
      })
      .text(function (d) {
        return d.value;
      });
  });
}

function convertPatientRxData(csvpath) {
  var graph = d3.csv(csvpath, function (data) {
    var maxTimeSteps = -1;
    var allDates = [];
    var parseDate = d3.timeParse("%Y年%M月%Y日");
    var nest = d3.nest()
      .key(function (d) { return d.key; });
    data.forEach(function (d, _i) {
      d.date = parseDate(d.date);
      d.value = +d.value;
      d.visit = +d.visit;
    });
    // 0. generate original nest data！
    var dataByKey = nest.entries(data);
    var dataByVisit = d3.nest()
      .key(function (d) { return d.visit; })
      .entries(data);

    // 1. Fix data to have values of all keys at all time steps
    var fulldataByKey = dataByKey;
    var fixedData = [];
    // Fill empty dates for each medicine
    for (var i = 0; i < dataByKey.length; i++) {
      for (var k = 0; k < dataByVisit.length; k++) // all dates
      {
        var dateFound = false;
        for (var j = 0; j < dataByKey[i].values.length; j++) // appearances of the medicine
        {
          if (dataByKey[i].values[j].visit == dataByVisit[k].key) {
            fulldataByKey[i].values.push({ key: dataByKey[i].key, value: dataByKey[i].values[j].value, visit: +dataByVisit[k].key, date: dataByKey[i].values[j].date });
            fixedData.push({ key: dataByKey[i].key, value: dataByKey[i].values[j].value, visit: +dataByVisit[k].key, date: dataByKey[i].values[j].date });
            dateFound = true;
            break;
          }
        }

        if (!dateFound) {
          fulldataByKey[i].values.push({ key: dataByKey[i].key, value: 0, visit: +dataByVisit[k].key, date: dataByVisit[k].values[0].date });
          fixedData.push({ key: dataByKey[i].key, value: 0, visit: +dataByVisit[k].key, date: dataByVisit[k].values[0].date });
        }

      }
    }
    // 2. Regenerate nest data!
    dataByKey = fulldataByKey;//nest.entries(data);
    dataByVisit = d3.nest()
      .key(function (d) { return d.visit; })
      .entries(fixedData);
    // 3. Transform data to a matrix (rows: date, columns: keys)
    //Create empty data structures
    var matrix0 = [];
    for (var t = -1; t < dataByVisit.length; t++)
    // for(var t = 0; t < dataByVisit.length; t++)
    {
      var vectorMed = [];
      if (t == -1)
        vectorMed.push("visit");
      for (var m = -1; m < dataByKey.length; m++) {

        if (t == -1) {
          if (m >= 0)
            vectorMed.push(dataByKey[m].key);
        }
        else {
          if (m == -1)
            vectorMed.push(t);
          else
            vectorMed.push(dataByVisit[t].values[m].value);

        }
      }
      matrix0.push(vectorMed);
    }
    console.log(matrix0);

    exportToCsv("medByVisitP3.csv", matrix0);

  });
}

function preprocessAllRx() {

  var parseDate = d3.timeParse("%M %d %Y");
  for (var i = 0; i < gRxFilenameList.length; i++) {
    var csvpath = gRxFilenameList[i];
    d3.csv(csvpath, function (data) {
      var maxTimeSteps = -1;
      var allDates = [];
      var totalVisits = 0;
      data.forEach(function (d, _i) {
        // we have to sort the datum by class here

        d.date = parseDate(d.date);
        d.value = +d.value;
        d.visit = +d.visit;
        totalVisits = Math.max(d.visit, totalVisits);
      });
      // transform data to a matrix (rows: date, columns: keys)

      // List of groups = header of the csv files
      var keys = data.columns.slice(1);
      keys.sort(function (a, b) {
        a; b;
        var i_a = -1;
        var i_b = -1;
        //a and b are medicine names
        for (var i = 0; i < gMedProperties.length; i++) {
          if (a === gMedProperties[i].name)
            i_a = i;
          if (b === gMedProperties[i].name)
            i_b = i;
          if (i_a >= 0 && i_b >= 0)
            break;
        }
        return i_a - i_b;
      });

      gRxAllPatientsKeys.push(keys);
    });
  }


}

function tcmExpColorMap() {
  var accentScheme = ["#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0", "#f0027f", "#bf5b17", "#666666"];
  var cat10Scheme = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];
  // The paired scheme
  var pairedScheme = ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928"];
  var tableau10Scheme = ["#4e79a7", "#f28e2c", "#e15759", "#76b7b2", "#59a14f", "#edc949", "#af7aa1", "#ff9da7", "#9c755f", "#bab0ab"];
  var set3Scheme = ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f"];
  // Medicine class colormap
  // 凉血止血——红系（冷色调）
  // 安神——粉红（一般入心，赤）
  // 补肾——黑色
  // 补脾——黄色（正色）

  // 泄浊毒类——褐色
  // 活血——红色（非正色）
  // 清热——绿色系列（非正色）
  // 祛湿——蓝色系列（非正色）


  // 祛风止痒、解表类——白色系（这两类药物辛散的特性，入肺，白）
  // 降蛋白——紫色可以
  // 收敛药——绿色系（酸入肝，青）
  // 消食类——黄色系列（一般入脾胃，黄）
  // 理气类——绿色系（青）
  var className = ["凉血止血类", "安神类", "泄浊毒类", "活血类", "清热类（利湿/解毒）", "祛风止痒类", "补肾类（降蛋白尿）", "补脾益气类"];
  var classCol = ["#ff7f00", "#fb9a99", "#b15928", "#e15759", "#b2df8a", "#d9d9d9", "#6a3d9a", "#fdbf6f"];
  var order = [1,3,7,0,2,5,6,4];
  var classNameOrdered = [];
  var classColOrdered = [];
  for(var i = 0; i < order.length; i++)
  {
    classNameOrdered[i] = className[order[i]];
    classColOrdered[i] = classCol[order[i]];
  }
  var colorMap = d3.scaleOrdinal()
    // .domain(["凉血止血", "安神类", "泄浊毒类", "活血类", "清热类（利湿/解毒）", "祛风止痒类", "补肾类（降蛋白尿）", "补脾益气类", "降蛋白尿"])
    // .range(["#ff7f00", "#fb9a99", "#b15928", "#e15759", "#b2df8a", "#d9d9d9", "#6a3d9a", "#fdbf6f", "#cab2d6"]);
    .domain(classNameOrdered)
    .range(classColOrdered);

  return colorMap;
}

function tcmDefaultColorMap() {
  var accentScheme = ["#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0", "#f0027f", "#bf5b17", "#666666"];
  var cat10Scheme = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];
  // The paired scheme
  var pairedScheme = ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928"];
  var tableau10Scheme = ["#4e79a7", "#f28e2c", "#e15759", "#76b7b2", "#59a14f", "#edc949", "#af7aa1", "#ff9da7", "#9c755f", "#bab0ab"];
  var set3Scheme = ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f"];
  // Medicine class colormap
  // 凉血止血——红系（冷色调）
  // 安神——粉红（一般入心，赤）
  // 补肾——黑色
  // 补脾——黄色（正色）

  // 泄浊毒类——褐色
  // 活血——红色（非正色）
  // 清热——绿色系列（非正色）
  // 祛湿——蓝色系列（非正色）
  var className = ["止血药", "养心安神药", "泻下药", "活血祛瘀药", "清热类（清热解毒/清热利湿/清热凉血/清热通淋/清热燥湿/清热泻火）",
    "补虚药（补气/养血/助阳/滋阴/祛风湿）", "祛湿类（化湿/利水渗湿）", "解表药", "收敛药", "消食药", "理气药"];
  var classCol = ["#ff7f00", "#fb9a99", "#b15928", "#e15759", "#b2df8a",
    "#6a3d9a", "#a6cee3", "#d9d9d9", "#8dd3c7", "#FFB018", "#1f77b4"];
  var order = [1, 3, 9, 0, 2, 7, 6, 10, 5, 4, 8];
  var classNameOrdered = [];
  var classColOrdered = [];
  for(var i = 0; i < order.length; i++)
  {
    classNameOrdered.push(className[order[i]]);
    classColOrdered.push(classCol[order[i]]);
  }

  // 祛风止痒、解表类——白色系（这两类药物辛散的特性，入肺，白）
  // 降蛋白——紫色可以
  // 收敛药——绿色系（酸入肝，青）
  // 消食类——黄色系列（一般入脾胃，黄）
  // 理气类——绿色系（青）
  var colorMap = d3.scaleOrdinal()
    // .domain(["止血药", "养心安神药", "泻下药", "活血祛瘀药", "清热类（清热解毒/清热利湿/清热凉血/清热通淋/清热燥湿/清热泻火）",
    //   "补虚药（补气/养血/助阳/滋阴/祛风湿）", "祛湿类（化湿/利水渗湿）", "解表药", "收敛药", "消食药", "理气药"])
    // .range(["#ff7f00", "#fb9a99", "#b15928", "#e15759", "#b2df8a",
    //   "#6a3d9a", "#a6cee3", "#d9d9d9", "#8dd3c7", "#FFB018", "#1f77b4"]);
    .domain(classNameOrdered)
    .range(classColOrdered);

  if(gDefaultMedClass.length == 0)
    gDefaultMedClass = classNameOrdered;

  return colorMap;
}

// A lens that allows to compare
function magicLens(r, _scSvg) {
  // mouse location
  mousex = d3.mouse(this);
  // draw items within the lens area
  var r2 = r * r;
  // remove old items
  this.selectAll(".magicLensDot").remove();
  var node = this.selectAll(".magicLensDot")
    .data(gPoints)
    .enter()
    .append("g");
  for(var i = 0; i < gPoints.length; i++)
  {
    var dist2 = (gPoints[i].x2 - mousex[0])*(gPoints[i].x2 - mousex[0]) + (gPoints[i].y2-mousex[1])*(gPoints[i].y2-mousex[1]);
    if(dist2 <= r2)
    {
      // draw the item
      node.append("circle")
      .attr("class", "magicLensDot")
      .attr("r", 15.5)
      .attr("cx", function (d) { return d.x2; })
      .attr("cy", function (d) { return d.y2; })
      .style("fill", function (d) {
        // Check all brushed groups
        if (d.brushedId >= 0)
          return gBrushes[d.brushedId].color;
        else
          return defaultColoring(d);
        //  return "#045A8D";
      })
      .attr("opacity", function (d) {
        for (var j = 0; j < gRxAllPatientsKeys[gPatientCompare].length; j++) {
          if (d.name == gRxAllPatientsKeys[gPatientCompare][j])
            return 1;
        }
        return 0.02;
      });
    }
  }
  // draw the lens decoration
  this.append("circle")
    .attr("class", "lens")
    .attr("r", 30)
    .attr("opacity", 0.1)
    .attr("cx", function () { return mousex[0]; })
    .attr("cy", function () { return mousex[1]; })
    .style('stroke', '#AAA')
    .style('fill', '#CCC');

}


// The main function
function tcmVAmain() {
  // 0. convert medical record files when not been done.
  // convertPatientRxData("medicalRecordsP3.csv");

  // ## Load medicine properties and draw a table
  drawTable();
  // If we have a classificiation of medicine
  if (gDefaultMedMajorClass.length > 0) {
    gDefaultColRange = d3.scaleOrdinal(d3.schemePaired);
  }
  gDefaultColRange = tcmDefaultColorMap();
  gExpColRange = tcmExpColorMap();


  // 1.Prepare the scatterplots
  d3.csv("./newdata.csv", function (data) {
    for (var i = 0; i < data.length; i++) {
      var sqwwdatum = {};
      sqwwdatum.V0 = +data[i].sqww1;
      sqwwdatum.V1 = +data[i].sqww2;
      sqwwdatum.name = data[i].Name2;
      sqwwdatum.pinyin = data[i].Pinyin;
      gSqwwData.push(sqwwdatum);
      var sympdatum = {}
      if (data[i].Name == "")
        continue;
      sympdatum.name = data[i].Name;
      sympdatum.pinyin = data[i].Pinyin;
      sympdatum.V0 = +data[i].symp1;
      sympdatum.V1 = +data[i].symp2;


      gSympData.push(sympdatum);
    }
    gScatterSymp = drawSConDiv(gSympData, "scSymp", "#exampleSC", g_scwidth, g_scheight);
    // Add title to the svg
    gScatterSqww = drawSConDiv(gSqwwData, "scCompare", "#exampleSC", g_scwidth, g_scheight);

    gPoints = data.map(function (d, i) {
      var obj = {};
      // obj.x = x(d.symp1);
      // obj.y = y(d.symp2);
      obj.x = gScatterSymp.xXform(+d.symp1);
      obj.y = gScatterSymp.yXform(+d.symp2);
      obj.x2 = gScatterSqww.xXform(+d.sqww1);
      obj.y2 = gScatterSqww.yXform(+d.sqww2);
      obj.r = 5;
      obj.id = i;
      obj.pinyin = d.Pinyin;
      obj.name = d.Name;
      obj.brushedId = -1; // not selected by any brush
      return obj;
    });

    //TODO: Add a button to toggle Brush mode and Lens mode!!!

    // 4. Setup lasso
    // linkedView1 = d3.select("#scSymp");//.select("svg");
    // canvas = d3.select("#scSymp");
    // linkedView2 = d3.select("#scCompare");//.select("svg");
    // lassoFunction(linkedView1);
    // lassoFunctionInstance2(linkedView2);
  });

  // Record medicine in all Rx
  preprocessAllRx();

  // initialize a selection button
  d3.select("#selectButton")
    .selectAll('myOptions')
    .data(gRxFilenameList)
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    .attr("value", function (d) { return d; }) // corresponding value returned by the button


  // initialize a comparison select button
  d3.select("#compareSelectButton")
    .selectAll('compareOptions')
    .data(gRxFilenameList)
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    .attr("value", function (d) { return d; }) // corresponding value returned by the button

  //////////////////////////////////////////////////////////
  // Button behaviors
  //////////////////////////////////////////////////////////
  var interactMode = ['透镜','套索']
  d3.select("#interactModeSelectButton")
  .selectAll('interactModeOptions')
  .data(interactMode)
  .enter()
  .append('option')
  .text(function (d) { return d; }) // text showed in the menu
  .attr("value", function (d) { return d; }) // corresponding value returned by the button
  .property("selected", function(d){ return d === '套索'; });
  // interactMode behavior




  var scMode = ['四气五味', '症状'];
  var defaultOptionName = '症状';
  d3.select("#mainModeSelectButton")
    .selectAll('mainModeOptions')
    .data(scMode)
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    .attr("value", function (d) { return d; }) // corresponding value returned by the button
    .property("selected", function(d){ return d === defaultOptionName; });


  d3.select("#compareModeSelectButton")
    .selectAll('compareModeOptions')
    .data(scMode)
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    .attr("value", function (d) { return d; }) // corresponding value returned by the button
    .property("selected", function(d){ return d === '四气五味'; });

  // draw line charts
  drawLinecharts(gTestFilenameList[gPatient], "#lineCharts", g_sgwidth, 100);
  drawLinecharts(gTestFilenameList[gPatient], "#lineCharts", g_sgwidth, 100, true);

  // draw streamgraph with the patient
  drawStreamGraph(gRxFilenameList[gPatient], "#streamGraph", g_sgwidth, g_sgheight);
  // When the button is changed, run the updateChart function
  d3.select("#selectButton").on("change", function (_d) {
    // recover the option that has been chosen
    var selectedOption = d3.select(this).property("value")
    // run the updateChart function with this selected option
    // 2. Prepare the stream graph
    // gPatient = 2;
    var RxDataName = selectedOption;
    if (RxDataName != gRxFilenameList[gPatient]) {

      for (var i = 0; i < gRxFilenameList.length; i++) {
        if (RxDataName === gRxFilenameList[i]) {
          gPatient = i;
          break;
        }
      }
      // Clear line charts
      d3.select("#lineCharts").selectAll("svg").remove();
      // draw a line chart
      drawLinecharts(gTestFilenameList[gPatient], "#lineCharts", g_sgwidth, 100);
      drawLinecharts(gTestFilenameList[gPatient], "#lineCharts", g_sgwidth, 100, true);


      // Clear stream graph
      d3.select("#streamGraph").selectAll("svg").remove();
      drawStreamGraph(RxDataName, "#streamGraph", g_sgwidth, g_sgheight);

    }
    // update(selectedOption)
  })

  // Compare button changed
  var selectedSCmodeVal = d3.select("#compareModeSelectButton").property("value");
  var scData = [];
  if (selectedSCmodeVal === "症状")
    scData = gSympData;
  else
    scData = gSqwwData;

  d3.select("#compareModeSelectButton").on("change", function (_d) {
    var selectedOption = d3.select(this).property("value")

    if (selectedOption === "症状") {
      scData = gSympData;
    }
    else
      scData = gSqwwData;
    // Clear scatterplot
    d3.select("#scCompare").remove();
    // draw scatter plots

    drawSConDiv(scData, "scCompare", "#exampleSC", g_scwidth, g_scheight);
    redrawAll();
  });

  // Main mode
  d3.select("#mainModeSelectButton").on("change", function (_d) {
    var selectedOption = d3.select(this).property("value")
    var mainscData = [];
    if (selectedOption === "症状") {
      mainscData = gSympData;
    }
    else
    mainscData = gSqwwData;
    // Clear scatterplot
    d3.select("#scSymp").remove();
    d3.select("#scCompare").remove();
    // draw scatter plots

    drawSConDiv(mainscData, "scSymp", "#exampleSC", g_scwidth, g_scheight);
    drawSConDiv(scData, "scCompare", "#exampleSC", g_scwidth, g_scheight);
    redrawAll();
  });

  // When the button is changed, run the updateChart function
  d3.select("#compareSelectButton").on("change", function (_d) {
    var selectedOption = d3.select(this).property("value")
    var RxDataName = selectedOption;
    if (RxDataName != gRxFilenameList[gPatientCompare]) {
      // Clear stream graph
      for (var i = 0; i < gRxFilenameList.length; i++) {
        if (RxDataName === gRxFilenameList[i]) {
          gPatientCompare = i;
          break;
        }
      }
      // Clear scatterplot
      d3.select("#scCompare").remove();
      // draw scatter plots
      drawSConDiv(scData, "scCompare", "#exampleSC", g_scwidth, g_scheight);
      redrawAll();
    }
    // update(selectedOption)
  })
}