import * as mongoose from 'mongoose'

export class Messages {
  constructor(public date: string, public sender: string, public message: string){}
}

export class ChatSession {
  constructor(public ownerEmail: string // User that can view this document
              ,public createDate: number // TODO: Check if mongoose supports date obj
              ,public chatAdmin: string // User who created the chat session and can add/kick users
              ,public attendeeEmails: string[] // Users who were in the chat session
              ,public messages: Messages
  ){}
  
}

// no necessary to export the schema (keep it private to the module)
var schema = new mongoose.Schema({
  ownerEmail: { required: true, type: String },
  createDate: { required: true, type: Number },
  chatAdmin: { required: true, type: String },
  attendeeEmails: { required: true, type: String },
  messages: { type: [String] }
})

// register each method at schema
// schema.method('foo', User.prototype.foo)

// 2) Document
export interface ChatSessionDocument extends ChatSession, mongoose.Document { }

// 3) MODEL
export const ChatSessionModel = mongoose.model<ChatSessionDocument>('ChatSession', schema);