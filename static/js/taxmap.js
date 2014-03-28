/* taxmap : https://github.com/lbracken/taxmap
   :license: MIT, see LICENSE for more details.
*/

// Constants
var maxRegionsToShowByName = 5;

var currData;
var selectedPrgm = null;

var onGetDataDownloaded = null;
var geoData = null;

var mapWidth = 800;	
var mapHeight = 600;
var mapOffsetL = 0;
var mapOffsetT = 0;

var mapFilledRegionColor = "#6E9058";
var mapDefaultRegionColor = "#DDD";


// ****************************************************************************
// *                                                                          *
// *  Map Logic                                                               *
// *                                                                          *
// ****************************************************************************

function renderMap() {

	// The code heavily follows D3 examples provided by Mike Bostock.
	//   * http://bl.ocks.org/mbostock/4060606
	//   * http://bl.ocks.org/mbostock/4699541
	//   * http://bl.ocks.org/mbostock/4707858
	//   * http://bl.ocks.org/mbostock/4108203
	
	// If there's no result set, then this function can't execute
	if (!currData) {
		return;
	}

	// Confirm that geoData is available, or register for
	// this function to be called once it's ready. 
	if (!geoData) {
		onGetDataDownloaded = renderMap;
		return;
	}

	// TODO: dynamically get these values based upon view area
	//var mapWidth = 800;	
	//var mapHeight = 600;

	// Define a projection for the map
	var projection = d3.geo.albersUsa()
		.translate([mapWidth/2, mapHeight/2])
		.scale([1000]);

	// Define path generator
	var path = d3.geo.path()
		.projection(projection);

	// Create and attach an SVG element (the map)
	$("#map").empty();
	var map = d3.select("#map")
		.append("svg")
		.attr("width", mapWidth)
		.attr("height", mapHeight);

	if (currData.resolution === "county") {

		// First render counties, then render states so state borders are on
		// top and clear.  Then zoom in to the given state.
		var counties = renderCountyRegions(map, path);
		var states = renderStateRegions(map, path, false);

		// Determine the parent state containing the selected counties. Once
		// found, get the corresponding bounding box from the SVG map.
		$("#mapContainer").show();
		var stateId = parseInt(currData.fips_code.substring(0, 2));
		for (var ctr=0; ctr < geoData.objects.states.geometries.length; ctr++) {
			if (geoData.objects.states.geometries[ctr].id == stateId) {			
				
				var boundingBox = path.bounds(states[0][ctr].__data__);
				zoomToRegion(states, boundingBox, projection, mapWidth, mapHeight);
				zoomToRegion(counties, boundingBox, projection, mapWidth, mapHeight);
				break;
			}
		}

	} else if (currData.resolution === "state") {
		var states = renderStateRegions(map, path, true);
		$("#mapContainer").fadeIn();

	} else if (currData.resolution === "country") {
		var country = renderCountry(map, path);
		$("#mapContainer").fadeIn();
	}	
}



function renderCountyRegions(map, path) {

	// There are a lot of counties in the US.  To improve performance,
	// only render the counties in the state that we'll zoom into.
	var stateFIPS = parseInt(currData.regions[0]._id / 1000) * 1000;
	var c = geoData.objects.counties.geometries;
	var countiesToRender = {
		"type" : "GeometryCollection",
		"geometries" : []
	}; 		
	
	for (var ctr=0; ctr < c.length; ctr++) {
		if (c[ctr].id >= stateFIPS && c[ctr].id < stateFIPS+1000) {
			countiesToRender.geometries.push(c[ctr]);
		}
	}

	return renderRegions(map, path, countiesToRender, "counties", true); 
}


function renderStateRegions(map, path, fillSelectedRegions) {
	// Render all of the US states
	return renderRegions(map, path, geoData.objects.states,	"states", fillSelectedRegions);
}


function renderRegions(map, path, regions, className, fillSelectedRegions) {

	// Renders the given regions, which may be a collection counties or states

	// Add a group ("g") element to the map. Then for each region
	// in the given regions list, render shape path data ("d"). Ensure
	// each path gets styled.
	return map.append("g")
		.attr("class", className)
		.selectAll("path")
			.data(topojson.feature(geoData, regions).features)
		.enter().append("path")
			.attr("d", path)
			.style("fill",   function(region) { return determineRegionFill(region.id, fillSelectedRegions);})
			.on("mouseover", function(region) { return onMouseOverRegion(region.id, map);})
    		.on("mouseout",  function(region) { return onMouseOutRegion(map);})
			.on("mousemove", function(region) { return onMouseMoveRegion(map);});
}

	
function renderCountry(map, path) {
	// Render a map of the US
	return map.append("path")
      .datum(topojson.feature(geoData, geoData.objects.land))
      .attr("d", path)
      .attr("class", "country")
      .style("fill", mapFilledRegionColor)
	  .on("mouseover", function() { return onMouseOverRegion(0, map);})
	  .on("mouseout",  function() { return onMouseOutRegion(map);})
	  .on("mousemove", function() { return onMouseMoveRegion(map);});
}

function onMouseOverRegion(id, map) {
	var region = getRegionFromCurrData(id);
	if (region) {
		$("#mapTooltip").html(createTooltipHTML(region));
		$("#mapTooltip").show();
		mapOffsetL = parseInt(map[0][0].offsetLeft) + 15;
		mapOffsetT = parseInt(map[0][0].offsetTop) + 15;
	}
}


function onMouseOutRegion(map) {
	$("#mapTooltip").hide();
	mapOffsetL = 0;
	mapOffsetT = 0;
}


function onMouseMoveRegion(map) {
	if(mapOffsetL && mapOffsetT) {
		var mouse = d3.mouse(map.node());
		var tooltipTop = parseInt(mouse[1]) + mapOffsetT;
		var tooltipLeft = parseInt(mouse[0]) + mapOffsetL;
		$("#mapTooltip").css({top: tooltipTop, left: tooltipLeft});
	}	
}


function zoomToRegion(regions, b, projection, width, height) {
	// Use translate to zoom into the given bounding box (b)
	regions.transition().duration(2250).attr("transform",
		"translate(" + projection.translate() + ")"
		+ "scale(" + .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height) + ")"
		+ "translate(" + -(b[1][0] + b[0][0]) / 2 + "," + -(b[1][1] + b[0][1]) / 2 + ")");
}


function determineRegionFill(id, fillSelectedRegions) {

	if (!fillSelectedRegions) {
		return "none";
	}

	// If the region is specified in currData, then shade it.
	return isRegionInCurrData(id) ? mapFilledRegionColor : mapDefaultRegionColor;
}

// ****************************************************************************
// *                                                                          *
// *  Summary Logic                                                           *
// *                                                                          *
// ****************************************************************************

function renderSummary() {

	// Lots of string concatination in this function.  Looks like this is
	// the fastet method.  See: http://jsperf.com/string-concatenation/14

	// Create the Summary Header
	var summaryHeader = currData.prgm_name;
	summaryHeader += "<br/> ($";
	summaryHeader += abbreviateNumber(currData.prgm_cost);
	summaryHeader += " / year)";
	$("#summaryHeader").html(summaryHeader);

	// Create the Summary Message
	var summaryMessage = "";
	if (currData.regions.length === 1) {

		if (currData.resolution === "country") {
			summaryMessage += "All federal income taxes paid in the US still couldn't pay for ";
		} else {
			summaryMessage += "The federal income taxes of ";
			summaryMessage += currData.regions[0].name;
			summaryMessage += (currData.resolution === "state") ? "" : " County";
			summaryMessage += " could pay for ";
		}
	} else {
		summaryMessage += "It would take the combined federal income taxes of ";

		var regionsToShowByName = Math.min(maxRegionsToShowByName, currData.regions.length);
		for (var ctr=0; ctr < regionsToShowByName - 1; ctr++) {
			summaryMessage += (ctr > 0) ? ", " : "";
			summaryMessage += getRegionSpan(currData.regions[ctr]);
		}

		summaryMessage += " and ";
		if (currData.regions.length > maxRegionsToShowByName+1) {
			summaryMessage += (currData.regions.length - maxRegionsToShowByName);
			summaryMessage += " other";
			summaryMessage += (currData.resolution === "state") ? " states" : " counties";			
		} else {
			summaryMessage += getRegionSpan(currData.regions[regionsToShowByName-1]);			
			summaryMessage += (currData.resolution === "state") ? "" : " counties";
		}

		summaryMessage += " to pay for ";
	}

	summaryMessage += currData.prgm_name;
	summaryMessage += "."	
	$("#summaryMessage").html(summaryMessage);
	
	$("#showMoreDetails").show();
	$("#summaryContainer").fadeIn();
}


function getRegionSpan(region) {

	var regionSpan = "<span class='regionSpan' title='Taxes Paid: $";
	regionSpan += formatInteger(region.est_taxes);
	regionSpan += "  Population: ";
	regionSpan += formatInteger(region.population);
	regionSpan += "'>";
	regionSpan += region.name;
	regionSpan += "</span>"
	
	return regionSpan;
}


function showMoreDetails() {

	if (!currData) {
		return;
	}

	$("#showMoreDetails").hide();
}

// ****************************************************************************
// *                                                                          *
// *  Project Logic                                                           *
// *                                                                          *
// ****************************************************************************

function updateTaxmap() {

	var zip = $("#zip").val().trim();

	if (!zip || !selectedPrgm) {
		return;
	}

	var prgmCost = selectedPrgm.cost;
	var prgmName = selectedPrgm.name;

	// TODO: Validate this data...

	$("#updateTaxmap").hide();
	$("#updateTaxmapLoading").fadeIn();
	$("#serverErrorMsg").hide();
	$("#mapContainer").hide();
	$("#summaryContainer").hide();

	// Call the server to determine the tax map
	$.getJSON("determine_tax_map",
		{"zip" : zip,
		 "prgm_cost" : prgmCost,
		 "prgm_name" : prgmName},
		onDetermineTaxMapSuccess).fail(
		onDetermineTaxMapFailure);
}


function onDetermineTaxMapSuccess(response) {
	currData = response;
	$("#updateTaxmap").show();
	$("#updateTaxmapLoading").hide();	

	renderMap();
	renderSummary();
}


function onDetermineTaxMapFailure(jqxhr, textStatus, error) {
	currData = null;
	$("#updateTaxmap").show();
	$("#updateTaxmapLoading").hide();
	$("#serverErrorMsg").show();
}


// Setup list of programs and their cost; populate
// and attach needed listeners.
function setupProgramList(prgms) {
	$("#prgm_list").focus();
	$("#prgm_list").autocomplete({
		minLength : 0,
		delay : 0,
		source : prgms,
		focus: onAutoCompleteFocus,
		select: onAutoCompleteSelection
	}).data("ui-autocomplete")._renderItem = renderAutoCompleteItem;

	$("#prgm_list").keydown(function(event){
		if (event.keyCode == '13') {
			updateTaxmap();
		}
	});
	enableProgramList();
}


function onAutoCompleteFocus(event, ui) {
	
	// So we can't rely on the default focus behavior because that would place 
	// the entire Program (name, cost) in the search box when an item is focused.
	// However, overriding the default allows mouse events to trigger focus, and
	// that doesn't play well with IE or FF.  If user has the cursor over an
	// item then typing is effectively disabled as focus keeps getting stolen.
	// So check that this was triggered by a key event.
	if(0 == event.keyCode) {
		return;
	}	
	
	$("#prgm_list").val(ui.item.label);
	return false;
}


function onAutoCompleteSelection(event, ui) {
	$("#prgm_list").val(ui.item.label);
	selectedPrgm = ui.item;
	updateTaxmap();
	return false;
}


function renderAutoCompleteItem(ul, prgm) {
	return $("<li></li>")
		.data("item.autocomplete", prgm)
		.append("<a><span class='prgm_list-label'>" + prgm.label + "</span></a>")
		.appendTo(ul);
}


function enableProgramList() {
	$("#prgm_list").val("");
	$("#prgm_list").autocomplete({disabled: false});
	$("#prgm_list").removeAttr("disabled"); 
	$("#prgm_list").focus();
}


function disableProgramList() {
	$("#prgm_list").autocomplete({disabled: true});
	$("#prgm_list").autocomplete("close");
	$("#prgm_list").attr("disabled", "disabled");
}


// ****************************************************************************
// *                                                                          *
// *  Misc                                                                    *
// *                                                                          *
// ****************************************************************************

// Checks if the given id is in the currData index
function isRegionInCurrData(id) {
	// If the id is less than 1,000 then it's a state code.  Convert to 5-digit FIPS
	id = (currData.resolution === "state") ? id * 1000: id;
	return currData.regions_idx[id] >= 0;
}

// Gets the region with the given id from currData
function getRegionFromCurrData(id) {
	// If the id is less than 1,000 then it's a state code.  Convert to 5-digit FIPS
	id = (currData.resolution === "state") ? id * 1000: id;
	return currData.regions[currData.regions_idx[id]];
}


function createTooltipHTML(region) {
	return "<span class='title'>" + region.name + "</span><br/><hr/>" +
			"Taxes Paid: $" + formatInteger(region.est_taxes) + "<br/>" +
			"Population: " + formatInteger(region.population);
}


function formatInteger(number) {
	// From: http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
    return parseInt(number).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


function abbreviateNumber(number) {

	// Trillions 
	if (number >= 1000000000000) {	
		return parseFloat(number / 1000000000000).toFixed(2) + " trillion";
	
	// Billions
	} else if (number >= 1000000000) { 
		return parseFloat(number / 1000000000).toFixed(2) + " billion";
	
	// Millions
	} else if (number >= 1000000) {     
		return parseFloat(number / 1000000).toFixed(2) + " million";
	
	} else if (number >= 1000) {
		number = number.toString();
		var len = number.length;
		return number.substring(0, len-3) + "," + number.substring(len-3, len);
	}

	return number;
}


function geoDataReady(error, us_json) {
	geoData = us_json;

	// See if some operation is waiting on this data
	if (onGetDataDownloaded) {
		onGetDataDownloaded();
	}	
}


$(document).ready(function() {

	// Request values for programs list autocomplete
	$.getJSON("/static/data/programs.json", setupProgramList);
	
	// Basic UI setup
	$("input[type=submit], button").button();	

	// Setup controls
	$("#updateTaxmap").click(updateTaxmap);
	$("#showMoreDetails").click(showMoreDetails);

	// Start downloading geo data immediately
	var q = queue()
    	.defer(d3.json, "static/data/us.json")
    	.await(geoDataReady);
});