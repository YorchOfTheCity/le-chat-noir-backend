import * as socketIO from 'socket.io';
import * as Rx from 'rxjs';

import { auth } from './authentication';
import { User, UserDocument } from './schemas/user';
import { Invite, InviteDocument } from './schemas/invite';
import * as db from './db';

const ADD = Symbol('add online user');
const REMOVE = Symbol('remove online user');

// Object mirrored in frontend
const EVENTS = {
    AUTHENTICATE: 'authenticate',
    USER_ONLINE: 'userOnline',
    USER_OFFLINE: 'userOffline',
    INVITE_REQUEST: 'inviteRequest',
    // tslint:disable-next-line:max-line-length
    ACK_INVITE_RESULT: 'acknowledgeInviteResult', // For the inviter to acknowledge that his invite was accepted/canceled (and delete invite from db)
    INVITE_RESPONSE: 'inviteResponse',// To accept/reject invite.
    START_CHAT: 'startChat',
    NEW_MESSAGE: 'sendMessage'
};

// Mirrored in frontend
export interface ChatRoom {
    title: string;
    owner: string;
    contacts: string[];
    roomName: string;
}

// Mirrored in frontend
interface Message {
    chatRoomName: string;
    sender: string;
    content: string;
    isDoodle?: boolean; // check doodle logic.
}


interface ContactsAction {
    action: Symbol;
    contact: String;
}
/**
 * We need to keep track of online users in this array and make it subscribable... 
 * when a user is added, the event 'useronline' is triggered, we are subscribed inside the closure
 * We check if the user online is in our list of contacts and fire an event to the frontend.
 */
const onlineUsersArray: User[] = [];
const onlineUsersSubject = new Rx.Subject<ContactsAction>();
export const inviteRequestSubject = new Rx.Subject();
const inviteAckSubject = new Rx.Subject<Invite>(); // This triggers an 'invite accepted/rejected' to the inviter.
const startChatSubject = new Rx.Subject<ChatRoom>();
const messagesSubject = new Rx.Subject<Message>();


function addOnlineUser(user: User) {
    onlineUsersArray.push(user);
    const action: ContactsAction = { action: ADD, contact: user.name };
    onlineUsersSubject.next(action);
}
function removeOnlineUser(user: User) {
    const index = onlineUsersArray.indexOf(user);
    if (index >= 0) {
        onlineUsersArray.splice(index, 1);
        const action: ContactsAction = { action: REMOVE, contact: user.name }
        onlineUsersSubject.next(action);
    }
}

export function ioMain(socket: SocketIO.Socket) {
    let authorized = false;
    let user: UserDocument;
    let contactsSubscription: Rx.Subscription;
    let inviteRequestSubscription: Rx.Subscription;
    let inviteAckSubscription: Rx.Subscription;
    let startChatSubscription: Rx.Subscription;
    let messagesSubscription: Rx.Subscription;

    contactsSubscription = Rx.Observable.from(onlineUsersSubject)
        .filter((ouAction: ContactsAction) => { // Only users in contacts
            for (let i = 0; i < user.contacts.length; i++) {
                if (user.contacts[i].name === ouAction.contact) {
                    return true;
                }
            }
            return false;
        })
        .subscribe((onlineUserAction: ContactsAction) => {
            if (onlineUserAction.action === ADD) {
                socket.emit(EVENTS.USER_ONLINE, onlineUserAction.contact);
            } else if (onlineUserAction.action === REMOVE) {
                socket.emit(EVENTS.USER_OFFLINE, onlineUserAction.contact);
            }
        }
        // onError, onComplete
        );

    inviteRequestSubscription = Rx.Observable.from(inviteRequestSubject)
        .filter((invite: Invite) => invite.contact === user.name && invite.accept === undefined)
        .subscribe((invite: Invite) => {
            socket.emit(EVENTS.INVITE_REQUEST, invite);
        });

    // If a user that sent an invite receives the response while online, it will trigger this.
    inviteAckSubscription = Rx.Observable.from(inviteAckSubject)
        .filter((invite: Invite) => invite.name === user.name)
        .subscribe((invite: Invite) => {
            socket.emit(EVENTS.INVITE_RESPONSE, invite);
        });

    startChatSubscription = Rx.Observable.from(startChatSubject)
        .filter((chatRoom: ChatRoom) => chatRoom.contacts.indexOf(user.name) !== -1 )
        .subscribe( (chatRoom: ChatRoom) => {
            socket.emit(EVENTS.START_CHAT, chatRoom);
            // We have the chatroom in this closure, so we'll subscribe the invited party here
            Rx.Observable.from(messagesSubject)
            .filter( (message) => message.chatRoomName === chatRoom.roomName && message.sender !== user.name)
            .subscribe( message => socket.emit(EVENTS.NEW_MESSAGE, message));
        });

    socket.on(EVENTS.AUTHENTICATE, (data: any) => {
        if (auth.tokenValidSocket(data).valid) {
            const invitesP = db.getNonRespondedInvites(data.user.name);
            const userP = db.getUserInner(data.user.name);
            Promise.all([userP, invitesP]).then(
                ([dbUser, invites]) => {
                    authorized = true;
                    user = dbUser;
                    addOnlineUser(user);
                    // Check the currently online users and send the online contacts to the client
                    for (let i = 0; i < onlineUsersArray.length; i++) {
                        for (let j = 0; j < user.contacts.length; j++) {
                            if (onlineUsersArray[i].name === user.contacts[j].name) {
                                socket.emit(EVENTS.USER_ONLINE, user.contacts[j].name);
                            }
                        }
                    }
                    // Send invites to the client
                    invites.forEach(invite => socket.emit(EVENTS.INVITE_REQUEST, invite));
                });
        }
    });

    socket.on('disconnect', function () {
        contactsSubscription.unsubscribe();
        inviteRequestSubscription.unsubscribe();
        inviteAckSubscription.unsubscribe();
        removeOnlineUser(user);
    });

    /**
     * Remove invite from DB and, if accepted, add to contact DB, fire userOnline event if newly added contact is online
     */
    socket.on(EVENTS.ACK_INVITE_RESULT, (contactName: string) => {
        db.getInvite(user.name, contactName).then((invite: InviteDocument) => {
            let userP: Promise<UserDocument | void>;
            if (invite.accept) {
                // Add to contacts
                user.contacts.push({ name: contactName });
            } else {
                userP = Promise.resolve();
            }
            Promise.all([userP, invite.remove()]).then(([user, invite]) => {
                // Fire newly added contact is online if necessary.
                for (let i = 0; i < onlineUsersArray.length; i++) {
                    if (onlineUsersArray[i].name === contactName) {
                        socket.emit(EVENTS.USER_ONLINE, contactName);
                    }
                }
            },
                (error) => {
                    // Emit error message?
                    console.log(`Error in ${EVENTS.ACK_INVITE_RESULT}: ${error}`);
                }
            );
        });
    });


    socket.on(EVENTS.INVITE_RESPONSE, (incomingInvite: Invite) => {
        // Find the invite in DB, update it, 
        db.getInvite(incomingInvite.name, user.name).then((invite: InviteDocument) => {
            invite.accept = incomingInvite.accept;
            invite.save();
            if (invite.accept) {
                // Save in contacts for both sides
                db.getUserInner(invite.name).then((inviter) => {
                    // Save inviter in invitees list
                    inviter.contacts.push({ name: user.name });
                    inviter.save();
                });

                user.contacts.push({ name: invite.name });
                user.save().then(() => {
                    // If inviter is online, fire online event and invitation accepted event
                    const contactOnline = onlineUsersArray.filter((onlineUser) => onlineUser.name === invite.name);
                    if (contactOnline.length > 0) {
                        socket.emit(EVENTS.USER_ONLINE, invite.name);
                    }
                });
            }
            inviteAckSubject.next(invite);
        });
    });

    socket.on(EVENTS.START_CHAT, (chatRoom: ChatRoom) => {
        startChatSubject.next(chatRoom);
        // Subscribe the requester here to the messageSubject
        Rx.Observable.from(messagesSubject)
        .filter( (message) => message.chatRoomName === chatRoom.roomName && message.sender !== user.name)
        .subscribe( message => socket.emit(EVENTS.NEW_MESSAGE, message));
    });

    socket.on(EVENTS.NEW_MESSAGE, (message: Message) => {
        messagesSubject.next(message);
    });
}
