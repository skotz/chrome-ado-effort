/*
Scott Clayton 2022
*/

var skotzDiscussionSelector = "[aria-label=Discussion]";
var skotzEffortSelector = "[aria-label=Effort]";
var skotzUsernameSelector = "#mectrl_currentAccount_secondary";
var skotzEffortOptions = [1, 2, 3, 5, 8, 13, 20, 40, 100, "?"];

function skotzHash(input) {
    var hash = 0;
    if (input.length === 0) {
        return hash;
    }
    for (var i = 0; i < input.length; i++) {
        var chr = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash;
}

function skotzCastVote(vote) {
    try {
        // The first focus creates a <br> for some reason, so get that out of the way
        document.querySelector(skotzDiscussionSelector).dispatchEvent(new Event("focus"));
        document.querySelectorAll(skotzDiscussionSelector + " br").forEach(d => d.remove());

        // Remove previous vote text (scores are left hidden)
        document.querySelectorAll(skotzDiscussionSelector + " .skotz-vote").forEach(d => d.remove());

        // Hash email address for user id
        var user = skotzHash(document.querySelector(skotzUsernameSelector).innerHTML);

        // Generate a hidden vote json (ADO apparently deleted hidden and custom tags on save, so a 0px font size is what I got working)
        document.querySelector(skotzDiscussionSelector).innerHTML += "<span class=\"skotz-vote\">Voted</span><span style=\"font-size:0px\">{\"skotz\":true,\"vote\":\"" + vote + "\",\"user\":\"" + user + "\",\"time\":" + new Date().getTime() + "}</span>";
        document.querySelector(skotzDiscussionSelector).dispatchEvent(new Event("focus"));

        // ADO is using some control that uses a div as a text input, and it's hard to trigger the event so that a change is detected and the save button highlights, so repeatedly click the bold button until it takes
        var tries = 20;
        var timer = setInterval(function () {
            try {
                if (document.querySelector(skotzDiscussionSelector + " .skotz-vote b") == null) {
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(document.querySelector(skotzDiscussionSelector + " .skotz-vote"));
                    selection.removeAllRanges();
                    selection.addRange(range);
                    document.querySelector(".discussion-control [aria-label=Bold]").dispatchEvent(new MouseEvent("click", { bubbles: true }));
                    if (tries-- <= 0) {
                        clearInterval(timer);
                    }
                } else {
                    clearInterval(timer);
                }
            } catch (ex) {
                console.log(ex);
            }
        }, 10);
    } catch (ex) {
        console.log(ex);
    }
}

function skotzTallyVotes() {
    try {
        // Find all the hidden json and parse out the scores
        var votes = [];
        document.querySelectorAll("span[style='font-size:0px']").forEach(x => {
            try {
                var json = JSON.parse(x.innerHTML);
                if (json.skotz === true) {
                    var index = -1;
                    votes.forEach((v, i) => {
                        if (v.user == json.user) {
                            index = i;
                        }
                    });
                    if (index == -1) {
                        // New user
                        votes.push(json);
                    } else if (json.time > votes[index].time) {
                        // Same user, newer vote based on timestamp
                        votes[index] = json;
                    }
                }
            } catch (ex) {
                console.log("bad " + x.innerHTML);
            }
        });

        // Aggregate the votes gathered
        var scores = {};
        var unique = "!";
        votes.forEach(x => {
            if (scores[x.vote] == null) {
                scores[x.vote] = 0;
            }
            scores[x.vote]++;
            unique += "|" + x.vote + "|" + x.user + "|" + x.time;
        });

        // Redraw when the state has changed
        var prev = document.querySelector(".skotz-graph");
        if (prev == null || prev.getAttribute("data-last") != unique) {
            if (prev != null) {
                prev.setAttribute("data-last", unique);
            }

            // Draw a single line of the graph
            function skotzStyle(div, score) {
                var scale = 16;
                var width = 0;
                var num = 0;
                if (scores[score.toString()] != null) {
                    num = +scores[score.toString()];
                    width = num * scale;
                }
                var cssScore = score != "?" ? score : "x";
                var palette = score != "?" ? "--communication-background" : "--palette-error";
                var html = "";
                html += "<style>";
                html += ".skotz-" + cssScore + " {width:" + width + "px;height:" + scale + "px;background:rgba(0,103,181,1);background:var(" + palette + ",rgb(0, 120, 212));display:flex;border-left:1px solid #000;}";
                html += ".skotz-line {transition: opacity 200ms; cursor: pointer;}";
                html += ".skotz-line:hover {opacity:1 !important; background: linear-gradient(90deg, rgba(244,244,244,1) 0%, rgba(244,244,244,0) 100%);}";
                html += "</style>";
                html += "<div id=\"skotz-line-" + cssScore + "\" class=\"skotz-line\" style=\"display:flex;margin-left:5px;" + (num == 0 ? "opacity:0.25" : "") + "\">";
                html += "<div class=\"skotz-" + cssScore + "\"></div>";
                html += "<div style=\"margin-left:5px;display:flex\">" + score + "</div></div>";
                html += "</div>";
                div.innerHTML += html;
            }

            // Draw the graph directly below the effort box
            var div = document.createElement("div");
            skotzEffortOptions.forEach(z => skotzStyle(div, z));
            div.classList.add("skotz-graph");
            div.setAttribute("data-last", unique);
            var parent = document.querySelector(skotzEffortSelector);
            while (parent != null && !parent.classList.contains("control")) {
                // Find the nearest "control" parent
                parent = parent.parentElement;
            }
            if (parent != null) {
                document.querySelectorAll(".skotz-graph").forEach(d => d.remove());
                parent.appendChild(div);

                // Attach click events for updating votes
                skotzEffortOptions.forEach(z => {
                    document.getElementById("skotz-line-" + (z == "?" ? "x" : z)).addEventListener("click", function (e) {
                        skotzCastVote(z);
                        skotzTallyVotes();
                    }, false);
                });
            }
        }
    } catch (ex) {
        console.log(ex);
    }
}

setInterval(skotzTallyVotes, 1000);

console.log("%c Loaded Skotz Plugin v1.0 ", "background:#0F0;color:#000;font-size:20px;");