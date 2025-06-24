(function() {
    'use strict';
    
    // Prevent multiple injections
    if (window.crestaInjected) {
        console.log('Cresta script already injected');
        return;
    }
    window.crestaInjected = true;

    // Global variables
    let device;
    let connection;
    let callActive = false;
    let audioContext;
    let microphone;
    let workletNode;
    let formPopulated = false;

    // Default settings
    const defaultSettings = {
        closeIconColor: 'black',
        chatBackgroundColor: '#f1f2f4',
        chatIcon: 'https://cresta.com/wp-content/uploads/2024/06/cresta-c-80x80-1.png',
        headerIcon: 'https://cresta.com/wp-content/uploads/2024/06/cresta-c-80x80-1.png',
        backgroundImage: '',
        titlebarColor: 'black',
        titlebarFontColor: 'white',
        userMessageBackgroundColor: 'black',
        userMessageTextColor: 'white',
        aiMessageBackgroundColor: 'black',
        aiMessageTextColor: 'black',
        inputBorderColor: 'black',
        sendIconColor: 'black',
        widgetBackgroundColor: 'white',
    };

    // Load Twilio SDK
    function loadTwilioSDK() {
        return new Promise((resolve, reject) => {
            if (window.Twilio) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = "https://media.twiliocdn.com/sdk/js/client/v1.13/twilio.min.js";
            script.type = "text/javascript";
            script.onload = () => {
                console.log("Twilio SDK loaded!");
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Inject CSS styles
    function injectCSS() {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.id = 'cresta-injectable-styles';

        style.innerHTML = `
            /* Prevent multiple injections */
            #cresta-injectable-styles ~ #cresta-injectable-styles {
                display: none;
            }

            /* Microphone button styles */
            #crestaInjectedMicButton {
                position: fixed;
                bottom: 20px;
                left: 80px;
                z-index: 9999;
                width: 24px;
                height: 24px;
                opacity: 0.3;
                transition: opacity 0.3s;
                cursor: pointer;
            }

            #crestaInjectedMicButton:hover {
                opacity: 1;
            }

            #crestaMicIcon {
                fill: grey !important;
                transition: fill 0.2s;
            }

            #crestaInjectedMicButton:hover #crestaMicIcon {
                fill: gray;
            }

            #crestaMicIcon.talking {
                fill: green !important;
            }

            /* Settings button */
            #crestaSettingsButton {
                position: fixed;
                bottom: 20px;
                left: 20px;
                z-index: 9999;
                background: none;
                border: none;
                font-size: 24px;
                opacity: 0.1;
                transition: opacity 0.3s;
                cursor: pointer;
            }

            #crestaSettingsButton:hover {
                opacity: 1;
            }

            /* Modal styles */
            .cresta-modal {
                display: none;
                position: fixed;
                z-index: 10000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                overflow: auto;
                background-color: rgba(0,0,0,0.4);
            }

            .cresta-modal-content {
                background-color: #fefefe;
                margin: 5% auto;
                padding: 0;
                border: none;
                width: 90%;
                max-width: 600px;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                max-height: 80vh;
                overflow-y: auto;
            }

            .cresta-modal-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 10px 10px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .cresta-modal-header h2 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }

            .cresta-close {
                color: white;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
                background: none;
                border: none;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.3s;
            }

            .cresta-close:hover {
                background: rgba(255,255,255,0.2);
            }

            .cresta-form-container {
                padding: 30px;
            }

            .cresta-form-group {
                margin-bottom: 20px;
            }

            .cresta-form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #333;
                font-size: 14px;
            }

            .cresta-form-group input {
                width: 100%;
                padding: 12px;
                border: 2px solid #e1e5e9;
                border-radius: 6px;
                font-size: 14px;
                transition: border-color 0.3s, box-shadow 0.3s;
                box-sizing: border-box;
            }

            .cresta-form-group input:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }

            .cresta-form-buttons {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e1e5e9;
            }

            .cresta-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }

            .cresta-btn-primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .cresta-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }

            .cresta-btn-secondary {
                background: #6c757d;
                color: white;
            }

            .cresta-btn-secondary:hover {
                background: #5a6268;
            }

            .cresta-btn-danger {
                background: #dc3545;
                color: white;
            }

            .cresta-btn-danger:hover {
                background: #c82333;
            }

            /* Toast notifications */
            @keyframes toastSlideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;

        document.head.appendChild(style);
    }

    // Create UI elements
    function createUI() {
        // Remove existing elements if they exist
        const existingMic = document.getElementById('crestaInjectedMicButton');
        const existingSettings = document.getElementById('crestaSettingsButton');
        const existingModal = document.getElementById('crestaSettingsModal');
        
        if (existingMic) existingMic.remove();
        if (existingSettings) existingSettings.remove();
        if (existingModal) existingModal.remove();

        // Create microphone button
        const micButton = document.createElement('svg');
        micButton.id = 'crestaInjectedMicButton';
        micButton.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        micButton.setAttribute('viewBox', '0 0 24 24');
        micButton.setAttribute('width', '24');
        micButton.setAttribute('height', '24');

        const micPath = document.createElement('path');
        micPath.id = 'crestaMicIcon';
        micPath.setAttribute('d', 'M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2zm-5 9a7 7 0 0 0 7-7h2a9 9 0 0 1-18 0h2a7 7 0 0 0 7 7z');
        micButton.appendChild(micPath);

        // Create settings button
        const settingsButton = document.createElement('button');
        settingsButton.id = 'crestaSettingsButton';
        settingsButton.textContent = '🎨';
        settingsButton.title = 'Cresta Settings';

        // Create settings modal
        const modal = document.createElement('div');
        modal.id = 'crestaSettingsModal';
        modal.className = 'cresta-modal';

        modal.innerHTML = `
            <div class="cresta-modal-content">
                <div class="cresta-modal-header">
                    <h2>🎨 Cresta Settings</h2>
                    <button class="cresta-close">&times;</button>
                </div>
                
                <div class="cresta-form-container">
                    <form id="crestaColorSettingsForm">
                        <div class="cresta-form-group">
                            <label for="crestaAssociatedPhoneNumber">Associated Phone Number:</label>
                            <input type="text" id="crestaAssociatedPhoneNumber" name="associatedPhoneNumber" placeholder="e.g., 17017604130">
                        </div>
                        
                        <div class="cresta-form-group">
                            <label for="crestaNamespace">Namespace:</label>
                            <input type="text" id="crestaNamespace" name="namespace" placeholder="e.g., virtual-agent-sandbox">
                        </div>

                        <div class="cresta-form-group">
                            <label for="crestaChatIcon">Chat Icon URL:</label>
                            <input type="text" id="crestaChatIcon" name="chatIcon" placeholder="e.g., https://example.com/icon.png">
                        </div>

                        <div class="cresta-form-group">
                            <label for="crestaHeaderIcon">Header Icon URL:</label>
                            <input type="text" id="crestaHeaderIcon" name="headerIcon" placeholder="e.g., https://example.com/icon.png">
                        </div>

                        <div class="cresta-form-group">
                            <label for="crestaBackgroundImage">Background Image URL:</label>
                            <input type="text" id="crestaBackgroundImage" name="backgroundImage" placeholder="e.g., https://example.com/background.png">
                        </div>
                        
                        <div class="cresta-form-group">
                            <label for="crestaTitlebarColor">Titlebar Color:</label>
                            <input type="color" id="crestaTitlebarColor" name="titlebarColor" value="#000000">
                        </div>
                        
                        <div class="cresta-form-group">
                            <label for="crestaTitlebarFontColor">Titlebar Font Color:</label>
                            <input type="color" id="crestaTitlebarFontColor" name="titlebarFontColor" value="#ffffff">
                        </div>
                        
                        <div class="cresta-form-group">
                            <label for="crestaChatBackgroundColor">Chat Background Color:</label>
                            <input type="color" id="crestaChatBackgroundColor" name="chatBackgroundColor" value="#f1f2f4">
                        </div>
                        
                        <div class="cresta-form-group">
                            <label for="crestaUserMessageBackgroundColor">User Message Background:</label>
                            <input type="color" id="crestaUserMessageBackgroundColor" name="userMessageBackgroundColor" value="#000000">
                        </div>
                        
                        <div class="cresta-form-group">
                            <label for="crestaUserMessageTextColor">User Message Text Color:</label>
                            <input type="color" id="crestaUserMessageTextColor" name="userMessageTextColor" value="#ffffff">
                        </div>
                        
                        <div class="cresta-form-group">
                            <label for="crestaAiMessageBackgroundColor">AI Message Background:</label>
                            <input type="color" id="crestaAiMessageBackgroundColor" name="aiMessageBackgroundColor" value="#000000">
                        </div>
                        
                        <div class="cresta-form-group">
                            <label for="crestaAiMessageTextColor">AI Message Text Color:</label>
                            <input type="color" id="crestaAiMessageTextColor" name="aiMessageTextColor" value="#000000">
                        </div>
                        
                        <div class="cresta-form-group">
                            <label for="crestaSendIconColor">Send Icon Color:</label>
                            <input type="color" id="crestaSendIconColor" name="sendIconColor" value="#000000">
                        </div>
                        
                        <div class="cresta-form-group">
                            <label for="crestaInputBorderColor">Input Border Color:</label>
                            <input type="color" id="crestaInputBorderColor" name="inputBorderColor" value="#000000">
                        </div>
                        
                        <div class="cresta-form-group">
                            <label for="crestaCloseIconColor">Close Icon Color:</label>
                            <input type="color" id="crestaCloseIconColor" name="closeIconColor" value="#000000">
                        </div>
                        
                        <div class="cresta-form-group">
                            <label for="crestaWidgetBackgroundColor">Widget Background Color:</label>
                            <input type="color" id="crestaWidgetBackgroundColor" name="widgetBackgroundColor" value="#ffffff">
                        </div>
                        
                        <div class="cresta-form-buttons">
                            <button type="button" class="cresta-btn cresta-btn-danger" onclick="window.crestaResetToDefaults()">Reset to Defaults</button>
                            <button type="button" class="cresta-btn cresta-btn-secondary" onclick="window.crestaCloseSettingsModal()">Cancel</button>
                            <button type="submit" class="cresta-btn cresta-btn-primary">Apply Settings</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Append elements to body
        document.body.appendChild(micButton);
        document.body.appendChild(settingsButton);
        document.body.appendChild(modal);
    }

    // Utility functions
    async function getToken() {
        const res = await fetch('https://connecttocresta-9063.twil.io/get_sdk_token');
        const data = await res.json();
        return data.token;
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
        const associatedPhoneNumber = urlParams.get('aiAgentAssociatedPhoneNumber') || localStorage.getItem('aiAgentAssociatedPhoneNumber');
        if (!associatedPhoneNumber) {
            const phoneNumberToAssociate = window.prompt('enter associated Phone Number (e.g. 17017604130)');
            if (phoneNumberToAssociate) {
                localStorage.setItem('aiAgentAssociatedPhoneNumber', phoneNumberToAssociate);
            }
            return phoneNumberToAssociate;
        }
        return associatedPhoneNumber;
    }

    // Voice functionality
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
                const micIcon = document.getElementById('crestaMicIcon');
                if (micIcon) {
                    if (volume > 0.002) {
                        micIcon.classList.add('talking');
                    } else {
                        micIcon.classList.remove('talking');
                    }
                }
            };

            microphone.connect(workletNode);
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
        const micIcon = document.getElementById('crestaMicIcon');
        if (micIcon) {
            console.log('removing mic coloring');
            micIcon.classList.remove('talking');
        }
    }

    // Settings functionality
    function updateSettings(settings) {
        Object.keys(settings).forEach(key => {
            if (settings[key] !== null && settings[key] !== undefined) {
                localStorage.setItem(key, settings[key]);
            }
        });
        
        if (settings.backgroundImage) {
            applyBackgroundImage(settings.backgroundImage);
        }
        
        console.log('Settings saved to localStorage:', settings);
    }

    function applyBackgroundImage(imageUrl) {
        const root = document.documentElement;
        if (imageUrl && imageUrl.trim()) {
            root.style.setProperty('--content-bg-image', `url("${imageUrl}")`);
            root.style.setProperty('--content-bg-color', '#cccccc');
        } else {
            root.style.setProperty('--content-bg-image', 'none');
            root.style.setProperty('--content-bg-color', 'white');
        }
    }

    function convertToHex(colorValue) {
        if (!colorValue || colorValue.trim() === '') return null;
        
        const value = colorValue.trim();
        
        if (value.startsWith('#')) {
            return value;
        }
        
        const tempDiv = document.createElement('div');
        tempDiv.style.color = value;
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);
        const computedColor = getComputedStyle(tempDiv).color;
        document.body.removeChild(tempDiv);
        
        if (computedColor && computedColor !== 'rgba(0, 0, 0, 0)') {
            return rgbToHex(computedColor);
        }
        
        return null;
    }

    function rgbToHex(rgb) {
        const result = rgb.match(/\d+/g);
        if (result && result.length >= 3) {
            const r = parseInt(result[0]);
            const g = parseInt(result[1]);
            const b = parseInt(result[2]);
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }
        return rgb;
    }

    function populateForm(settings) {
        const fields = [
            'titlebarColor', 'chatBackgroundColor', 'titlebarFontColor', 'closeIconColor',
            'userMessageBackgroundColor', 'userMessageTextColor', 'aiMessageBackgroundColor',
            'aiMessageTextColor', 'sendIconColor', 'inputBorderColor', 'widgetBackgroundColor'
        ];

        fields.forEach(field => {
            const element = document.getElementById('cresta' + field.charAt(0).toUpperCase() + field.slice(1));
            if (element) {
                element.value = convertToHex(settings[field]) || defaultSettings[field] || '#000000';
            }
        });

        const textFields = ['chatIcon', 'headerIcon', 'backgroundImage'];
        textFields.forEach(field => {
            const element = document.getElementById('cresta' + field.charAt(0).toUpperCase() + field.slice(1));
            if (element) {
                element.value = settings[field] || '';
            }
        });

        const associatedPhoneNumber = localStorage.getItem('aiAgentAssociatedPhoneNumber') || '';
        const namespace = localStorage.getItem('namespace') || '';
        const phoneEl = document.getElementById('crestaAssociatedPhoneNumber');
        const namespaceEl = document.getElementById('crestaNamespace');
        if (phoneEl) phoneEl.value = associatedPhoneNumber;
        if (namespaceEl) namespaceEl.value = namespace;
    }

    function getCurrentSettings() {
        const settings = {};
        
        Object.keys(defaultSettings).forEach(key => {
            settings[key] = localStorage.getItem(key) || defaultSettings[key];
        });
        
        return settings;
    }

    function showSuccessMessage(message) {
        const toast = createToast(message, 'success');
        document.body.appendChild(toast);
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 4000);
    }

    function showErrorMessage(message) {
        const toast = createToast(message, 'error');
        document.body.appendChild(toast);
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 4000);
    }

    function createToast(message, type) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background-color: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10001;
            font-size: 14px;
            font-weight: 500;
            animation: toastSlideIn 0.3s ease-out;
            max-width: 300px;
        `;
        toast.textContent = message;
        return toast;
    }

    // Chat widget initialization
    async function initializeMessenger() {
        // Load widget CSS
        const linkEl = document.createElement('link');
        linkEl.href = "https://va-widget.us-west-2-prod.cresta.ai/chatgpt-widget-v2/index.css";
        linkEl.rel = "stylesheet";
        document.head.appendChild(linkEl);

        // Get phone number and fetch agent IDs
        const urlParams = new URLSearchParams(window.location.search);
        const phoneNumber = urlParams.get('aiAgentAssociatedPhoneNumber') || localStorage.getItem('aiAgentAssociatedPhoneNumber');
        
        let chatAiAgentId = 'b414de7f-7b26-42e0-8489-0834619014ed';
        let voiceAgentId = chatAiAgentId;
        
        if (phoneNumber) {
            try {
                const agentIds = await fetchAgentIds(phoneNumber);
                if (agentIds) {
                    chatAiAgentId = agentIds.chatAiAgentId || chatAiAgentId;
                    voiceAgentId = agentIds.voiceAiAgentId || voiceAgentId;
                    console.log('Agent IDs fetched for modal:', { chatAiAgentId, voiceAgentId });
                }
            } catch (error) {
                console.error('Error fetching agent IDs for modal:', error);
            }
        }
        
        const namespace = localStorage.getItem('namespace') || 'virtual-agent-sandbox';
        const chatIcon = localStorage.getItem('chatIcon') || 'https://cresta.com/wp-content/uploads/2024/06/cresta-c-80x80-1.png';
        const headerIcon = localStorage.getItem('headerIcon') || 'https://cresta.com/wp-content/uploads/2024/06/cresta-c-80x80-1.png';
        const useCase = 'virtual-agent-sandbox-voice';
        const customerName = 'cresta';
        
        const dfMessenger = document.createElement('df-messenger');
        dfMessenger.setAttribute('chat-title', 'Cresta');
        dfMessenger.setAttribute('persist-session', 'true');
        dfMessenger.setAttribute('chat-icon', chatIcon);
        dfMessenger.setAttribute('header-icon', headerIcon);
        dfMessenger.setAttribute('crestagpt-api', 'https://api-virtual-agent-sandbox.cresta.com');
        dfMessenger.setAttribute('crestagpt-agent', chatAiAgentId);
        dfMessenger.setAttribute('cresta-voice-agent', voiceAgentId);
        dfMessenger.setAttribute("twilio-app-sid", "APe5554d84b6d9b36b35c7abb764a0df65");
        dfMessenger.setAttribute('crestagpt-customer', customerName);
        dfMessenger.setAttribute('crestagpt-profile', namespace);
        dfMessenger.setAttribute('crestagpt-usecase', useCase);
        dfMessenger.setAttribute('auth-client-id', 'cresta-va-dev-testing');
        dfMessenger.setAttribute('recaptcha-site-key', '6LeEVqgnAAAAAK7eLjKMoER7BbIahGTHTfQaD4xO');
        dfMessenger.setAttribute('recaptcha-checkbox-site-key', '6Lc0dqgnAAAAADLukGM3TYFFmO5j62UwitR_wVfB');
        dfMessenger.setAttribute('should-hide-popup', 'false');
        dfMessenger.setAttribute("popup-delay-show", "1000");
        dfMessenger.setAttribute("popup-delay-hide", "5000");
        dfMessenger.setAttribute('should-hide-popup-on-device-type', 'mobile');
        dfMessenger.setAttribute("position", "right");
        dfMessenger.setAttribute("chat-window-horizontal-position", "center");
        document.body.appendChild(dfMessenger);
        
        const script = document.createElement('script');
        script.src = 'https://va-widget.us-west-2-prod.cresta.ai/chatgpt-widget-v2/index.js';
        document.body.appendChild(script);
    }

    // Event handlers
    function handleColorSettings() {
        showSettingsModal();
        
        if (!formPopulated) {
            const currentSettings = getCurrentSettings();
            populateForm(currentSettings);
            formPopulated = true;
        }
    }

    function showSettingsModal() {
        const modal = document.getElementById('crestaSettingsModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    function closeSettingsModal() {
        const modal = document.getElementById('crestaSettingsModal');
        if (modal) {
            modal.style.display = 'none';
        }
        formPopulated = false;
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        
        try {
            const formData = new FormData(event.target);
            const updatedSettings = {};
            
            for (const [property, value] of formData.entries()) {
                console.log(`Processing form field: ${property} = ${value}`);
                if (!value.trim()) continue;
                
                if (property === 'associatedPhoneNumber') {
                    localStorage.setItem('aiAgentAssociatedPhoneNumber', value);
                    console.log('Associated Phone Number updated:', value);
                } else if (property === 'namespace') {
                    localStorage.setItem('namespace', value);
                    console.log('Namespace updated:', value);
                } else if (property === 'chatIcon' || property === 'headerIcon' || property === 'backgroundImage') {
                    updatedSettings[property] = value;
                } else if (Object.keys(defaultSettings).includes(property)) {
                    updatedSettings[property] = value;
                }
            }

            updateSettings(updatedSettings);
            formPopulated = false;
            closeSettingsModal();
            showSuccessMessage('Settings updated successfully! Please refresh the page to see changes.');
            
        } catch (error) {
            console.error('Error updating settings:', error);
            showErrorMessage('Error updating settings. Please check the console for details.');
        }
    }

    function resetToDefaults() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            Object.keys(defaultSettings).forEach(key => {
                localStorage.removeItem(key);
            });
            localStorage.removeItem('aiAgentAssociatedPhoneNumber');
            localStorage.removeItem('namespace');
            
            updateSettings(defaultSettings);
            populateForm(defaultSettings);
            showSuccessMessage('Settings reset to defaults! Please refresh the page to see changes.');
        }
    }

    // Global functions for event handlers
    window.crestaHandleColorSettings = handleColorSettings;
    window.crestaCloseSettingsModal = closeSettingsModal;
    window.crestaResetToDefaults = resetToDefaults;

    // Event listeners
    function attachEventListeners() {
        const micButton = document.getElementById('crestaInjectedMicButton');
        if (micButton) {
            micButton.addEventListener('click', function(event) {
                console.log('Microphone button clicked!');
                event.preventDefault();
                if (window.Twilio) {
                    toggleCall();
                } else {
                    showErrorMessage('Twilio SDK not loaded. Please wait and try again.');
                }
            });
        }

        const settingsButton = document.getElementById('crestaSettingsButton');
        if (settingsButton) {
            settingsButton.addEventListener('click', handleColorSettings);
        }

        const form = document.getElementById('crestaColorSettingsForm');
        if (form) {
            form.addEventListener('submit', handleFormSubmit);
        }

        const modal = document.getElementById('crestaSettingsModal');
        if (modal) {
            modal.addEventListener('click', function(event) {
                if (event.target === modal) {
                    closeSettingsModal();
                }
            });

            const closeBtn = modal.querySelector('.cresta-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', closeSettingsModal);
            }
        }

        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && modal && modal.style.display === 'block') {
                closeSettingsModal();
            }
        });
    }

    // Initialize everything
    async function initialize() {
        try {
            console.log('🚀 Initializing Cresta Injectable Script...');
            
            // Initialize UI first
            injectCSS();
            createUI();
            attachEventListeners();
            
            // Load dependencies
            await loadTwilioSDK();
            
            // Initialize chat widget
            await initializeMessenger();
            
            // Get or prompt for phone number
            getAssociatedPhoneNumber();
            
            console.log('✅ Cresta Injectable Script initialized successfully!');
            showSuccessMessage('Cresta script loaded successfully! Use the 🎨 button to configure settings.');
            
        } catch (error) {
            console.error('❌ Error initializing Cresta Injectable Script:', error);
            showErrorMessage('Error loading Cresta script. Check console for details.');
        }
    }

    // Run initialization
    initialize();

})(); 