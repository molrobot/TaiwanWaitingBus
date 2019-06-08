var Data, City, RouteName;

$(function () {
    data = '';
    City = '';
    RouteName = '';
    
    for(var key in CityList){
        $("#SelectCity").append('<option value="' + CityList[key] + '">' + key + "</option>");
    }
    $("#SelectCity option[value=Taoyuan]").attr("selected","true");
    City="Taoyuan";
    getBusData();
    $("#SelectCity").on("change", function() {
        City = $(this).val();
        $("#RouteData").empty();
        getBusData();
    });
    
    $("input#RouteName").keyup(function() {
        RouteName = $(this).val();
        $("#RouteData").empty();
        if(City != "")
            getBusData();
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
});

function getBusData() {
    console.log(City + ' ' + RouteName);
    if(RouteName == '') {
        url = "https://ptx.transportdata.tw/MOTC/v2/Bus/Route/City/" + City + "?$format=JSON";
        $.getJSON(url, function(JSONData) {
            Data = sortJSONData(JSONData, "RouteName", "Zh_tw");
            $.each(Data, function(index, element) {
                $("#RouteData").append('<a href="#" class="list-group-item link-color">' + element["RouteName"]["Zh_tw"] + '</a>');
            });
        });

    }
    else {
        //url = "https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/" + City + "/" + RouteName + "?$filter=RouteName%2FZh_tw%20eq%20'" + RouteName + "'&$format=JSON";
        url = "https://ptx.transportdata.tw/MOTC/v2/Bus/Route/City/" + City + "/" + RouteName + "?$format=JSON";
        $.getJSON(url, function(JSONData) {
            Data = sortJSONData(JSONData, "RouteName", "Zh_tw");
            $.each(Data, function(index, element) {
                $("#RouteData").append('<a href="#" class="list-group-item link-color">' + element["RouteName"]["Zh_tw"] + "<br>" + element["DepartureStopNameZh"] + "->" + element["DestinationStopNameZh"] + '</a>');
            });
        });
    }
}

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

/*
$(function () {
    $.ajax({
        type: 'GET',
        url: 'https://ptx.transportdata.tw/MOTC/v2/Rail/TRA/Station?$top=10&$format=JSON',
        dataType: 'json',
        headers: GetAuthorizationHeader(),
        success: function (Data) {
            $('body').text(JSON.stringify(Data));
        }
    });
});
*/

function GetAuthorizationHeader() {
    var AppID = 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF';
    var AppKey = 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF';

    var GMTString = new Date().toGMTString();
    var ShaObj = new jsSHA('SHA-1', 'TEXT');
    ShaObj.setHMACKey(AppKey, 'TEXT');
    ShaObj.update('x-date: ' + GMTString);
    var HMAC = ShaObj.getHMAC('B64');
    var Authorization = 'hmac username=\"' + AppID + '\", algorithm=\"hmac-sha1\", headers=\"x-date\", signature=\"' + HMAC + '\"';

    return { 'Authorization': Authorization, 'X-Date': GMTString /*,'Accept-Encoding': 'gzip'*/};
}
