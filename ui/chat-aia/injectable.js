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
            /* CSS Variables */
            :root {
                --cresta-primary-color: ${localStorage.getItem('titlebarColor') || '#a21523'};
                --cresta-text-on-primary: ${localStorage.getItem('titlebarFontColor') || 'white'};
                --cresta-chat-bg-color: ${localStorage.getItem('chatBackgroundColor') || '#f1f2f4'};
                --cresta-close-icon-color: ${localStorage.getItem('closeIconColor') || 'black'};
                --cresta-user-msg-bg-color: ${localStorage.getItem('userMessageBackgroundColor') || 'black'};
                --cresta-user-msg-text-color: ${localStorage.getItem('userMessageTextColor') || 'white'};
                --cresta-ai-msg-bg-color: ${localStorage.getItem('aiMessageBackgroundColor') || 'black'};
                --cresta-ai-msg-text-color: ${localStorage.getItem('aiMessageTextColor') || 'black'};
                --cresta-send-icon-color: ${localStorage.getItem('sendIconColor') || 'black'};
                --cresta-input-border-color: ${localStorage.getItem('inputBorderColor') || 'black'};
                --cresta-widget-bg-color: ${localStorage.getItem('widgetBackgroundColor') || 'white'};
                --ai-message-background-color: ${localStorage.getItem('aiMessageBackgroundColor') || 'black'};
                --ai-message-text-color: ${localStorage.getItem('aiMessageTextColor') || 'black'};
            }

            /* Prevent multiple injections */
            #cresta-injectable-styles ~ #cresta-injectable-styles {
                display: none;
            }

            /* Microphone button styles */
            #crestaInjectedMicButton {
                position: fixed !important;
                bottom: 20px !important;
                left: 50px !important;
                z-index: 2147483647 !important;
                width: 40px !important;
                height: 40px !important;
                opacity: 0.3 !important;
                transition: opacity 0.3s !important;
                cursor: pointer !important;
                display: flex !important;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.1) !important;
                border-radius: 4px !important;
            }

            #crestaInjectedMicButton:hover {
                opacity: 1 !important;
                background: rgba(255, 255, 255, 0.2) !important;
            }

            #crestaMicIcon {
                fill: #666666 !important;
                transition: fill 0.2s !important;
                width: 100% !important;
                height: 100% !important;
                display: block !important;
            }

            #crestaInjectedMicButton:hover #crestaMicIcon {
                fill: #333333 !important;
            }

            #crestaMicIcon.talking {
                fill: #00ff00 !important;
            }

            /* Settings button */
            #crestaSettingsButton {
                position: fixed !important;
                bottom: 20px !important;
                left: 20px !important;
                z-index: 2147483647 !important;
                background: rgba(255, 255, 255, 0.1) !important;
                border: none !important;
                font-size: 24px !important;
                opacity: 0.3 !important;
                transition: opacity 0.3s !important;
                cursor: pointer !important;
                padding: 4px !important;
                border-radius: 4px !important;
                display: block !important;
            }

            #crestaSettingsButton:hover {
                opacity: 1 !important;
                background: rgba(255, 255, 255, 0.2) !important;
            }

            /* Clear session button */
            #crestaClearSessionButton {
                position: fixed !important;
                bottom: 20px !important;
                left: 100px !important;
                z-index: 2147483647 !important;
                width: 40px !important;
                height: 40px !important;
                opacity: 0.3 !important;
                transition: opacity 0.3s !important;
                cursor: pointer !important;
                display: flex !important;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.1) !important;
                border: none !important;
                border-radius: 4px !important;
                font-size: 18px !important;
            }

            #crestaClearSessionButton:hover {
                opacity: 1 !important;
                background: rgba(255, 255, 255, 0.2) !important;
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
                background-color: white;
                margin: 5% auto;
                padding: 0;
                border-radius: 12px;
                width: 90%;
                max-width: 500px;
                max-height: 85vh;
                overflow-y: auto;
                box-shadow: 
                    0 10px 30px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.6),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.1),
                    inset 1px 0 0 rgba(255, 255, 255, 0.3),
                    inset -1px 0 0 rgba(0, 0, 0, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                animation: modalFadeIn 0.3s ease-out;
            }

            /* Custom scrollbar styling for the modal */
            .cresta-modal-content::-webkit-scrollbar {
                width: 8px;
            }

            .cresta-modal-content::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 0 12px 12px 0;
            }

            .cresta-modal-content::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 4px;
            }

            .cresta-modal-content::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }

            @keyframes modalFadeIn {
                from {
                    opacity: 0;
                    transform: translateY(-50px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            .cresta-modal-header {
                background: linear-gradient(135deg, var(--cresta-primary-color), var(--cresta-primary-color));
                color: var(--cresta-text-on-primary);
                padding: 20px;
                border-radius: 12px 12px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .cresta-modal-header h2 {
                margin: 0;
                font-size: 1.5em;
                font-weight: 600;
            }

            .cresta-close {
                color: var(--cresta-text-on-primary);
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.2s;
                background: none;
                border: none;
                padding: 0;
            }

            .cresta-close:hover {
                opacity: 1;
            }

            .cresta-form-container {
                padding: 25px 25px 35px 25px; /* Extra bottom padding for scrolling comfort */
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
                width: 100% !important;
                padding: 12px !important;
                border: 2px solid #e1e5e9 !important;
                border-radius: 8px !important;
                font-size: 14px !important;
                transition: border-color 0.2s, box-shadow 0.2s !important;
                box-sizing: border-box !important;
                height: 44px !important;
                min-height: 44px !important;
                max-height: 44px !important;
                line-height: 1.2 !important;
                overflow: hidden !important;
                white-space: nowrap !important;
                text-overflow: ellipsis !important;
                resize: none !important;
            }

            /* More specific selectors to override any conflicting styles */
            .cresta-form-group input[type="text"],
            .cresta-form-group input[type="email"],
            .cresta-form-group input[type="url"],
            .cresta-form-group input[type="tel"],
            .cresta-form-group input[type="number"] {
                height: 44px !important;
                min-height: 44px !important;
                max-height: 44px !important;
                overflow: hidden !important;
                white-space: nowrap !important;
                resize: none !important;
            }

            /* Nuclear option - super specific targeting */
            #crestaSettingsModal .cresta-form-group input:not([type="color"]) {
                height: 44px !important;
                min-height: 44px !important;
                max-height: 44px !important;
                padding: 12px !important;
                overflow: hidden !important;
                white-space: nowrap !important;
                resize: none !important;
                vertical-align: top !important;
            }

            /* Force textarea elements to be single line */
            #crestaSettingsModal .cresta-form-group textarea,
            #crestaSettingsModal textarea:not([rows]),
            .cresta-form-group textarea,
            textarea:not([rows]) {
                height: 44px !important;
                min-height: 44px !important;
                max-height: 44px !important;
                overflow: hidden !important;
                white-space: nowrap !important;
                resize: none !important;
                vertical-align: top !important;
                padding: 12px !important;
                border: 2px solid #e1e5e9 !important;
                border-radius: 8px !important;
                font-size: 14px !important;
                box-sizing: border-box !important;
                line-height: 1.2 !important;
                text-overflow: ellipsis !important;
            }

            /* Ultra-specific override to ensure normal padding */
            #crestaSettingsModal .cresta-form-group input,
            #crestaSettingsModal .cresta-form-group textarea,
            #crestaSettingsModal input,
            #crestaSettingsModal textarea {
                padding-left: 12px !important;
                padding-right: 12px !important;
            }

            /* Hide or reposition any overlapping icons in input fields */
            .cresta-form-group .input-group-append,
            .cresta-form-group .input-group-text,
            .cresta-form-group svg,
            .cresta-form-group .more-icon,
            .cresta-form-group .dropdown-toggle::after,
            #crestaSettingsModal svg:not(.cresta-close):not(#crestaMicIcon) {
                display: none !important;
            }

            /* If icons can't be hidden, position them properly */
            .cresta-form-group {
                position: relative !important;
            }

            .cresta-form-group svg {
                position: absolute !important;
                right: 8px !important;
                top: 50% !important;
                transform: translateY(-50%) !important;
                z-index: 1 !important;
                pointer-events: none !important;
            }

            /* Special styling for color picker inputs */
            .cresta-form-group input[type="color"] {
                height: 50px !important;
                min-height: 50px !important;
                max-height: 50px !important;
                padding: 4px !important;
                border: 2px solid #e1e5e9 !important;
                border-radius: 8px !important;
                background: none !important;
                cursor: pointer !important;
                overflow: visible !important;
                white-space: normal !important;
                text-overflow: clip !important;
                resize: none !important;
            }

            .cresta-form-group input[type="color"]::-webkit-color-swatch-wrapper {
                padding: 0;
                border-radius: 6px;
                border: none;
            }

            .cresta-form-group input[type="color"]::-webkit-color-swatch {
                border: none;
                border-radius: 6px;
            }

            .cresta-form-group input[type="color"]::-moz-color-swatch {
                border: none;
                border-radius: 6px;
            }

            .cresta-form-group input:focus {
                outline: none;
                border-color: var(--cresta-primary-color);
                box-shadow: 0 0 0 3px color-mix(in srgb, var(--cresta-primary-color) 10%, transparent);
            }

            .cresta-form-group input::placeholder {
                color: #999;
                font-style: italic;
            }

            .cresta-form-buttons {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e1e5e9;
            }

            .cresta-btn {
                padding: 12px 20px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }

            .cresta-btn-primary {
                background-color: var(--cresta-primary-color);
                color: var(--cresta-text-on-primary);
            }

            .cresta-btn-primary:hover {
                background-color: var(--cresta-primary-color);
                opacity: 0.9;
                transform: translateY(-1px);
            }

            .cresta-btn-secondary {
                background-color: #f8f9fa;
                color: #495057;
                border: 1px solid #dee2e6;
            }

            .cresta-btn-secondary:hover {
                background-color: #e9ecef;
                transform: translateY(-1px);
            }

            .cresta-btn-danger {
                background-color: #f8f9fa;
                color: #495057;
                border: 1px solid #dee2e6;
            }

            .cresta-btn-danger:hover {
                background-color: #e9ecef;
                transform: translateY(-1px);
            }

            /* Chat widget styles */
            df-messenger {
                --df-messenger-button-titlebar-color: var(--cresta-primary-color) !important;
                --df-messenger-chat-background-color: var(--cresta-chat-bg-color) !important;
                --df-messenger-button-titlebar-font-color: var(--cresta-text-on-primary) !important;
                --df-messenger-minimized-chat-close-icon-color: var(--cresta-close-icon-color) !important;
                --df-messenger-user-message-background-color: var(--cresta-user-msg-bg-color) !important;
                --df-messenger-user-message-text-color: var(--cresta-user-msg-text-color) !important;
                --ai-message-background-color: var(--ai-message-background-color) !important;
                --ai-message-text-color: var(--ai-message-text-color) !important;
                --ai-message-window-desktop-width: 500px !important;
                --ai-message-window-desktop-height: 600px !important;
                --df-messenger-send-icon-color: var(--cresta-send-icon-color) !important;
                --df-messenger-input-border-color: var(--cresta-input-border-color) !important;
                --widget-messenger-background-color: var(--cresta-widget-bg-color) !important;
            }

            /* Toast notification animation */
            @keyframes toastSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(100px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
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
        const existingClearSession = document.getElementById('crestaClearSessionButton');
        const existingModal = document.getElementById('crestaSettingsModal');
        
        if (existingMic) existingMic.remove();
        if (existingSettings) existingSettings.remove();
        if (existingClearSession) existingClearSession.remove();
        if (existingModal) existingModal.remove();
    
        // Create microphone button container
        const micButton = document.createElement('div');
        micButton.id = 'crestaInjectedMicButton';
        micButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path id="crestaMicIcon" d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2zm-5 9a7 7 0 0 0 7-7h2a9 9 0 0 1-18 0h2a7 7 0 0 0 7 7z" fill="currentColor"/>
            </svg>
        `;

        // Create settings button
        const settingsButton = document.createElement('button');
        settingsButton.id = 'crestaSettingsButton';
        settingsButton.textContent = '🎨';
        settingsButton.title = 'Cresta Settings';

        // Create clear session button
        const clearSessionButton = document.createElement('button');
        clearSessionButton.id = 'crestaClearSessionButton';
        clearSessionButton.textContent = '🗑️';
        clearSessionButton.title = 'Clear Chat Session';

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
        document.body.appendChild(clearSessionButton);
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
        
        // Update CSS variables immediately
        updateCSSVariables();
        
        if (settings.backgroundImage) {
            applyBackgroundImage(settings.backgroundImage);
        }
        
        console.log('Settings saved to localStorage:', settings);
    }

    function updateCSSVariables() {
        const root = document.documentElement;
        root.style.setProperty('--cresta-primary-color', localStorage.getItem('titlebarColor') || '#a21523');
        root.style.setProperty('--cresta-text-on-primary', localStorage.getItem('titlebarFontColor') || 'white');
        root.style.setProperty('--cresta-chat-bg-color', localStorage.getItem('chatBackgroundColor') || '#f1f2f4');
        root.style.setProperty('--cresta-close-icon-color', localStorage.getItem('closeIconColor') || 'black');
        root.style.setProperty('--cresta-user-msg-bg-color', localStorage.getItem('userMessageBackgroundColor') || 'black');
        root.style.setProperty('--cresta-user-msg-text-color', localStorage.getItem('userMessageTextColor') || 'white');
        root.style.setProperty('--cresta-ai-msg-bg-color', localStorage.getItem('aiMessageBackgroundColor') || 'black');
        root.style.setProperty('--cresta-ai-msg-text-color', localStorage.getItem('aiMessageTextColor') || 'black');
        root.style.setProperty('--cresta-send-icon-color', localStorage.getItem('sendIconColor') || 'black');
        root.style.setProperty('--cresta-input-border-color', localStorage.getItem('inputBorderColor') || 'black');
        root.style.setProperty('--cresta-widget-bg-color', localStorage.getItem('widgetBackgroundColor') || 'white');
        root.style.setProperty('--ai-message-background-color', localStorage.getItem('aiMessageBackgroundColor') || 'black');
        root.style.setProperty('--ai-message-text-color', localStorage.getItem('aiMessageTextColor') || 'black');
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
        
        let chatAiAgentId = '01966042-7272-7049-9b8e-28a51a77b4e4';
        let voiceAgentId = '01966042-7272-7049-9b8e-28a51a77b4e4';
        
        if (phoneNumber) {
            try {
                const agentIds = await fetchAgentIds(phoneNumber);
                if (agentIds) {
                    chatAiAgentId = chatAiAgentId;
                    voiceAgentId = voiceAgentId;
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
        dfMessenger.setAttribute("twilio-app-sid", "APcef9cfbaaed1b5d8e6a7152359d6586d");
        dfMessenger.setAttribute("custom-twilio-call-params", `{"From": "webclient", "origin": "chatwidget", "To": "${phoneNumber}"}`);
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
        script.src = 'https://cdn.cresta.com/ccw-demo-old-iframe-allowed/index.js';
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

    // Helper function to process icon URLs
    function processIconUrl(value, property) {
        if (!value.trim()) return value;
        
        // For chatIcon and headerIcon, check if it's just a filename
        if (property === 'chatIcon' || property === 'headerIcon') {
            // If value doesn't contain "/" and doesn't start with "http", it's a filename
            if (!value.includes('/') && !value.startsWith('http')) {
                return '../../files/' + value;
            }
        }
        
        return value;
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
                    // Process URLs (auto-prepend path for icon filenames)
                    const processedValue = processIconUrl(value, property);
                    updatedSettings[property] = processedValue;
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

    // Function to clear chat session storage
    function clearChatSessions() {
        if (confirm('Are you sure you want to clear all chat sessions? This will remove chat history and session data.')) {
            const keysToRemove = [];
            
            // Find all localStorage keys that end with the specified patterns
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.endsWith('${_EXISTING_SESSION_ID}') || key.endsWith('${_EXISTING_SESSION_MESSAGES}'))) {
                    keysToRemove.push(key);
                }
            }
            
            // Remove the found keys
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log('Removed localStorage key:', key);
            });
            
            if (keysToRemove.length > 0) {
                showSuccessMessage(`Cleared ${keysToRemove.length} chat session(s). Page will refresh to apply changes.`);
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                showSuccessMessage('No chat sessions found to clear.');
            }
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

        const clearSessionButton = document.getElementById('crestaClearSessionButton');
        if (clearSessionButton) {
            clearSessionButton.addEventListener('click', function(event) {
                event.preventDefault();
                clearChatSessions();
            });
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
            updateCSSVariables(); // Apply any existing settings
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