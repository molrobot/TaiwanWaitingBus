//網頁載入執行
$(function () {
    // 城市名稱、路線名稱
    let city, routeName;

    // 下拉式選單新增城市名稱
    $.each(CityList, function (index, item) {
        $("#SelectCity").append($('<option>', {
            value: item,
            text : index
        }));
    });

    // 下拉式選單改變事件
    $("#SelectCity").on("change", function() {
        city = $(this).val();
        $("input#RouteName").val("");
        routeName = "";
        $("#RouteData").empty();
        getRouteData(city);
    });

    // 模糊搜尋輸入事件
    $("input#RouteName").keyup(function() {
        routeName = $(this).val();
        if(city !== "")
            searchRouteData(routeName);
    });

    // 首次執行，設定桃園市
    city = "Taoyuan";
    $("#SelectCity option[value=" + city + "]").attr("selected", "true");
    getRouteData(city);
});

// 取得所有路線資料
function getRouteData(city) {
    let url;
    if(city === "InterCity") {
        url = "https://ptx.transportdata.tw/MOTC/v2/Bus/Route/InterCity?$format=JSON";
    }
    else{
        url = "https://ptx.transportdata.tw/MOTC/v2/Bus/Route/City/" + city + "?$format=JSON";
    }

    // 抓取JSON資料並印出
    // 方式1
    // Promise.all([getJSONData(searchUrl)]).then((JSONData) => {
    //     console.log(JSONData);
    // });

    // 方式2
    $.when(getJSONData(url)).done(function (JSONData) {
        // console.log(JSONData);
        let routeListData = sortJSONData(JSONData), headsign;
        $.each(routeListData, function(index, element) {
            let routeName = element["RouteName"]["Zh_tw"];
            let link = "bus.html?city=" + city + "&route=" + routeName;
            // console.log(link);

            // 部分縣市Headsign欄位可能為空，需要判斷
            if(element["SubRoutes"][0]["Headsign"] === undefined || element["SubRoutes"][0]["Headsign"] === routeName)
                headsign = element["DepartureStopNameZh"] + " - " + element["DestinationStopNameZh"];
            else
                headsign = element["SubRoutes"][0]["Headsign"];
            $("#RouteData").append('<a target="_bus" href="' + link + '" class="list-group-item link-color">' + routeName + "<br>" + headsign + "</a>");
        });
    });
}

// 模糊搜尋路線
function searchRouteData(routeName) {
    $.each($("#RouteData").children() ,function(index, item) {
        if($(item).text().indexOf(routeName) === -1){
            $(item).hide();
        }else{
            $(item).show();
        }
    });
}

// 資料排序
function sortJSONData(JSONData) {
    return JSONData.sort(function(a, b) {
        let x, y;
        x = a["RouteName"]["Zh_tw"];
        y = b["RouteName"]["Zh_tw"];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}
