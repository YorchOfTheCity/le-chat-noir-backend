import * as mongoose from 'mongoose'

// 1) CLASS
export class User {

  constructor(public name: string, public email: string, public pwdHash: string){}
  /* any method would be defined here*/
  // foo(): string {
  //    return this.name.uppercase() // whatever
  // }
}

// no necessary to export the schema (keep it private to the module)
var schema = new mongoose.Schema({
  name: { required: true, type: String, lowercase: true, index: { unique: true } },
  email: { required: true, type: String, lowercase: true, index: { unique: true } },
  pwdHash: { required: true, type: String}
})
// register each method at schema
// schema.method('foo', User.prototype.foo)

// 2) Document
export interface UserDocument extends User, mongoose.Document { }

// 3) MODEL
export const UsersModel = mongoose.model<UserDocument>('User', schema)