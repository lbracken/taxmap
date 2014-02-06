/* taxmap : https://github.com/lbracken/taxmap
   :license: MIT, see LICENSE for more details.
*/

// Constants
var maxRegionsToShowByName = 5;

var currData;

// ****************************************************************************
// *                                                                          *
// *  Project Logic                                                           *
// *                                                                          *
// ****************************************************************************

function updateTaxmap() {

	var zip = $("#zip").val().trim();
	var prgmCost = $("#prgm_cost").val().trim() * 1003000;

	// TODO: Validate this data...

	$("#updateTaxmap").hide();
	$("#updateTaxmapLoading").fadeIn();

	$.getJSON("determine_tax_map",
		{"zip" : zip, "prgm_cost" : prgmCost},
		onDetermineTaxMapSuccess).fail(
		onDetermineTaxMapFailure);
}

function onDetermineTaxMapSuccess(response) {
	currData = response;
	$("#updateTaxmap").show();
	$("#updateTaxmapLoading").hide();
	$("#content").fadeIn();
	$("#showMoreDetails").show();

	// Lots of string concatination in this function.  Looks like this is
	// the fastet method.  See: http://jsperf.com/string-concatenation/14

	// Create the Summary Header
	var summaryHeader = "PRGM NAME"; // TOOD: Change to currData.prgm_name
	summaryHeader += " = $";
	summaryHeader += abbreviateNumber(currData.prgm_cost);
	summaryHeader += " / year";
	$("#summaryHeader").text(summaryHeader);

	// Create the Summary Message
	var summaryMessage = "";
	if (currData.regions.length === 1) {

		if (currData.resolution === "country") {
			// TODO
		} else {
			summaryMessage += "The income taxes of ";
			summaryMessage += currData.regions[0].name;
			summaryMessage += (currData.resolution === "state") ? "" : " County";
			summaryMessage += " could pay for ";
		}
	} else {
		summaryMessage += "It would take the combined income taxes of ";

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

	summaryMessage += "PRGM NAME"; // TOOD: Change to currData.prgm_name
	summaryMessage += "."	
	$("#summaryMessage").html(summaryMessage);
}

function onDetermineTaxMapFailure(jqxhr, textStatus, error) {
	currData = null;
	$("#updateTaxmap").show();
	$("#updateTaxmapLoading").hide();
	$("#serverErrorMsg").show();
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
// *  Misc                                                                    *
// *                                                                          *
// ****************************************************************************

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


$(document).ready(function() {

	// Basic UI setup
	$("input[type=submit], button").button();	

	// Setup controls
	$("#updateTaxmap").click(updateTaxmap);
	$("#showMoreDetails").click(showMoreDetails);
});