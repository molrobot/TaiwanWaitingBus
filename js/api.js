function getJSONData(url) {
    return $.ajax({
        type: 'GET',
        url: url,
        dataType: 'json',
        headers: getAuthorizationHeader(),
        complete: function (data, status) {
            // console.log(status);
        }
    });
}

function getAuthorizationHeader() {
    let AppID = 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF';
    let AppKey = 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF';

    let UTCString = new Date().toUTCString();
    let ShaObj = new jsSHA('SHA-1', 'TEXT');
    ShaObj.setHMACKey(AppKey, 'TEXT');
    ShaObj.update('x-date: ' + UTCString);
    let HMAC = ShaObj.getHMAC('B64');
    let Authorization = 'hmac username=\"' + AppID + '\", algorithm=\"hmac-sha1\", headers=\"x-date\", signature=\"' + HMAC + '\"';

    return {'Authorization': Authorization, 'X-Date': UTCString, /*'Accept-Encoding': 'gzip'*/};
    //如果要將js運行在伺服器，可額外加入 'Accept-Encoding': 'gzip'，要求壓縮以減少網路傳輸資料量
}