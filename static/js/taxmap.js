/* taxmap : https://github.com/lbracken/taxmap
   :license: MIT, see LICENSE for more details.
*/


// ****************************************************************************
// *                                                                          *
// *  Project Logic                                                           *
// *                                                                          *
// ****************************************************************************

function updateTaxmap() {

	var zip = $("zip").val().trim();
	var prgm_cost = $("prgm_cost").val().trim();

	$.post("onDetermineTaxMapSuccess",
		{"zip" : zip, "prgm_cost" : prgm_cost},
		onDetermineTaxMapSuccess).fail(onDetermineTaxMapFailure);
}

// ****************************************************************************
// *                                                                          *
// *  Misc                                                                    *
// *                                                                          *
// ****************************************************************************

$(document).ready(function() {

	// Basic UI setup
	$("input[type=submit], button").button();	

	// Setup controls
	$("#updateTaxmap").click(updateTaxmap);
});