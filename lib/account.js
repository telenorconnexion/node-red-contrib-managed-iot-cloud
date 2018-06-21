module.exports = function(RED) {
  function AccountNode(config) {
    var node = this;
    RED.nodes.createNode(node, config);
    var AWS = require("aws-sdk");
    var request = require("request");
    var manifestBaseUrl = '';
    var refreshToken = null;
    var accessToken = null;
    var region = null;
    var identityPool = null;
    var userPool = null;
    var retries = 0;

    function authenticateUser(invoke, config, callback){
      var payload = {
        action: 'LOGIN',
        attributes: {
          userName: config.username,
          password: config.password
        }
      };
      invoke("AuthLambda", payload, callback);
    }
    function setupAWSCredentials(){
      AWS.config.region = region;
      AWS.config.credentials = new AWS.CognitoIdentityCredentials({ IdentityPoolId: identityPool});
    }
    function loginToAWS(token, cb){
      AWS.config.credentials.params.Logins = {['cognito-idp.' + region + '.amazonaws.com/' + userPool]: token};
      AWS.config.credentials.expired = true;
      AWS.config.credentials.get(function(err) {
        if(err) console.log('AWS.config.credentials.get err', err);
        cb(err);
      });
    }
    function refreshAccessToken(callback){
      setupAWSCredentials(region);
      var payload = {
        action: 'REFRESH',
        attributes: {refreshToken: refreshToken}
      };
      console.log("refreshAccessToken trying to refresh using", payload);
      node.invoke("AuthLambda", payload, function(err, data){
        console.log("AuthLambda refreshToken", err, data);

        refreshToken = data.credentials.refreshToken;
        accessToken = data.credentials.token;
        loginToAWS(data.credentials.token, function(loginErr){
          if(loginErr) {
            node.emit("error", loginErr);
            callback(loginErr);
          } else {
            node.emit("login");
            callback(loginErr, data);
          }
        });
      });
    }
    function getManifest(url, callback){
      request(url, function(err, res, body){
        if(!err && body) callback(null, JSON.parse(body));
        else callback(err);
      });
    }

    function createInvokeFunction (manifest, endpoint, payload, callback) {
      if (retries > 5) callback('Has retried connection too many times', null);
      else if (!manifest.hasOwnProperty(endpoint)) callback('Connection to API failed', null);
      else {
        var params = {
          FunctionName: manifest[endpoint],
          Payload: JSON.stringify(payload)
        };
        var lambda = new AWS.Lambda();
        lambda.invoke(params, function(err, res) {
          if (!err) {
            retries = 0;
            var payload = JSON.parse(res.Payload);
            if(!payload) {
              callback('No payload in res: ' + res, null);
              return;
            }
            if (!payload.errorMessage) callback(null, payload);
            else callback(JSON.parse(payload.errorMessage));
          } else {
            if(err.code === 'CredentialsError' || err.code === 'NotAuthorizedException'){
              console.log('err.code', err.code, 'will refreshAccessToken with', refreshToken);
              refreshAccessToken(function(refreshErr, refreshData){
                console.log('refreshAccessToken responded with', refreshErr, refreshData);
                retries = retries + 1;
                createInvokeFunction(manifest, endpoint, payload, callback);
              });
            } else {
              retries = 0;
              callback(err);
            }
          }
        });
      }
    };

    var manifestUrl = config.manifesturl + '/prod/manifest/?hostname=' + config.url;
    getManifest(manifestUrl, function(err, manifest){
      if(err) node.emit("error", err);
      else {
        node.invoke = createInvokeFunction.bind(null, manifest);
        identityPool = manifest.IdentityPool;
        region = manifest.Region;
        userPool = manifest.UserPool;

        setupAWSCredentials();
        authenticateUser(node.invoke.bind(null), config, function(err, res){
          if(err) node.emit("error", err);
          else {
            refreshToken = res.credentials.refreshToken;
            accessToken = res.credentials.token;
            loginToAWS(res.credentials.token, function(err){
              if(err) node.emit("error", err);
              else node.emit("login");
            });
          }
        });
      }
    });
  }
  RED.nodes.registerType("managed-iot-cloud-account", AccountNode);
}
