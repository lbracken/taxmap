/* taxmap : https://github.com/lbracken/taxmap
   :license: MIT, see LICENSE for more details.
*/

// Constants
var maxRegionsToShowByName = 5;

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
	$("#updateTaxmap").show();
	$("#updateTaxmapLoading").hide();
	$("#content").fadeIn();

	// Create the Summary Header
	var summaryHeader = "PRGM NAME"; // TOOD: Change to response.prgm_name
	summaryHeader += " = $";
	summaryHeader += abbreviateNumber(response.prgm_cost);
	summaryHeader += " / year";
	$("#summaryHeader").text(summaryHeader);

	// Create the Summary Message
	var summaryMessage = "It would take the income taxes of ";

	if (response.resolution === "country") {
		// TODO:

	} else {

		// Single Region...
		if (response.regions.length === 1) {
			summaryMessage += response.regions[0].name;

		// Multiple Regions, show them all...
		} else if (response.regions.length < maxRegionsToShowByName) {
			for (var ctr=0; ctr < response.regions.length-1; ctr++) {
				summaryMessage += (ctr > 0) ? ", " : "";
				summaryMessage += response.regions[ctr].name;
			}
			summaryMessage += " and "
			summaryMessage += response.regions[response.regions.length-1].name;

		// Multiple Regions, only show a few...
		} else {
			for (var ctr=0; ctr < maxRegionsToShowByName; ctr++) {
				summaryMessage += (ctr > 0) ? ", " : "";
				summaryMessage += response.regions[ctr].name;
			}
			summaryMessage += " and ";
			summaryMessage += (response.regions.length - maxRegionsToShowByName);
			summaryMessage += " other";
		}

		if (response.resolution === "county") {
			summaryMessage += (response.regions.length > 1) ? " counties" : " county";
		} else if (response.resolution === "state") {
			summaryMessage += (response.regions.length > 1) ? " states" : "";
		}
	}

	summaryMessage += " to pay for the ";
	summaryMessage += "PRGM NAME"; // TOOD: Change to response.prgm_name
	summaryMessage += " budget."	
	$("#summaryMessage").html(summaryMessage);

}

function onDetermineTaxMapFailure(jqxhr, textStatus, error) {
	$("#updateTaxmap").show();
	$("#updateTaxmapLoading").hide();
	$("#serverErrorMsg").show();
}

// ****************************************************************************
// *                                                                          *
// *  Misc                                                                    *
// *                                                                          *
// ****************************************************************************

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
});