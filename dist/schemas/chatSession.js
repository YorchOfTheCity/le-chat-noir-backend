"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
class Messages {
    constructor(date, sender, message) {
        this.date = date;
        this.sender = sender;
        this.message = message;
    }
}
exports.Messages = Messages;
class ChatSession {
    constructor(ownerEmail // User that can view this document
        , createDate // TODO: Check if mongoose supports date obj
        , chatAdmin // User who created the chat session and can add/kick users
        , attendeeEmails // Users who were in the chat session
        , messages) {
        this.ownerEmail = ownerEmail; // User that can view this document
        this.createDate = createDate; // TODO: Check if mongoose supports date obj
        this.chatAdmin = chatAdmin; // User who created the chat session and can add/kick users
        this.attendeeEmails = attendeeEmails; // Users who were in the chat session
        this.messages = messages;
    }
}
exports.ChatSession = ChatSession;
// no necessary to export the schema (keep it private to the module)
var schema = new mongoose.Schema({
    ownerEmail: { required: true, type: String },
    createDate: { required: true, type: Number },
    chatAdmin: { required: true, type: String },
    attendeeEmails: { required: true, type: String },
    messages: { type: [String] }
});
// 3) MODEL
exports.ChatSessionModel = mongoose.model('ChatSession', schema);
//# sourceMappingURL=chatSession.js.map