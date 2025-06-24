let device;
let connection;
let callActive = false;
let audioContext;
let microphone;
let workletNode;

(function() {
    var script = document.createElement('script');
    script.src = "https://media.twiliocdn.com/sdk/js/client/v1.13/twilio.min.js";
    script.type = "text/javascript";
    script.onload = function() {
        console.log("Twilio SDK loaded!");
    };
    document.head.appendChild(script);
})();

injectCSS();
getAssociatedPhoneNumber();

// Wait for DOM to be ready before attaching event listener
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        attachMicButtonListener();
    });
} else {
    // DOM is already loaded
    attachMicButtonListener();
}

function attachMicButtonListener() {
    const micButton = document.getElementById('injectedMicButton');
    if (micButton) {
        micButton.addEventListener('click', function(event) {
            console.log('Microphone button clicked!');
            event.preventDefault();
            toggleCall();
        });
        console.log('Microphone button event listener attached successfully');
    } else {
        console.error('Could not find injectedMicButton element');
    }
}

function injectCSS() {
    const style = document.createElement('style');
    style.type = 'text/css';

    style.innerHTML = `
        #injectedMicButton {
            opacity: 0.1;
            transition: opacity 0.3s;
            cursor: pointer;
        }

        #injectedMicButton:hover {
            opacity: 1;
        }

        #micIcon {
            fill: grey !important;
            transition: fill 0.2s;
        }

        #injectedMicButton:hover #micIcon {
            fill: gray;
        }

        #micIcon.talking {
            fill: green !important;
        }

    `;

    document.head.appendChild(style);
}

async function getToken() {
    const res = await fetch('https://connecttocresta-9063.twil.io/get_sdk_token');
    const data = await res.json();
    return data.token;
}

async function startCall(aiAgentAssociatedPhoneNumberOverride) {
    const token = await getToken();

    device = new Twilio.Device(token, {
        debug: true,
    });

    device.on('ready', function() {
        const params = {
            correlationId: "b" + makeid(20),
            To: aiAgentAssociatedPhoneNumberOverride || getAssociatedPhoneNumber(),
            From: "website user",
            origin: "browser",
        };
        console.log('Twilio.Device Ready with params:', params);
        connection = device.connect(params);
        startMicDetection();
        callActive = true;
    });

    device.on('error', function(error) {
        console.error('Twilio.Device Error:', error.message);
    });

    device.on('connect', function(conn) {
        console.log('Call connected and streaming.');
    });

    device.on('disconnect', function() {
        console.log('Call ended.');
        stopMicDetection();

        callActive = false;
    });
}

function toggleCall(aiAgentAssociatedPhoneNumberOverride) {
    console.log('toggleCall function called, callActive:', callActive);
    let aiAgentAssociatedPhoneNumberOverrideToUse = null;
    if (typeof aiAgentAssociatedPhoneNumberOverride === 'string') {
        aiAgentAssociatedPhoneNumberOverrideToUse = aiAgentAssociatedPhoneNumberOverride;
    }
    console.log("aiAgentAssociatedPhoneNumberOverride =", aiAgentAssociatedPhoneNumberOverrideToUse);
    if (callActive) {
        console.log('Ending call...');
        if (connection) {
            connection.disconnect();
        }
    } else {
        console.log('Starting call...');
        startCall(aiAgentAssociatedPhoneNumberOverrideToUse);
    }
}

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

async function startMicDetection() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        await audioContext.audioWorklet.addModule(URL.createObjectURL(new Blob([`
            class VolumeProcessor extends AudioWorkletProcessor {
                process(inputs) {
                    const input = inputs[0];
                    if (input.length > 0) {
                        const samples = input[0];
                        let sum = 0;
                        for (let i = 0; i < samples.length; i++) {
                            sum += samples[i] * samples[i];
                        }
                        const rms = Math.sqrt(sum / samples.length);
                        this.port.postMessage(rms);
                    }
                    return true;
                }
            }
            registerProcessor('volume-processor', VolumeProcessor);
        `], { type: 'application/javascript' })));

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphone = audioContext.createMediaStreamSource(stream);

        workletNode = new AudioWorkletNode(audioContext, 'volume-processor');

        workletNode.port.onmessage = (event) => {
            const volume = event.data;
            const micIcon = document.getElementById('micIcon');
            if (volume > 0.002) {
                micIcon.classList.add('talking');
            } else {
                micIcon.classList.remove('talking');
            }
        };

        microphone.connect(workletNode); // do not connect to destination (no echo)
    } catch (err) {
        console.error('Microphone access denied:', err);
    }
}

function stopMicDetection() {
    if (workletNode) {
        workletNode.disconnect();
        workletNode = null;
    }
    if (microphone) {
        microphone.disconnect();
        microphone = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    const micIcon = document.getElementById('micIcon');
    console.log('removing mic coloring');
    micIcon.classList.remove('talking');
}

async function fetchAgentIds(phoneNumber) {
    try {
        const response = await fetch(`https://connecttocresta-9063.twil.io/map_call_to_specific_ID?lookupPhoneNumber=${phoneNumber}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Agent IDs fetched:', data);
        return {
            voiceAiAgentId: data.voiceAiAgentId,
            chatAiAgentId: data.chatAiAgentId
        };
    } catch (error) {
        console.error('Error fetching agent IDs:', error);
        return null;
    }
}

function getAssociatedPhoneNumber() {
    const urlParams = new URLSearchParams(window.location.search);
    // can use local storage instead of session storage because SEs keep their own phone numbers and don't change them
    const associatedPhoneNumber = urlParams.get('aiAgentAssociatedPhoneNumber') || localStorage.getItem('aiAgentAssociatedPhoneNumber');
    if (!associatedPhoneNumber) {
        const phoneNumberToAssociate = window.prompt('enter associated Phone Number (e.g. 17017604130)');
        if (phoneNumberToAssociate) {
            localStorage.setItem('aiAgentAssociatedPhoneNumber', phoneNumberToAssociate);
            // only reading urlParams for now to avoid a page refresh
            // urlParams.append('aiAgentAssociatedPhoneNumber', phoneNumberToAssociate); 
            // window.location.search = urlParams;
        }
        return phoneNumberToAssociate;
    }
    return associatedPhoneNumber;
}