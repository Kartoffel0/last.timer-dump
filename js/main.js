var lastfmUsername;// = document.getElementById("usernameInput").value;
var lastfmMetric;// = document.getElementById("chartMetric").value;
var lastfmTimeframe;// = document.getElementById("chartTimeframe").value;
var lastfmReturnLimit;// = document.getElementById("chartSize").value;
var durationDict;// = []
var chartOutput;
var tracksWithNoTime;
var promises;
var fiveHundredAlert = 1

function createCharts() {
    fiveHundredAlert = 1
    chartOutput = document.getElementById("chartOutput")
    durationDict = [];
    tracksWithNoTime = [];
    lastfmUsername = document.getElementById("usernameInput").value;
    lastfmMetric = document.getElementById("chartMetric").value;
    lastfmTimeframe = document.getElementById("chartTimeframe").value;
    lastfmReturnLimit = "1000"
//    lastfmReturnLimit = document.getElementById("chartSize").value;
//    console.log(lastfmUsername,lastfmMetric,lastfmTimeframe,lastfmReturnLimit)
    
    if (lastfmMetric == "artist"){
        document.getElementById("loadingMessages").innerHTML = "Gathering artists..."
//        var artistDuration = [];
        var artistsList = [];
        var promiseArtist = new Promise(function(resolve, reject) {
            var restAPIcall = "https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=" + lastfmUsername + "&period=" + lastfmTimeframe + "&limit=" + lastfmReturnLimit + "&api_key=bc139a6bdeaa921ed70e49ca9a21f683&format=json";
            var request = new XMLHttpRequest();
            request.onreadystatechange=function() {
                if (request.readyState === 4) {
                    if (request.status === 200) {
                        // do nothing
                    } else {
                        console.log("Last.fm returned "+request.status+" error. Page "+currentPage+" was lost. Trying again for more accurate results.");
                        if (request.status === 500) {
                            alert("Last.fm returned an Internal Server Error. Please retry.");
                            return;
                        }
                    }
                }
            }
            request.open('GET', restAPIcall, true);
            request.onload = function() {
                var data = JSON.parse(this.response);
                try {
                    for (var i = 0; i < data.topartists.artist.length; i++) {
                        artistsList.push(data.topartists.artist[i].name);
                        durationDict.push({
                            artistName:data.topartists.artist[i].name,
                            duration:0,
                            durHours:null,
                            durMinutes:null,
                            durSeconds:null,
                            playcount:0,
                            playtimeRank:null,
                            playcountRank:i+1,
                            emptyTracks:0
                        });
                        if (durationDict.length == data.topartists.artist.length) {
    //                        console.log(durationDict);
                            resolve();
                        }
                    }
                }
                catch(err) {
                    console.log(err);
                    alert("Username not found.");
                    document.getElementById("loadingMessages").innerHTML = ""
                    return;
                }
            }
            request.send();
        });
        
        promiseArtist.then(function () {
            document.getElementById("loadingMessages").innerHTML = "Collecting Tracks..."
            gatherTracks(artistsList).then(function () {
                document.getElementById("loadingMessages").innerHTML = ""
                chartOutput.innerHTML = ""
                durationDict.sort(function(a, b){
                    return b.duration - a.duration;
                });
                for(var z = 0; z < durationDict.length; z++) {
                    durationDict[z].playtimeRank = z+1;
                }
                durationDict.forEach(function(entry) {
//                    console.log(entry);
                    entry.durHours = Math.floor(entry.duration/3600);
                    entry.durMinutes = Math.floor((entry.duration-entry.durHours*3600)/60);
                    entry.durSeconds = entry.duration-entry.durHours*3600-entry.durMinutes*60;
//                    chartOutput.innerHTML += entry.artistName + ": " + entry.durHours + ":" + entry.durMinutes.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + ":" + entry.durSeconds.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + " playtime across "+entry.playcount+" plays<br>";
                });
                createArtistTable(durationDict);
//                console.log("These tracks have no time data: ",tracksWithNoTime);
                tracksWithNoTime.sort();
                document.getElementById("popUpBox").innerHTML = "There are "+tracksWithNoTime.length+" track(s) with no time data.<br>"+tracksWithNoTime.join("<br>") + "<br>";
                document.getElementById("badDataButton").style.display = "block";
//                document.getElementById("tablePages").style.display = "block";
            });
        });
    } else if (lastfmMetric == "album") {
        console.log("to be done later")
    } else if (lastfmMetric == "track") {
        document.getElementById("loadingMessages").innerHTML = "Collecting Tracks..."
        gatherTracks(null).then(function () {
            document.getElementById("loadingMessages").innerHTML = ""
            chartOutput.innerHTML = ""
            durationDict.sort(function(a, b){
                return b.duration - a.duration;
            });
            for(var z = 0; z < durationDict.length; z++) {
                durationDict[z].playtimeRank = z+1;
            }
            durationDict.forEach(function(entry) {
                console.log(entry);
                entry.durHours = Math.floor(entry.duration/3600);
                entry.durMinutes = Math.floor((entry.duration-entry.durHours*3600)/60);
                entry.durSeconds = entry.duration-entry.durHours*3600-entry.durMinutes*60;
//                    chartOutput.innerHTML += entry.artistName + ": " + entry.durHours + ":" + entry.durMinutes.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + ":" + entry.durSeconds.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + " playtime across "+entry.playcount+" plays<br>";
            });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([JSON.stringify(durationDict, null, 2)], {
              type: "text/plain"
            }));
            a.setAttribute("download", "data.txt");
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            createTrackTable(durationDict);
//                console.log("These tracks have no time data: ",tracksWithNoTime);
            tracksWithNoTime.sort();
            document.getElementById("popUpBox").innerHTML = "There are "+tracksWithNoTime.length+" track(s) with no time data.<br>"+tracksWithNoTime.join("<br>") + "<br>";
            document.getElementById("badDataButton").style.display = "block";
//                document.getElementById("tablePages").style.display = "block";
        });
    }
    
  
  
}

function gatherTracks(listofNamesTemp) {
    return new Promise (function(resolve) {
        var restAPIcallTwo = "https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=" + lastfmUsername + "&period=" + lastfmTimeframe + "&limit=1000&page=1&api_key=bc139a6bdeaa921ed70e49ca9a21f683&format=json";
        var totalPageLimit;
        promises = [];
        var requestTwo = new XMLHttpRequest();
        requestTwo.onreadystatechange=function() {
            if (requestTwo.readyState === 4) {
                if (requestTwo.status === 200) {
                    //do nothing
                } else {
                    console.log("Last.fm returned "+requestTwo.status+" error on page check.");
                    if (requestTwo.status === 500) {
                        gatherTracks(listofNamesTemp)
                    }
                }
            }
        }
        requestTwo.open('GET', restAPIcallTwo, true);
        requestTwo.onload = function() {
            var data = JSON.parse(this.response);
            totalPageLimit = Number(data.toptracks['@attr'].totalPages);
//            console.log("Total Pages = "+totalPageLimit);
//            var totalTracks = data.toptracks['@attr'].total;
            for (var j = 1; j < totalPageLimit+1; j++) {
                promises.push(gatherTracksPerPage(listofNamesTemp, j));
            }
            promiseProgress(promises,function(results) {
                document.getElementById("loadingMessages").innerHTML = "Calculating Track durations... Completed pages "+results+" out of "+totalPageLimit;
            })
            Promise.all(promises).then(function(results) {
               resolve(); 
            });
        }
        requestTwo.send();
    });
}

function gatherTracksPerPage(listofNames, currentPage) {
    return new Promise (function(resolve) {
        var restAPIcallThree = "https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=" + lastfmUsername + "&period=" + lastfmTimeframe + "&limit=1000&page=" + currentPage + "&api_key=bc139a6bdeaa921ed70e49ca9a21f683&format=json";
        var requestThree = new XMLHttpRequest();
        requestThree.onreadystatechange=function() {
            if (requestThree.readyState === 4) {
                if (requestThree.status === 200) {
                    // do nothing
                } else {
                    console.log("Last.fm returned "+requestThree.status+" error. Page "+currentPage+" was lost. Trying again for more accurate results.");
                    if (requestThree.status === 500) {
                        promises.push(gatherTracksPerPage(listofNames,currentPage));
                    }
                    setTimeout(resolve(),10000)
                    if (fiveHundredAlert > 0) {
                        fiveHundredAlert--;
                        alert("This app has encountered Internal Service Errors from Last.fm, it will try to complete but it may lose some data.  Check the playcounts for accuracy, re-run to try again.")
                    }
//                    resolve();
                }
            }
        }
        requestThree.open('GET', restAPIcallThree, true);
        requestThree.onload = function() {
            var data = JSON.parse(this.response);
            try {
                for (var i = 0; i < data.toptracks.track.length; i++) {
    //                console.log("working on track "+i);
                    if (listofNames == null) {
                        var tempDuration = data.toptracks.track[i].playcount * data.toptracks.track[i].duration
                        durationDict.push({
                            trackName:data.toptracks.track[i].name,
                            artistName:data.toptracks.track[i].artist.name,
                            duration:tempDuration,
                            durHours:null,
                            durMinutes:null,
                            durSeconds:null,
                            playcount:Number(data.toptracks.track[i].playcount),
                            playtimeRank:null,
                            playcountRank:i+1,
                            emptyTracks:0
                        });
                    } else if (listofNames.includes(data.toptracks.track[i].artist.name)) {
                        for (var d = 0; d < durationDict.length; d++) {
                            if (durationDict[d].artistName == data.toptracks.track[i].artist.name) {
                                var addDuration = data.toptracks.track[i].playcount * data.toptracks.track[i].duration;
                                if (addDuration == 0 ) {
                                    tracksWithNoTime.push(data.toptracks.track[i].artist.name+" --- "+data.toptracks.track[i].name);
                                    durationDict[d].emptyTracks += Number(data.toptracks.track[i].playcount);
                                }
                                durationDict[d].duration += addDuration;
                                durationDict[d].playcount += Number(data.toptracks.track[i].playcount);
//                                console.log("Adding "+addDuration+" to "+durationDict[d].artistName)
                            }
                        }
                    }
                }
                resolve();
            }
            catch(err) {
                console.log("Caught error:", err)
            }
        }
        requestThree.send();
    });
}

function promiseProgress(proms, progress) {
    var d = 0;
    progress(0);
    for (var p = 0; p < proms.length; p++) {
        proms[p].then(function() {
            d++;
            progress(d);
        });
    }
    return Promise.all(proms)
}

function createArtistTable(dataDictionary) {
//    console.log(dataDictionary);
    document.getElementById("chartOutput").innerHTML = ""
    var table = document.createElement('table');
    table.setAttribute('id', 'tableOfOutput');
    table.setAttribute('class', 'display')
    table.setAttribute('style', 'width:100%')
    var tableHeader = ["Time Rank", "Artist", "Playtime", "Playcount", "Plays Rank", "Rank Change", "Avg Track Length"];
    
    var tr;
    for (var c = 0; c < dataDictionary.length; c++) {
        tr = table.insertRow();
        
        var tdTimeRank = document.createElement('td');
        tdTimeRank = tr.insertCell();
        tdTimeRank.innerHTML = dataDictionary[c].playtimeRank;
        
        var tdArtist = document.createElement('td');
        tdArtist = tr.insertCell();
        tdArtist.innerHTML = dataDictionary[c].artistName;
        
        var tdPlaytime = document.createElement('td');
        tdPlaytime = tr.insertCell();
        tdPlaytime.innerHTML = dataDictionary[c].durHours + ":" + dataDictionary[c].durMinutes.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + ":" + dataDictionary[c].durSeconds.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
        
        var tdPlaycount = document.createElement('td');
        tdPlaycount = tr.insertCell();
        tdPlaycount.innerHTML = dataDictionary[c].playcount;
        
        var tdPlayRank = document.createElement('td');
        tdPlayRank = tr.insertCell();
        tdPlayRank.innerHTML = dataDictionary[c].playcountRank;
        
        var rankChange = Number(dataDictionary[c].playcountRank-dataDictionary[c].playtimeRank)
        var tdRankChange = document.createElement('td');
        tdRankChange = tr.insertCell();
        if (rankChange > 0) {
            tdRankChange.innerHTML = "+"+String(rankChange);
        } else {
            tdRankChange.innerHTML = String(rankChange);
        }
        
        var averageTrackLength = dataDictionary[c].duration/(dataDictionary[c].playcount - dataDictionary[c].emptyTracks);
        var averageTrackLengthMinutes = Math.floor(averageTrackLength/60);
        var averageTrackLengthSeconds = Math.round(averageTrackLength-averageTrackLengthMinutes*60);
//        console.log("Average Track Length: "+averageTrackLength,"Minutes: "+averageTrackLengthMinutes,"Seconds: "+averageTrackLengthSeconds)
        var tdTrackAvg = document.createElement('td');
        tdTrackAvg = tr.insertCell(-1);
        tdTrackAvg.innerHTML = averageTrackLengthMinutes.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + ":" + averageTrackLengthSeconds.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
    }
    
    var header = table.createTHead();
    var trHead = header.insertRow(0);
    for (var h = 0; h < tableHeader.length; h++) {
        var th = document.createElement('th');
        th.innerHTML = tableHeader[h];
        trHead.appendChild(th);
    }
    
    document.getElementById("chartOutput").appendChild(table);
    adjustTable();
}

function createTrackTable(dataDictionary) {
//    console.log(dataDictionary);
    document.getElementById("chartOutput").innerHTML = ""
    var table = document.createElement('table');
    table.setAttribute('id', 'tableOfOutput');
    table.setAttribute('class', 'display')
    table.setAttribute('style', 'width:100%')
    var tableHeader = ["Time Rank", "Track", "Artist", "Playtime", "Playcount", "Plays Rank", "Rank Change"];
    
    var tr;
    for (var c = 0; c < dataDictionary.length; c++) {
        tr = table.insertRow();
        
        var tdTimeRank = document.createElement('td');
        tdTimeRank = tr.insertCell();
        tdTimeRank.innerHTML = dataDictionary[c].playtimeRank;
        
        var tdTrack = document.createElement('td');
        tdTrack = tr.insertCell();
        tdTrack.innerHTML = dataDictionary[c].trackName;
        
        var tdArtist = document.createElement('td');
        tdArtist = tr.insertCell();
        tdArtist.innerHTML = dataDictionary[c].artistName;
        
        var tdPlaytime = document.createElement('td');
        tdPlaytime = tr.insertCell();
        tdPlaytime.innerHTML = dataDictionary[c].durHours + ":" + dataDictionary[c].durMinutes.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + ":" + dataDictionary[c].durSeconds.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
        
        var tdPlaycount = document.createElement('td');
        tdPlaycount = tr.insertCell();
        tdPlaycount.innerHTML = dataDictionary[c].playcount;
        
        var tdPlayRank = document.createElement('td');
        tdPlayRank = tr.insertCell();
        tdPlayRank.innerHTML = dataDictionary[c].playcountRank;
        
        var rankChange = Number(dataDictionary[c].playcountRank-dataDictionary[c].playtimeRank)
        var tdRankChange = document.createElement('td');
        tdRankChange = tr.insertCell();
        if (rankChange > 0) {
            tdRankChange.innerHTML = "+"+String(rankChange);
        } else {
            tdRankChange.innerHTML = String(rankChange);
        }
        
//        var averageTrackLength = dataDictionary[c].duration/(dataDictionary[c].playcount - dataDictionary[c].emptyTracks);
//        var averageTrackLengthMinutes = Math.floor(averageTrackLength/60);
//        var averageTrackLengthSeconds = Math.round(averageTrackLength-averageTrackLengthMinutes*60);
////        console.log("Average Track Length: "+averageTrackLength,"Minutes: "+averageTrackLengthMinutes,"Seconds: "+averageTrackLengthSeconds)
//        var tdTrackAvg = document.createElement('td');
//        tdTrackAvg = tr.insertCell(-1);
//        tdTrackAvg.innerHTML = averageTrackLengthMinutes.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + ":" + averageTrackLengthSeconds.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
    }
    
    var header = table.createTHead();
    var trHead = header.insertRow(0);
    for (var h = 0; h < tableHeader.length; h++) {
        var th = document.createElement('th');
        th.innerHTML = tableHeader[h];
        trHead.appendChild(th);
    }
    
    document.getElementById("chartOutput").appendChild(table);
    adjustTable();
}

function adjustTable() {
    var script = document.createElement('script');
//    script.src = 'https://code.jquery.com/jquery-3.4.1.min.js';
//    script.type = 'text/javascript';
    $(document).ready(function() {
//        $(tableOfOutput).ready(function() {
            $('#tableOfOutput').DataTable();
//        } );
    });
}
