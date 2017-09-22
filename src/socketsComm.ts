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
    AUTHENTICATE : 'authenticate',
    USER_ONLINE : 'userOnline',
    USER_OFFLINE : 'userOffline',
    INVITE_REQUEST : 'inviteRequest',
    ACK_INVITE_RESULT : 'acknowledgeInviteResult'
};


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
const onlineUsersSubject = new Rx.Subject();
export const inviteRequestSubject = new Rx.Subject();
// TODO: Do the same for the invites... filter invites where invitee is the user and send invitation.


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
        .filter( (invite: Invite) => invite.contact === user.name )
        .subscribe( (invite: Invite) => {
            socket.emit(EVENTS.INVITE_REQUEST, invite);
        });

    socket.on(EVENTS.AUTHENTICATE, (data: any) => {
        if (auth.tokenValidSocket(data).valid) {
            const invitesP = db.getInvites(data.user.name);
            const userP = db.getUserInner(data.user.name);
            Promise.all([userP, invitesP]).then(
                ( [dbUser, invites]) => {
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
                    for(let i=0; i<invites.length; i++){
                        socket.emit()
                    }
                });
        }
    });

    socket.on('disconnect', function () {
        contactsSubscription.unsubscribe();
        removeOnlineUser(user);
    });

    /**
     * Remove invite from DB and, if accepted, add to contact DB, fire userOnline event if newly added contact is online
     */
    socket.on(EVENTS.ACK_INVITE_RESULT, (contactName: string) => {
        db.getInvite(user.name, contactName).then( (invite: InviteDocument) => {
            let userP: Promise<UserDocument|void>;
            if(invite.accept){
                // Add to contacts
                user.contacts.push( {name: contactName });
                userP = user.save();
            }else{
                userP = Promise.resolve();
            }
            Promise.all( [userP, invite.remove()]).then( ( [user, invite]) => {
                /**
                 * Emit success message? FrontEnd won't really care right now... 
                 * if it fails, it will reappear next time... is it worth it checking for one success, one failure?
                 */
                // Fire newly added contact is online if online.
                for(let i=0; i<onlineUsersArray.length; i++){
                    if(onlineUsersArray[i].name === contactName) {
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
}
