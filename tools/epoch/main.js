"use strict";
var invalid = "Invalid Date";
// Is this syntax idiomatic? It looks weird
var get_unix = function (now) { return Math.floor(now.getTime() / 1000).toString(); };
var time_input = document.getElementById("time_input");
document.getElementById("current").innerHTML = get_unix(new Date());
document.getElementById("convert").onclick = function () {
    var output = [];
    var conversions = time_input.value.split("\n");
    conversions.forEach(function (value) {
        // Skip blank lines
        if (value == "")
            output.push("");
        // Don't append a bunch of them if the user is spamming the button
        else if (value.includes(invalid))
            output.push(value);
        // User provided Unix time
        else if (!isNaN(+value))
            output.push(new Date(parseInt(value) * 1000).toString());
        // User supposedly gave a date
        else {
            var now = new Date(value);
            if (now.toString() == invalid)
                output.push(invalid + ": " + value);
            else
                output.push(get_unix(now));
        }
    });
    time_input.value = output.join("\n");
};
