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