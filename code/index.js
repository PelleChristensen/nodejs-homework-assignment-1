/*
* Main entrypoint for server
* Creator : Pelle S Christensen 
*/

//dependencies 
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config'); 
var fs = require('fs');

//Creates server for handling incoming http calls
var httpServer = http.createServer(function(req, res){
unifiedServer(req, res);
});

//Set up httpServer to listen to the port defined in the config setting
httpServer.listen(config.httpPort, function(){
    console.log(config.envName +  ' server is available on port '+ config.httpPort);
}); 

//Creates HTTPSServer for handling incoming https calls
//Get key and certificate 
var httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
};
//Creates HTTPSServer for handling incoming https calls
var httpsServer = https.createServer(httpsServerOptions,function(req, res){
    unifiedServer(req, res); 
    });

//Set up listener for https calls and apply the options
httpsServer.listen(config.httpsPort, function(){
    console.log(config.envName + ' server is available on port '+ config.httpsPort);
}); 

//Server logic 
var unifiedServer = function (req, res) {
        
        //set url and parse it
        var parsedURL = url.parse(req.url,true);
        //get path from url
        var path = parsedURL.pathname;
        //trim the incoming path for later use
        var trimmedpath = path.replace(/^\/+|\/+$/g, '');
        var method = req.method.toLowerCase();
        var queryStringObject = parsedURL.query; 
        var headers = req.headers;
    
        //get payload if any 
        var decoder = new StringDecoder('utf-8');
        var buffer = '';
        req.on('data', function(data){
            buffer += decoder.write(data);
        })
    
        req.on('end', function(){
            buffer += decoder.end(); 
            
            //set up handler to match the path trimmed from the path
            var chosenHandler = typeof(router[trimmedpath]) !== 'undefined' ? router[trimmedpath] : handlers.notFound;
            var username = '';
            
            //check if username has been sent as a header 
            //if method is POST
            if(method == 'post')
            {
                //check if parameter 'username' is available. Otherwise set username to 'undefined'
                username = headers['username'] != 'undefined' ? headers['username'] : 'undefined';
            }
            //check if username has been sent as a query
            else if(method == 'get')
            {
                //we know the supposed name of the query parameter. Retrieve it and set username to undefined it it don't exist 
                username = queryStringObject['username'] != 'undefined' ? queryStringObject['username'] :'undefined'; 
            }
 
            var data = {
                'trimmedpath' : trimmedpath,
                'queryStringObject' : queryStringObject, 
                'method' : method, 
                'headers' : headers, 
                'payload' : buffer, 
                'username' : username
            }
    
            chosenHandler(data, function(statusCode,payload){
                statusCode = typeof(statusCode) == 'number' ? statusCode : 200; 
                payload = typeof(payload) == 'object' ? payload : {};
    
                //convert payload to at string
                var payloadString = JSON.stringify(payload);
                res.setHeader('Content-Type','application/json');
                res.writeHead(statusCode);
                res.end(payloadString);
                   
                console.log('Reply: ', statusCode,payloadString);
            })
        })
};

//Definer handlers
var handlers =  {};

handlers.hello = function (data, callback)
{
    callback(200, {'response' : "Hello " + data.username + " and welcome on this specific endpoint"});
}

handlers.notFound = function(data, callback)
{
    callback(404);
};

//define routers 
var router = {
        'hello' :  handlers.hello
};