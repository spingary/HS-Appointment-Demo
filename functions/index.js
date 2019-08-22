const functions = require('firebase-functions');
const http = require('request');


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
exports.updateSlot = functions.https.onRequest((request, response) => {
    // Check for POST request
    if(request.method !== "POST"){
        response.status(400).send('Please send a POST request');
        return;
    }
    let data = request.body;
    let row_id = 0;
    try {
        row_id = data.properties.appointment_date_time_id.value;
    } catch(err) {
        response.status(400).send('No appointment slot id found.');
        return;
    }
    
    if (typeof(row_id) === undefined || !row_id ) {
        response.status(400).send('No appointment slot id defined.');
    }
        
    let json = JSON.stringify(data);
    let url = 'http://webhook.site/74993339-577f-49fc-bd8a-cef0567a7b49';
    let hapikey = 'a39116a3-33fe-4d9e-98b6-ee8af8ebf064';
    let portal_id = '6298402';
    let hubdb_table_id = '1058500';
    let hubdb_url = 'https://api.hubapi.com/hubdb/api/v2/tables/'+hubdb_table_id;

    // To get the column ID of our Quantity Available column:
    // https://api.hubapi.com/hubdb/api/v2/tables/1058500?portalId=6298402
    //  column id = 1
    // PUT /hubdb/api/v2/tables/:tableId/rows/:rowId/cells/:cellId
    let qty_available_cell_id = 1;
    
    let hubdb_get_row_url = hubdb_url + '/rows/' + row_id + '?hapikey='+hapikey;
    let hubdb_update_row_url = hubdb_url + '/rows/' + row_id + '/cells/' + qty_available_cell_id + '?hapikey='+hapikey;
    let hubdb_publish_url = hubdb_url + '/publish?hapikey='+hapikey;

    http.get({url:hubdb_get_row_url,json:true}, (error,resp,body) => {
        if (!error && resp.statusCode === 200) {
            /* Data example:
                {
                    "id": 12245072310,
                    "createdAt": 1566251682040,
                    "path": null,
                    "name": null,
                    "values": {
                        "1": 4,
                        "2": 1569916800000
                    },
                    "childTableId": 0,
                    "isSoftEditable": false
                }
            */
            let row = body;
            let qty_available = row.values[qty_available_cell_id];
            // Now let's decrement the value
            let new_value = { "value" : --qty_available };
            http.put({url:hubdb_update_row_url,json:new_value}, (error,resp,body) => {
                if (!error && resp.statusCode === 200) {
                    http.put(hubdb_publish_url, (error,resp,body) => {
                        if (!error && resp.statusCode === 200) {
                            response.send('Row ID ' + row_id + ' updated successfully to ' + qty_available + ' and table was published.');
                        } else {
                            response.send('Row ID ' + row_id + ' updated successfully to ' + qty_available + ' but table was NOT able to be published!');
                        }
                    })
                } else {
                    response.status(404).send(error);
//                    response.status(404).send('Cannot update value on row ID ' + row_id + ': ' + hubdb_update_row_url + ':' + JSON.stringify(new_value));
                }
            
            });
        } else {
            // HS sends a 404 if row is not found
            response.status(404).send('Cannot find row ID ' + row_id);
        }        
    }); 

    //response.send("Hello Post from Firebase!" + json);
});
