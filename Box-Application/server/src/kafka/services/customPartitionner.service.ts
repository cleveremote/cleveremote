const VERSION = 0;
import { _ } from 'lodash';
import * as assert from 'assert';
import { ITopic } from '../../synchronizer/interfaces/entities.interface';

export class CustomPartitionnerService {

    constructor(public topicData: ITopic) {
    }

    public setCustomPartitionner(): any {
        return {
            assign: this.assignRoundRobinRanged.bind(this),
            name: 'rangedRoundrobin',
            version: VERSION
        };
    }

    public assignRoundRobinRanged(topicPartition, groupMembers, callback): any {
        const startRange = this.topicData.partitionTopic.rangePartitions[0];
        const endRange = this.topicData.partitionTopic.rangePartitions[1];
        const rangeArray = _.range(startRange, endRange + 1, 1).map(String);
        for (const key in topicPartition) {
            if (topicPartition.hasOwnProperty(key)) {
                const regex = RegExp('_init_');
                if (!regex.test(key)) {
                    topicPartition[key] = _.intersection(topicPartition[this.topicData.name], rangeArray);
                }
            }
        }

        const _members = _(groupMembers).map('id');
        const members = _members.value().sort();
        const assignment = _members.reduce((obj, id) => {
            obj[id] = [];

            return obj;
        }, {});

        const subscriberMap = groupMembers.reduce((subscribers, member) => {
            subscribers[member.id] = member.subscription;

            return subscribers;
        }, {});

        // layout topic/partitions pairs into a list
        const topicPartitionList = _(topicPartition).map((partitions, topiRes) => {
            const t = 2;

            return partitions.map((partitionRes: any) => {
                const t = 2;

                return {
                    topic: topiRes,
                    partition: partitionRes
                };
            });
        }).flatten().value();


        const assigner = this.cycle(members);

        topicPartitionList.forEach((tp: any) => {
            const topic = tp.topic;
            while (!_.includes(subscriberMap[assigner.peek()], topic)) {
                assigner.next();
            }
            assignment[assigner.next()].push(tp);
        });

        const ret = _.map(assignment, (value, key) => {
            const ret1 = {} as any;
            ret1.memberId = key;
            ret1.topicPartitions = this.groupPartitionsByTopic(value);
            ret1.version = VERSION;

            return ret1;
        });

        callback(undefined, ret);
    }

    public cycle(arr): any {
        let index = -1;
        const len = arr.length;

        return {
            peek: () => arr[(index + 1) % len],
            next: () => {
                index = ++index % len;

                return arr[index];
            }
        };
    }

    public groupPartitionsByTopic(topicPartitions): any {
        assert(Array.isArray(topicPartitions));

        return topicPartitions.reduce((result: any, tp: any) => {
            if (!(tp.topic in result)) {
                result[tp.topic] = [tp.partition];
            } else {
                result[tp.topic].push(tp.partition);
            }

            return result;
        }, {});
    }
}

// module.exports = {
//     assign: assignRoundRobin,
//     name: 'roundrobin',
//     version: VERSION
// };