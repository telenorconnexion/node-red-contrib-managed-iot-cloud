# Node-RED for Cloud Connect
API and event in+out nodes for Telenor Cloud Connect

## Install and run node-red

Either install node-red globally or locally using `npm install node-red`, `-g` flag for global installation. Start a node-red server by invoking `node-red` from a terminal or from npm scripts.

By default, Node-RED stores your data in the directory `$HOME/.node-red`. To override what directory to use, the `--userDir` / `-u` command-line option can be used:
```
node-red -u ./my-local-storage-directory
```

The node-red interface can now be found at `http://127.0.0.1:1880/`.

### Adding npm packaged nodes

To install an npm-packaged node, you can either install it locally within your user data directory (by default, `$HOME/.node-red`):

```
cd $HOME/.node-red
npm install <npm-package-name>
```
or globally alongside Node-RED:

`sudo npm install -g <npm-package-name>`
You will need to restart Node-RED for it to pick-up the new nodes.

### Adding nodes from local files

To add nodes to your node red server from downloaded files in the `node-red-contrib-cloud-connect`, locate the `lib/` folder and copy its contents (matching `js` and `html` files) to a `nodes/` folder which should be added inside your previously specified `--userDir` folder.

## CC API Node
### Usage Example
The `CC API` function node can be used to connect to a Cloud Connect API. It supports input and output for the APIs.

1. Connect nodes
  - Drag the `CC API` node onto the node-red flow canvas.
  - Connect an `inject` input node to the left of the `CC API` node
  - Connect a `debug` output node to the right of the `CC API` node
2. Double click the `CC API` node
  - Configure a cloud connect account by providing your Cloud Connect URL along with your username and password.
  - Pick an API endpoint to invoke.
3. Double click the `inject` node
  - Provide a correct input json object (see below) to the inject node
  - Make sure to pick the `JSON` payload type
4. Test it!
  - Click Deploy in the upper right corner
  - Wait for the `CC API` connection indicator to turn green
  - Open the debug pane to the right
  - Click the button to the left of the `inject` node and watch your result appear in the debug pane.

### Example payloads for the various endpoints
Further details on parameters and responses are available in our Cloud API documentation

#### Things
```
{
  "action": "FIND",
  "query": {
    "size": 12,
    "query": {
      "match_all": {}
    }
  }
}
```
#### Observations
```
{
  "action": "FIND",
  "query": {
  	"size": 200,
  	"_source": {
      "includes":"state.uptime"
    },
  	"trackScores": false,
  	"query": {
  	  "bool": {
        "must": [
		      {range: { timestamp: { gte: ts_gte, lte: ts_lte }}},
		        //{exists: { field: "state.uptime"}},
		      {term:{thingName:"00000001"}}
        ]
      }
  	},
  	"sort": {
      "timestamp": {
        "order": "desc"
      }
    }
  }
}
```
#### Users

```
{
  "action": "CREATE",
  "attributes": {
    "userName": "the_user@mail.com",
    "firstName": "First",
    "lastName": "Last",
    "email": "first.last@demo.se",
    "phone": "+4631123456",
    "company": "Demo AB",
    "address": "Street 1",
    "zip": "12345",
    "city": "BigCity",
    "country": "Sweden",
    "roleName": "ReadWrite",
    "domainName": "root"
  }
}
```
#### Files
```
{
	"action": 'LIST',
	"attributes": {
  	"bucketName": "ThingFilesBucket",
  	"maxKeys": 10,
  	"prefix": ""
	}
}
```
## CC Event In/Out Nodes
The CC event input/output nodes are used for subscribing and publishing to Cloud Connect mqtt topics. Like the CC API you must give user credentials to be able to use the nodes. The event input/output nodes can only connect to topics that the user has privilege to.

The output node is for publishing onto a mqtt topic and the input node is for subscribing to a 

### Usage example of CC Event Output node
1. Connect output node
  - Drag the `CC Event` node onto the node-red flow canvas.
  - Connect an `inject` input node to the left of the `CC Event` output node
2. Double click the `CC Event` node
  - Configure a cloud connect account by providing your Cloud Connect URL along with your username and password.
  - Add a topic, (at current time of writing the only topic a user can publish to is the `pub` topic, please read the Cloud Connect API documentation for how these are formed)
  - Optionally add a name for your node
3. Double click the `inject` node
  - Provide a correct input json object (see below) to the inject node
  - Make sure to pick the `JSON` payload type
4. Test it!
  - Click Deploy in the upper right corner
  - Wait for the `CC Event` connection indicator to turn green
  - Trigger the inject node
  
  #### Example payload for pub topic
  The `pub` topic only accepts state desired documents, e.g:
  
 ```
  {
  	"state": {
  		"desired" : {
			"color" : { "r" : 99 },
			"engine" : "OFF"
		}
	}
  }
 ```
