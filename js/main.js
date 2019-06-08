var Data, City, RouteName;
//JSON資料、城市名稱、路線名稱

//網頁載入執行
$(function () {
    data = '';
    City = '';
    RouteName = '';
    
    //下拉式選單新增城市名稱
    for(var key in CityList){
        $("#SelectCity").append('<option value="' + CityList[key] + '">' + key + "</option>");
    }
    
    //下拉式選單改變事件
    $("#SelectCity").on("change", function() {
        City = $(this).val();
        $("input#RouteName").val("");
        RouteName = "";
        $("#RouteData").empty();
        getRouteData();
    });
    
    //輸入事件
    $("input#RouteName").keyup(function() {
        RouteName = $(this).val();
        if(City != "")
            searchRouteData();
    });
    
    /*
    $("input#RouteName").on({
        keydown: function(e) {
            if (e.which === 32)
                return false;
        },
        change: function() {
            this.value = this.value.replace(/\s/g, "");
        }
    });*/
    
    //首次執行，設定桃園市
    City="Taoyuan";
    $("#SelectCity option[value=" + City + "]").attr("selected", "true");
    getRouteData();
});

//url = "https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/" + City + "/" + RouteName + "?$filter=RouteName%2FZh_tw%20eq%20'" + RouteName + "'&$format=JSON";

//模糊搜尋路線
function searchRouteData() {
    var RouteData = $("#RouteData");
    $.each(RouteData.children() ,function(index, element) {
        if($(element).attr("value").search(RouteName) == -1){
            $(element).hide();
        }else{
            $(element).show();
        }
    });
}

//取得所有路線資料
function getRouteData() {
    if(City == "InterCity") {
        url = "https://ptx.transportdata.tw/MOTC/v2/Bus/Route/InterCity?$format=JSON";
    }
    else{
        url = "https://ptx.transportdata.tw/MOTC/v2/Bus/Route/City/" + City + "?$format=JSON";
    }
    
    //抓取JSON資料並印出
    $.getJSON(url, function(JSONData) {
        Data = sortJSONData(JSONData, "RouteName", "Zh_tw");
        $.each(Data, function(index, element) {
            //部分縣市Headsign欄位可能為空，需要判斷
            if(element["SubRoutes"][0]["Headsign"] == undefined || element["SubRoutes"][0]["Headsign"] == element["RouteName"]["Zh_tw"]) {
                $("#RouteData").append('<a href="#" value="' + element["RouteName"]["Zh_tw"] + '" class="list-group-item link-color">' + element["RouteName"]["Zh_tw"] + "<br>" + element["DepartureStopNameZh"] + ' - ' + element["DestinationStopNameZh"] + '</a>');
            }else {
                $("#RouteData").append('<a href="#" value="' + element["RouteName"]["Zh_tw"] + '" class="list-group-item link-color">' + element["RouteName"]["Zh_tw"] + "<br>" + element["SubRoutes"][0]["Headsign"] + '</a>');
            }
        });
    });
}

//資料排序
function sortJSONData(JSONData, key, key2) {
    return JSONData.sort(function(a, b) {
        var x, y;
        if(key2 == "")
            x = a[key], y = b[key];
        else
            x = a[key][key2], y = b[key][key2];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}
