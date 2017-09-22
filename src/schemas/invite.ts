import * as mongoose from 'mongoose'

export class Invite {

  constructor(public name: string, public contact: string, public accept?: boolean){}
  /* any method would be defined here*/
  // foo(): string {
  //    return this.name.uppercase() // whatever
  // }
}

// no necessary to export the schema (keep it private to the module)
var schema = new mongoose.Schema({
  name: { required: true, type: String, lowercase: true },
  contact: { required: true, type: String, lowercase: true },
  accept: { type: Boolean }
})
// register each method at schema
// schema.method('foo', User.prototype.foo)

// 2) Document
export interface InviteDocument extends Invite, mongoose.Document { }

// 3) MODEL
export const InviteModel = mongoose.model<InviteDocument>('Invite', schema)