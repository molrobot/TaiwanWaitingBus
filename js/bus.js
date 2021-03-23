// 城市名稱、搜尋字串、去返程
let city, queryString, subRouteNum;

// 站牌順序、路線方向資料、預估到站資料
let stopSequence = [], routeHeadsign = [], estimatedTime = [];

// 網頁載入執行
$(function () {
    // city = "Taoyuan";
    // let routeName = "155";

    // 取得網址參數
    let myUrl = window.location.href;
    const url = new URL(myUrl);
    city = url.searchParams.get("city");
    let routeName = url.searchParams.get("route");


    // example: ?$filter=RouterName/Zh_tw eq '5063'
    //          ?$filter=RouteName%2FZh_tw%20eq%20'5063'&$format=JSON"
    queryString = routeName + "?$filter=RouteName%2FZh_tw%20eq%20'" + routeName + "'&$format=JSON";

    subRouteNum = 0;

    $.when(getStopSequence(), getHeadsign()).then(function () {
        // console.log(stopSequence[0]);
        // console.log(routeHeadsign[0]);
        console.assert(routeHeadsign.length === stopSequence.length);
        return getBusData();
    }).then(function () {
        console.assert(estimatedTime[0] !== undefined);
        printBusData();
    });

    // Hammer套件，監聽swipe事件
    let el = document.documentElement;
    let swipe = Hammer(el, {
        touchAction: 'pan-y'
    });

    swipe.get("swipe").set({
        direction: Hammer.DIRECTION_HORIZONTAL,
        threshold: 1,
        velocity: 0.1
    });

    // 向左滑動、向右滑動
    swipe.on("swipeleft swiperight", function(event) {
        switch (event.direction) {
            case Hammer.DIRECTION_LEFT:
                if(subRouteNum < routeHeadsign.length - 1){
                    ++subRouteNum;
                    printBusData();
                }
                break;
            case Hammer.DIRECTION_RIGHT:
                if(subRouteNum > 0){
                    --subRouteNum;
                    printBusData();
                }
                break;
        }
    });

    // 向左切換按鈕
    $("#left").click(function() {
        if(subRouteNum > 0){
            --subRouteNum;
            printBusData();
        }
    });

    // 向右切換按鈕
    $("#right").click(function() {
        if(subRouteNum < routeHeadsign.length - 1){
            ++subRouteNum;
            printBusData();
        }
    });
});


function getStopSequence() {
    let $d = $.Deferred();
    let url;

    // 取得站序資料
    if(city === "InterCity") {
        url = "https://ptx.transportdata.tw/MOTC/v2/Bus/StopOfRoute/InterCity/" + queryString;
    }
    else {
        url = "https://ptx.transportdata.tw/MOTC/v2/Bus/StopOfRoute/City/" + city + "/" + queryString;
    }

    $.when(getJSONData(url)).done(function (JSONData) {
        // console.log(JSONData);
        $.each(JSONData, function(index1, item1) {
            let stopName = [];
            $.each(item1["Stops"], function(index2, item2) {
                stopName.push(item2["StopName"]["Zh_tw"]);
            });
            stopSequence.push(stopName);
        });
        // console.log(stopSequence);
        $d.resolve();
    });
    return $d.promise();
}

function getHeadsign() {
    let $d = $.Deferred();
    let url;

    // 取得子路線方向資料
    if(city === "InterCity") {
        url = "https://ptx.transportdata.tw/MOTC/v2/Bus/Route/InterCity/" + queryString;
    }
    else {
        url = "https://ptx.transportdata.tw/MOTC/v2/Bus/Route/City/" + city + "/" + queryString;
    }

    $.when(getJSONData(url)).done(function (JSONData) {
        // console.log(JSONData);
        $.each(JSONData[0]["SubRoutes"], function(index, element) {
            let route = [];
            route.push(element["Direction"]);
            route.push(element["Headsign"]);
            routeHeadsign.push(route);
        });
        if(city !== "InterCity") {
            routeHeadsign[0][1] = "往 " + JSONData[0]["DestinationStopNameZh"];
            if(routeHeadsign[1] != null)
                routeHeadsign[1][1] = "往 " + JSONData[0]["DepartureStopNameZh"];
        }
        // console.log(routeHeadsign);
        $d.resolve();
    });
    return $d.promise();
}

function getBusData() {
    let $d = $.Deferred();
    let url;

    //取得預估到站資料
    if(city === "InterCity") {
        url = "https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/InterCity/" + queryString;
    }
    else {
        url = "https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/" + city + "/" + queryString;
    }

    $.when(getJSONData(url)).done(function (JSONData) {
        // console.log(JSONData);
        for(let i = 0; i < routeHeadsign.length; i++) {
            let subRouteData = [];
            $.each(JSONData, function(index, item) {
                if(item["Direction"] === routeHeadsign[i][0]) {
                    subRouteData.push(item);
                }
            });
            sortJSONData(subRouteData);
            estimatedTime.push(subRouteData);
        }
        // console.log(estimatedTime);
        $d.resolve();
    });
    return $d.promise();
}

//印出子路線資料
function printBusData() {
    $("#BusData").empty();
    $("#subRouteHeadsign").text(routeHeadsign[subRouteNum][1]);
    let lastPlate = "";
    $.each(estimatedTime[subRouteNum], function(index, element) {
        let statusString = "";
        // console.log(element);
        if(element["PlateNumb"] !== "" && element["PlateNumb"] !== "-1" && element["PlateNumb"] !== lastPlate) {
            statusString = element["PlateNumb"];
        }
        if(element["EstimateTime"] > 60) {
            statusString += " " + Math.floor(element["EstimateTime"] / 60) + "分";
        }
        else if(element["EstimateTime"] > 0 || statusString !== "") {
            statusString += " 進站中";
        }
        else if(element["getStopStatus"] === "3") {
            statusString += "末班駛離";
        }
        else {
            statusString += "尚未發車";
        }
        $("#BusData").append('<div><span class="stop">' + element["StopName"]["Zh_tw"] + '</span><span class="time">' + statusString + "</span></div>");
        lastPlate = element["PlateNumb"];
    });
}

//資料排序
function sortJSONData(JSONData) {
    return JSONData.sort(function(a, b) {
        let x, y;
        x = a["StopSequence"];
        y = b["StopSequence"];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}
