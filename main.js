var firebaseConfig = {
    apiKey: "AIzaSyA51GCqxDw7AuvfNmCcWjbGLtClJNFaUxE",
    authDomain: "webmotia.firebaseapp.com",
    databaseURL: "https://webmotia.firebaseio.com",
    projectId: "webmotia",
    storageBucket: "webmotia.appspot.com",
    messagingSenderId: "606747164317",
    appId: "1:606747164317:web:952c390708ccb09d"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);


const studentButton = document.getElementById("student");

// Gives you access to root of database
const db = firebase.db().ref();
const studentVideo = document.getElementById("studentVideo");
const classroomVideo = document.getElementById("classroomVideo");
const classroomID = Math.floor(Math.random()*1000000000)

// We are using both STUN and TURN servers (GOOGLE/Firefox and Viagenie) if first server doesn't work it will try the next server
const signallingServers = {'iceServers': [{'urls': 'stun:stun.services.mozilla.com'}, {'urls': 'stun:stun.l.google.com:19302'}, {'urls': 'turn:numb.viagenie.ca','credential': 'ImdcUser1','username': 'motiweb453@mail.com'}]};

// Creates RTCPeerConnection object on classroom side and another on student side when they load in.
const peerObj = new RTCPeerConnection(signallingServers);

/* DEBUGGING PURPOSES */
const connectionState = peerObj.connectionState;

// *****onicecandidate***** EventHandler delivers message to other peer through signaling server (signallingServers)
// Called on peerObj (RTCPeerConnection) instance **ONLY AFTER ICE candidate created on classroom computer *****
peerObj.onicecandidate = (event => event.candidate?sendMessage(classroomID, JSON.stringify({'ice': event.candidate})):console.log("Sent All Ice") );

peerObj.ontrack = (event => classroomVideo.srcObject = event.stream);

function sendMessage(senderID, data){
    let msg = db.push({sender: senderID, message: data });
    msg.remove();
}

function readMessage(data) {
    // Convert string back to ICE Candidate obj.
    const message = JSON.parse(data.val().message);
    const sender = data.val().sender;

    /* We are sending data (Offer, Answer, and ICE candidate obj) from the Classroom to the Student
    *  Firebase sends this data to both student/classroom, we don't need it in the classroom so
    *  we enclose most of program in in an if(sender != classroomID)
    */
    if(sender != classroomID) {

        // check if there's a msg
        if(message.ice){
            // addIceCandidate() adds remote peer to RTCPeerConnections remote description
            peerObj.addIceCandidate(new RTCIceCandidate(message.ice))
                .catch(e => {
                console.log("Failure during addIceCandidate(): " +e.name);
            });

        } else{
            // handle other things being signalled, like sdp
        }



    }


}

    db.on('child_added', readMessage);

// Camera resolution and Vid/Aud settings
    const constraints = {
        audio: true,
        video: {
            width: { min: 1024, ideal: 1280, max: 1920 },
            height: { min: 776, ideal: 720, max: 1080 }
        }
    };


$(document).ready(function(){
    showClassroom();
})
function showClassroom(){
    navigator.mediaDevices.getUserMedia(constraints)
        .then((track) => {
            console.log(track);
        })
        .then((track) => pc.addTrack(track)
        ).catch((err) => {
        console.log(err);
    });

}


/*
* In order to connect with the student we need to create an offer
*
* Set local description to this offer
* Then Send offer object to student by calling sendMessage and set its (session description protocol to the same one)
*/
studentButton.onclick = function() {
    // Initiate an SDP offer
    peerObj.createOffer()
        .then((offer) => peerObj.setLocalDescription(offer) )
        .then(() => sendMessage(classroomID, JSON.stringify({'sdp': peerObj.localDescription})) );
};




/*  Tells us the current connection status */

peerObj.onconnectionstatechange = (() => {
    switch(peerObj.connectionState){
        case "connected":
            console.log("connected");
            break;
        case "disconnected":
            console.log("disconnected");
            break;
        case "failed":
            console.log("Failed, unexpected termination or error");
            break;
        case "closed":
            console.log("Connection Closed");
            break;
    }
});









//https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer
//https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling
//https://websitebeaver.com/insanely-simple-webrtc-video-chat-using-firebase-with-codepen-demo