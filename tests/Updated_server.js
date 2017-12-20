
const dgram = require('dgram');
const server = dgram.createSocket('udp4');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/ID";
var date = new Date();


/*
MongoClient.connect(url, function(err, db) {
  // Paste the following examples here

  db.close();
});
*/
//--------------------------------------------------------------------------------------------------DB_functions
function insertToDb(myobj)
{

  MongoClient.connect(url, function(err, db)
  {
    db.collection("C6").insertOne(myobj).then(function(result)
    {
      date = Date();
      console.log(`${date} ID ${myobj.device_info.c6_id} added`);
      db.close();
    })
  });

}
function findSome(limit,ip,port)
{
  MongoClient.connect(url, function(err, db)
    {
        db.collection('C6').find().limit(limit).toArray(function(err, result)
          {
              if (err) throw err;
              db.close();
              if(ip ==  0 || port ==  0){console.log(result);}
              else
                {
                result.forEach(function(element)
                  {
                    server.send(JSON.stringify(element), port, ip);
                  });
                }
            //add random here
          });
      });
}
function FindByID(idid,JSon_app,ip,port)
{
  MongoClient.connect(url, function(err, db)
  {
    db.collection('C6').find({"device_info.c6_id":idid},
    { _id: false, "device_info.c6_id": true,"device_info.version": true,"connection.ip": true, "connection.port": true, })
    .toArray(function(err, result)
      {
        if (err) throw err;
        try
        {
          if(JSon_app != ""){server.send(JSon_app,result[0].connection.port ,result[0].connection.ip  )}
          server.send(JSON.stringify(result[0]), port, ip);
        }
        catch(e){server.send("Sorry, No such device", port, ip);}
        db.close();
      });
    });
}
function C6_insert(ID, ip ,port)
{
  var ret;
  MongoClient.connect(url, function(err, db)
    {
        db.collection('C6').find({"device_info.c6_id":ID},
        { _id: false, "device_info.c6_id": true,"connection.ip": true, "connection.port": true, })
        .toArray(function(err, result)
          {
              if (err) throw err;
              try
              {
                  if(result[0].connection.ip  != ip || result[0].connection.port != port )
                    {
                      date = Date();
                      console.log(`${date} The ip or port for "ID - ${ID}" was changed`);

                        var newvalues = { $set: { "connection.ip": ip, "connection.port" :port } };
                        db.collection("C6").updateOne({"device_info.c6_id":ID}, newvalues, function(err, res) {
                        if (err) throw err;

                    });}

                }
              catch(e)
              {
                var JSON_obj =
                  {
                    "device_info":
                    {"c6_id":ID.toString(),"version":"0.2v"},
                    "connection":
                    {"ip":ip,"port":port}
                  };//can be created, and passed to the function
                insertToDb(JSON_obj)
              }
              db.close();
          });
      });

}

server.on('error', (err) =>
  {
      date = Date();
      console.log(`${date} server error:\n${err.stack}`);
      server.close();
  });
  //
//--------------------------------------------------------------------------------------------------------
server.on('message', (msg, rinfo) =>
  {
    switch (msg[0])
    {
        case 0x01:
              C6_insert(msg.slice(1).toString('hex'),rinfo.address,rinfo.port);
            break;
        case 0x03:
              var chars = rinfo.address.split('.');
              const buf = new Buffer.from([2,chars[0],chars[1],chars[2],chars[3],(rinfo.port>>8)&0xff,rinfo.port&0xff]);
              FindByID(msg.slice(1).toString('hex'),buf,rinfo.address,rinfo.port);
            break;
        case 0x08:
               findSome(msg[1],rinfo.address, rinfo.port);
               console.log(`${Date()} server got: ${msg.toString('hex')} from ${rinfo.address}:${rinfo.port}`);
             break;
        case 0x09:
               FindByID(msg.slice(1).toString('hex'),"",rinfo.address, rinfo.port);
               console.log(`${Date()} server got: ${msg.toString('hex')} from ${rinfo.address}:${rinfo.port}`);
            break;
        default:
                console.log(`${Date()} server got: ${msg.toString('hex')} from ${rinfo.address}:${rinfo.port}`);
            break;
  }


  });
//------------------------------------------------------------------------------------------
server.on('listening', () =>
  {
      const address = server.address();
  });

server.bind({
      port: 444,
     exclusive: true
});
