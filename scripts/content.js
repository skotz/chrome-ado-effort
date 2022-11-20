function skotzHash(input) {
    var hash = 0,
        i, chr;
    if (input.length === 0) return hash;
    for (i = 0; i < input.length; i++) {
        chr = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash;
}

function skotzCastVote(vote) {
    try {
        document.querySelector("[aria-label=Discussion]").dispatchEvent(new Event("focus"));
        document.querySelectorAll("[aria-label=Discussion] br").forEach(d => d.remove());
        document.querySelectorAll("[aria-label=Discussion] .skotz-vote").forEach(d => d.remove());
        // Hash email address for user id
        var user = skotzHash(document.querySelector("#mectrl_currentAccount_secondary").innerHTML);
        document.querySelector("[aria-label=Discussion]").innerHTML += "<span class=\"skotz-vote\">Voted</span><span style=\"font-size:0px\">{\"skotz\":true,\"vote\":\"" + vote + "\",\"user\":\"" + user + "\",\"time\":" + new Date().getTime() + "}</span>";
        document.querySelector("[aria-label=Discussion]").dispatchEvent(new Event("focus"));
        var tries = 20;
        var timer = setInterval(function () {
            try {
                if (document.querySelector("[aria-label=Discussion] .skotz-vote b") == null) {
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(document.querySelector("[aria-label=Discussion] .skotz-vote"));
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
        var votes = [];
        document.querySelectorAll("span[style='font-size:0px']").forEach(x => {
            try {
                var json = JSON.parse(x.innerHTML);
                if (json.skotz === true) {
                    //console.log(json);
                    var index = -1;
                    votes.forEach((v, i) => {
                        if (v.user == json.user) {
                            index = i;
                        }
                    });
                    if (index == -1) {
                        votes.push(json);
                        //console.log("new");
                    } else if (json.time > votes[index].time) {
                        votes[index] = json;
                        //console.log("newer");
                    }
                }
            } catch (ex) {
                console.log("bad " + x.innerHTML);
            }
        });
        var total = 0;
        var count = 0;
        var scores = {};
        var unique = "!";
        votes.forEach(x => {
            total += +x.vote;
            count++;
            if (scores[x.vote] == null) {
                scores[x.vote] = 0;
            }
            scores[x.vote]++;
            unique += "|" + x.vote + "|" + x.user + "|" + x.time;
        });
        if (count > 0) {
            var average = total / count;
            //console.log("average = " + average);
        }
        var prev = document.querySelector(".skotz-graph");
        if (prev == null || prev.getAttribute("data-last") != unique) {
            if (prev != null) {
                prev.setAttribute("data-last", unique);
            }
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
                html += ".skotz-line:hover {opacity:1 !important}";
                html += "</style>";
                html += "<div id=\"skotz-line-" + cssScore + "\" class=\"skotz-line\" style=\"display:flex;margin-left:5px;" + (num == 0 ? "opacity:0.25" : "") + "\">";
                html += "<div class=\"skotz-" + cssScore + "\"></div>";
                html += "<div style=\"margin-left:5px;display:flex\">" + score + "</div></div>";
                html += "</div>";
                div.innerHTML += html;
            }
            var div = document.createElement("div");
            skotzStyle(div, 1);
            skotzStyle(div, 2);
            skotzStyle(div, 3);
            skotzStyle(div, 5);
            skotzStyle(div, 8);
            skotzStyle(div, 13);
            skotzStyle(div, 20);
            skotzStyle(div, 40);
            skotzStyle(div, 100);
            skotzStyle(div, "?");
            div.classList.add("skotz-graph");
            div.setAttribute("data-last", unique);
            var parent = document.querySelector("[aria-label=Effort]");
            while (parent != null && !parent.classList.contains("control")) {
                parent = parent.parentElement;
            }
            document.querySelectorAll(".skotz-graph").forEach(d => d.remove());
            parent.appendChild(div);
            document.getElementById("skotz-line-1").addEventListener("click", function (e) { skotzCastVote(1); skotzTallyVotes(); }, false);
            document.getElementById("skotz-line-2").addEventListener("click", function (e) { skotzCastVote(2); skotzTallyVotes(); }, false);
            document.getElementById("skotz-line-3").addEventListener("click", function (e) { skotzCastVote(3); skotzTallyVotes(); }, false);
            document.getElementById("skotz-line-5").addEventListener("click", function (e) { skotzCastVote(5); skotzTallyVotes(); }, false);
            document.getElementById("skotz-line-8").addEventListener("click", function (e) { skotzCastVote(8); skotzTallyVotes(); }, false);
            document.getElementById("skotz-line-13").addEventListener("click", function (e) { skotzCastVote(13); skotzTallyVotes(); }, false);
            document.getElementById("skotz-line-20").addEventListener("click", function (e) { skotzCastVote(20); skotzTallyVotes(); }, false);
            document.getElementById("skotz-line-40").addEventListener("click", function (e) { skotzCastVote(40); skotzTallyVotes(); }, false);
            document.getElementById("skotz-line-100").addEventListener("click", function (e) { skotzCastVote(100); skotzTallyVotes(); }, false);
            document.getElementById("skotz-line-x").addEventListener("click", function (e) { skotzCastVote("?"); skotzTallyVotes(); }, false);
        }
    } catch (ex) {
        console.log(ex);
    }
}

setInterval(skotzTallyVotes, 1000);

console.log("%c Loaded Skotz Plugin ", "background:#0F0;color:#000;font-size:20px;");