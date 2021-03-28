$(function () {
    // 城市名稱、路線名稱
    let city, routeName;

    const DB_NAME = "bus_data";
    const DB_VERSION = 2;
    const DB_BUS_LIST = "bus_route_list"

    let db;

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

        openDatabase().then(function (result) {
            console.log(result);
            return getRouteList();
        }).then(function (routeList) {
            console.assert(routeList !== undefined && routeList[0] !== undefined);
            console.log(routeList);
            printRouteList(routeList);
        });
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
    $("#SelectCity").trigger("change");

    function openDatabase() {
        let $d = $.Deferred();
        let request = indexedDB.open(DB_NAME, DB_VERSION)
        request.onsuccess = function (event) {
            db = this.result;
            $d.resolve(this.result);
        }
        request.onerror = function (event) {
            $d.resolve(event.target.errorCode);
        }
        request.onupgradeneeded = function (event) {
            console.log("onupgradeneeded");
            event.currentTarget.result.createObjectStore(
                DB_BUS_LIST, {keyPath: "city", autoIncrement: true});
        }
        return $d;
    }

    function getObjectStore(storeName, mode) {
        let tx = db.transaction(storeName, mode);
        return tx.objectStore(storeName);
    }

    // 取得所有路線資料
    function getRouteList() {
        let $d = $.Deferred();
        let routeList = {};

        let objectStore = getObjectStore(DB_BUS_LIST, "readwrite");
        let request = objectStore.get(city);
        request.onsuccess = function (event) {
            routeList = event.target.result;
            if(routeList === undefined){
                routeList = saveRouteList();
            } else {
                routeList = routeList["data"];
            }
            $d.resolve(routeList);
        };
        request.onerror = function (event) {
            $d.reject(event.target.result + "路線資料取得失敗");
        }
        return $d;
    }

    function saveRouteList() {
        let url;
        if(city === "InterCity") {
            url = "https://ptx.transportdata.tw/MOTC/v2/Bus/Route/InterCity?$format=JSON";
        }
        else{
            url = "https://ptx.transportdata.tw/MOTC/v2/Bus/Route/City/" + city + "?$format=JSON";
        }
        return $.when(getJSONData(url)).done(function (JSONData) {
            // console.log(JSONData);
            let routeList = sortJSONData(JSONData);
            let objectStore = getObjectStore(DB_BUS_LIST, "readwrite");
            let request = objectStore.add({city: city, data: routeList});
            request.onsuccess = function (event) {
                console.log(event.target.result + "路線資料更新成功");
            }
            request.onerror = function (event) {
                console.log(event.target.result + "路線資料更新失敗");
            }
            return routeList;
        });
    }

    function printRouteList(routeList) {
        $.each(routeList, function(index, element) {
            let routeName = element["RouteName"]["Zh_tw"], headsign;
            let link = "bus.html?city=" + city + "&route=" + routeName;
            // console.log(link);

            // 部分縣市Headsign欄位可能為空，需要判斷
            if(element["SubRoutes"][0]["Headsign"] === undefined || element["SubRoutes"][0]["Headsign"] === routeName)
                headsign = element["DepartureStopNameZh"] + " - " + element["DestinationStopNameZh"];
            else
                headsign = element["SubRoutes"][0]["Headsign"];
            $("#RouteData").append('<a target="_bus" href="' + link + '" class="list-group-item link-color">' + routeName + "<br>" + headsign + "</a>");
        });
    }

    // 模糊搜尋路線
    function searchRouteData() {
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
});