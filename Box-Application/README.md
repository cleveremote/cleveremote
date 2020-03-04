 sudo  sshfs server@192.168.1.30:/home/server/devclv/cleveremote/Box-Application/ /mnt/shared-dev -o nonempty
 when not in sudo mode
 
///////////// XBEE
sampling
Packet recieved: { type: 146,
  remote64: '0013a20040c0497d',
  remote16: '21be',
  receiveOptions: 1,
  digitalSamples: { DIO4: 1, DIO11: 1, DIO12: 0 },
  analogSamples: { AD1: 606, AD2: 612, AD3: 623 },
  numSamples: 1 }


kafka conception
---------------
server has custom publisher and roudrobin consumer.
box has cyclic publish and custom consumer
/mnt/myFolder/dist
git problems

cd /home/server/devclv/cleveremote/ <path-to-repo>
cd .git/objects
sudo chown -R server:server * server => username

Type ORM
---------------
npm run typeorm migration:run / typeorm migration:revert
npm run typeorm migration:create -- -n migrationNameHere
typeorm-model-generator -h localhost -d  cleverTest -u test -x 1234 -e postgres -o "./src/entity" -s public

free port on failure
---------------
netstat -tunap | grep 3000
kill -9 process_id

Firewall
---------------
sudo ufw allow 32771/tcp
sudo ufw allow 32770/tcp

sudo apt-get remove docker-compose
VERSION=$(curl --silent https://api.github.com/repos/docker/compose/releases/latest | jq .name -r)
DESTINATION=/usr/local/bin/docker-compose
sudo curl -L https://github.com/docker/compose/releases/download/${VERSION}/docker-compose-$(uname -s)-$(uname -m) -o $DESTINATION
sudo chmod 755 $DESTINATION
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose


Kafka topics
---------------
Server 
dbsync_aggregator subscribe
logsync_aggregator subscribe
action_idbox publish
dbsync_idbox publish

box
action_idbox subscribe
dbsync_idbox subscribe
dbsync_aggregator publish
logsync_aggregator publish


kafka tools
---------------
cd C:\Users\dell\Downloads\kafka_2.11-0.10.2.0\kafka_2.11-0.10.2.0\bin\windows
.\kafka-topics.bat --zookeeper 192.168.1.30:2181 --delete --topic topic1_test
.\kafka-console-consumer.bat --bootstrap-server 192.168.1.30:32771,192.168.1.30:32770 --topic topic-mitosis
.\kafka-console-producer.bat  --broker-list 192.168.1.30:32771,192.168.1.30:32770 --topic topic1_test
.\kafka-topics.bat --list --zookeeper 192.168.1.30:2181
.\kafka-consumer-groups.bat --zookeeper 192.168.1.30:2181 --group count_errors --describe
.\kafka-topics.bat --alter --zookeeper 192.168.1.30:2181 --topic topic1_test --partitions 10


For dockerized kafka/zookeeper

docker ps
find you zookeeper container id

docker exec -it <id> bash

cd bin

./zkCli.sh

ls /brokers/topics

Kafka topics env conf
---------------
Declare 
refacto put one host for all 
TYPE_CONFIG = BOX/AGGREGATOR

KAFKA_TOPICS = "dbsync_aggregator.subscribe logsync_aggregator.subscribe action_idbox.publish dbsync_idbox.publish"

then in the kafka.service 
create list of topic to subscribe.
create list of topic to publish to.
idbox as template.

create dispatch.service.ts

check if is it first connection.
check if box is connected.  

@types/uuid - npm

Prerequisites
---------------
Make sure to have the following installed on your machine:
- mongoDB (make sure to have mongod running locally when running the code on a local machine)
- Node > 8.9 (!important)

Run the code
---------------
- Install dependencies. From root directory run:
```
npm run install:dependencies
```
- Create .env file in server folder.
- Copy the following lines to .env file.
```
PORT=3000
DEV_DB='mongodb://localhost/boilerplateDb'
NODE_ENV='development'
JWT_SECRET='change_this_example_secret'
```
- (Optional) Add the following to .env file if you want to run MongoDB with cloud provider (e.g. Mlab):
```
PROD_DB={{the URI provided by mongoDB could providers, e.g. Mlab}}
```
- Run the application by starting the client and server separately:
```
cd server; npm start
```
```
cd client; npm start
```

This will create the database locally. By running the server with the command:
```
npm run start:cloud
```
The server will run in production environment. In addition the server will try to connect to mongoDB form cloud provider.
## Deploy to Heroku
- Demo: https://mean-ts-auth.herokuapp.com
- Create a Heroku account and create a new project.
- Select the Deployment method with GitHub.
- Find the repository and connect Heroku with the Github repository you would like to deploy.
- Set up the enviroment variable in settings section in Heroku, for that you will need these variables:
```bash
JWT_SECRET # the secret string for Json Web Token
PROD_DB # the remote mongo database (e.g. Mlab)
TZ # time zone, e.g. can be Netherlands/Amsterdam
```
- After running deploy Heroku will build the application and deploy.
- In addition you can select "Enable Auto Deploy" and select a branch from the repo, this will make sure that every time you commit to the branch Heroku will reinitiate deployment. 
## Technology stack
MEAN Stack with TypeScript
- MongoDB
- Angular 6+
- Express
- Node > 8.9
- TypeScript
- JavaScript

## Creating a new endpoint
- Define your endpoint route in `server/src/api/routes/apiRoutes.ts`, example:
```TypeScript
app.route('/api/test/').get(apiController.test_get);
```
- Add function to handle the endpoint in `server/src/api/controllers/apiController.ts`, example:
```TypeScript
exports.test_get = (req: any, res: any) => {
    testCtrl.getAll(req, res);
};
```

## Creating a new model
- Add the new model to `server/src/api/models`, example:
```TypeScript
import mongoose = require('mongoose');
import {Schema, Document} from 'mongoose';

export interface ITest {
    name: string;
    email: string;
    type: number;
}

const TestSchema: Schema = new Schema({
    name: String,
    email: String,
    type: Number,
});

export interface ITestModel extends ITest, Document {
}

const TestModel = mongoose.model<ITestModel>('Test', TestSchema);

export default TestModel;
```
- Add controller for your model to `server/src/api/controllers`,
 the controller has to inherit from `baseController`, example:
```TypeScript
import Base from './baseController';

export default class TestClass<T extends any> extends Base<T> {
    constructor(model: T) {
        super(model);
    }

    public insert = (req: any, res: any) => {
        const obj = new this.model(req.body);
        obj.save((err: any, item: any) => {
            if (err) {
                return console.error(err);
            }
            res.status(200).json(item);
        });
    }
}
```

 function _ExplicitAdressing() {
        console.log("nadime coucou");
        const broadcast = false;
        var frame = {
            type: 0x11, // xbee_api.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST
            id: 0x01, // optional, nextFrameId() is called per default
            destination64: "0013A20040C04982", // default is broadcast address
            destination16: "fffe", // default is "fffe" (unknown/broadcast)
            sourceEndpoint: 0x00,
            destinationEndpoint: 0x00,
            clusterId: "0032",
            profileId: "0000",
            broadcastRadius: 0x00, // optional, 0x00 is default
            options: 0x00, // optional, 0x00 is default
            data: "0100" // Can either be string or byte array.
        },
            responseStream;

        if (debug) {
            console.log("Sending", command, "to", destination64, "with parameter", commandParameter || []);
        }

        responseStream = _sendFrameStreamResponse(frame, 5000, xbee_api.constants.FRAME_TYPE.ZIGBEE_EXPLICIT_RX).pipe(
            rx.operators.flatMap(function (frame) {
                if (frame.commandStatus === xbee_api.constants.COMMAND_STATUS.REMOTE_CMD_TRANS_FAILURE) {
                    // if there was a remote command transmission failure, throw error
                    return rx.throwError(new Error(xbee_api.constants.COMMAND_STATUS[frame.commandStatus]));
                }
                // any other response is returned
                return rx.of(frame);
            })
        );

        if (broadcast) {
            return responseStream;
        } else {
            // if not broadcast, there can be only one response packet
            return responseStream.pipe(rx.operators.take(1));
        }
    }


    7B 
00 01 00 01
34 12 00 00 00 00 00 00
7D 49 C0 40 00 A2 13 00
3B 9A
35 02 
0F 76

response of the router 
7D 
00 02 00 02 
34 12 00 00 00 00 00 00
82 49 C0 40 00 A2 13 00
00 00
34 02 
00 4F 

34 12 00 00 00 00 00 00
F3 71 B9 40 00 A2 13 00 
8A 5C
12 00
01 FF


coordinator 34                     110100 parent
router 35                             110101
end device 12                      01001



get all defices with ND 
devices[] add manually coordinator information

request rtg info 0032
rtg table 
lqi               0031



http://ftp1.digi.com/support/images/APP_NOTE_XBee_ZigBee_Device_Profile.pdf
Explicite adressing commande frame 0032
7E 00 16 11 7A 00 13 A2 00 40 C0 49 82 FF FE 00 00 00 32 00 00 00 00 7A 1E 2D
response 
7E 00 07 8B 7A 00 00 00 00 00 FA
ressponse explicite RX indicator 
7E 00 49 91 00 13 A2 00 40 C0 49 82 00 00 00 00 80 32 00 00 01 
7A 00 28 1E 0A 00 00 03 00 00 00 00 03 00 00 00 00 03 00 00 00 00 03 00 00 00 00 03 00 00 00 00 03 00 00 00 00 03 00 00 00 00 03 00 00 00 00 03 00 00 00 00 03 00 00 53

Explicite adressing commande frame 0031
7E 00 07 8B 7A 00 00 00 00 00 FA
response 
7E 00 07 8B 7A 00 00 00 00 00 FA
ressponse explicite RX indicator 8031
7E 00 2D 91 00 13 A2 00 40 C0 49 82 00 00 00 00 80 31 00 00 01 
7B 00 01 00 01 34 12 00 00 00 00 00 00 
7D 49 C0 40 00 A2 13 00
3B 9A 35 02 0F 76 6D


0011010000010010000000000000000000000000000000000000000000000000
1000001001001001110000000100000000000000101000100001001100000000
0000000000000000
00
11
010
0
00
000010
00000000
11111110
0011010000010010000000000000000000000000000000000000000000000000
1111001101110001101110010100000000000000101000100001001100000000
1111110111001111
00
01
001
0
00
000000
00000001
11111111


00110100


01000011 34 coor



timeoutset in remotecommand option 02 to ac apply command

digital out high 5
digital out low 4
digital input 3
analog 2


IR =>  *1ms => valeur hexadecimal
IC => 0xFFFF FOR all digital dio
v+ => 0,0x0700-0x0c00 => 2100 - 3600

sleep mode
SM => 5
SO 0 
SP period *10ms => hexavalue
SN periods of sleep
ST time before sleep





-get modules
-save config
-save transcienvers
-get allPacket if a packet is recieved check adress if adress not exists exec scan. 



