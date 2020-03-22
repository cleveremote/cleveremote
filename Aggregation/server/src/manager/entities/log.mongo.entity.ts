import * as mongoose from "mongoose";

export interface LogMongoEntity extends mongoose.Document {
    source: string;
    module: string;
    value: string;
    date: Date;
}

export const logSchema = new mongoose.Schema({
    source: { type: String, required: true },
    module: { type: String, required: true },
    value: { type: String, required: true },
    date: { type: Date, required: true }
});

export const log = mongoose.model<LogMongoEntity>("Log", logSchema);
