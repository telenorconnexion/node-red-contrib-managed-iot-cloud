module.exports = function(RED) {
  var AWS = require("aws-sdk");

  function ApiNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.account = RED.nodes.getNode(config.account);
    node.endpoint = config.endpoint;

    node.status({ fill:"red", shape:"ring", text:"disconnected" });
    node.account.on("login",function() {
      // node.lambda = new AWS.Lambda();
      node.status({ fill:"green", shape:"dot", text:"connected" });
    });
    node.account.on("error", function(err) {
      node.status({ fill:"red", shape:"ring", text:"login failed" });
      node.send({payload: err});
    });

    node.on('input', function(msg) {
      node.account.invoke(node.endpoint, msg.payload, function(err, res) {
        if(err) console.log(err, res);
        node.send({payload: err || res});
      });
    });
  }
  RED.nodes.registerType("managed-iot-cloud-api", ApiNode);
}
