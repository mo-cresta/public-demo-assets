(function() {
    // Get configurable colors from localStorage or use defaults
    const titlebarColor = localStorage.getItem('titlebarColor') || 'black';
    const chatBackgroundColor = localStorage.getItem('chatBackgroundColor') || '#f1f2f4';
    const titlebarFontColor = localStorage.getItem('titlebarFontColor') || 'white';
    const closeIconColor = localStorage.getItem('closeIconColor') || 'black';
    const userMessageBackgroundColor = localStorage.getItem('userMessageBackgroundColor') || 'black';
    const userMessageTextColor = localStorage.getItem('userMessageTextColor') || 'white';
    const aiMessageBackgroundColor = localStorage.getItem('aiMessageBackgroundColor') || 'black';
    const aiMessageTextColor = localStorage.getItem('aiMessageTextColor') || 'black';
    const sendIconColor = localStorage.getItem('sendIconColor') || 'black';
    const inputBorderColor = localStorage.getItem('inputBorderColor') || 'black';
    const widgetBackgroundColor = localStorage.getItem('widgetBackgroundColor') || 'white';

    // Create a <style> element and add your CSS rules
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      df-messenger {
        --df-messenger-button-titlebar-color: ${titlebarColor};
        --df-messenger-chat-background-color: ${chatBackgroundColor};
        --df-messenger-button-titlebar-font-color: ${titlebarFontColor};
        --df-messenger-minimized-chat-close-icon-color: ${closeIconColor};
        --df-messenger-user-message-background-color: ${userMessageBackgroundColor};
        --df-messenger-user-message-text-color: ${userMessageTextColor};
        --ai-message-background-color: ${aiMessageBackgroundColor};
        --ai-message-text-color: ${aiMessageTextColor};
        --ai-message-window-desktop-width: 500px;
        --ai-message-window-desktop-height: 600px;
        --df-messenger-send-icon-color: ${sendIconColor};
        --df-messenger-input-border-color: ${inputBorderColor};
        --widget-messenger-background-color: ${widgetBackgroundColor};
      }
    `;
    document.head.appendChild(styleEl);
  
    // Create a <link> element for the external stylesheet
    const linkEl = document.createElement('link');
    linkEl.href = "https://va-widget.us-west-2-prod.cresta.ai/chatgpt-widget-v2/index.css";
    linkEl.rel = "stylesheet";
    document.head.appendChild(linkEl);
  })();
  
  // Wait for DOM to be ready before manipulating document.body
  async function initializeMessenger() {
      // Get phone number and fetch agent IDs
      const urlParams = new URLSearchParams(window.location.search);
      const phoneNumber = urlParams.get('aiAgentAssociatedPhoneNumber') || localStorage.getItem('aiAgentAssociatedPhoneNumber');
      
      let chatAiAgentId = ''; // default fallback
      let voiceAgentId = chatAiAgentId; // default fallback
      
      if (phoneNumber) {
          try {
              const response = await fetch(`https://connecttocresta-9063.twil.io/map_call_to_specific_ID?lookupPhoneNumber=${phoneNumber}`);
              if (response.ok) {
                  const data = await response.json();
                  chatAiAgentId = data.chatAiAgentId || chatAiAgentId;
                  voiceAgentId = data.voiceAiAgentId || voiceAgentId;
                  console.log('Agent IDs fetched for modal:', { chatAiAgentId, voiceAgentId });
              } else {
                  console.error('Failed to fetch agent IDs, using defaults');
              }
          } catch (error) {
              console.error('Error fetching agent IDs for modal:', error);
          }
      }
      
      const namespace = localStorage.getItem('namespace') || 'virtual-agent-sandbox';
      const chatIcon = localStorage.getItem('chatIcon') || 'https://cdn.prod.website-files.com/67fe49bf21b9f9d5b910d3c9/68714b1e1f2e554671269174_chat_widget_button%20(1).svg';
      const headerIcon = localStorage.getItem('headerIcon') || 'https://cdn.prod.website-files.com/67fe49bf21b9f9d5b910d3c9/68714b1e1f2e554671269174_chat_widget_button%20(1).svg';
      const chatTitle = localStorage.getItem('chatTitle') || 'Cresta';
      const useCase = 'virtual-agent-sandbox-voice';
      const customerName = 'cresta';
      
      const dfMessenger = document.createElement('df-messenger');
      dfMessenger.setAttribute('chat-title', chatTitle);
      dfMessenger.setAttribute('chat-subtitle', "Chat with an AI Agent!");
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
      dfMessenger.setAttribute('auto-start', 'false');
      dfMessenger.setAttribute("popup-delay-show", "1000");
      dfMessenger.setAttribute("popup-delay-hide", "5000");
      dfMessenger.setAttribute('should-hide-popup-on-device-type', 'mobile');
      dfMessenger.setAttribute("position", "right");
      dfMessenger.setAttribute("chat-window-horizontal-position", "right");
      document.body.appendChild(dfMessenger);
      const script = document.createElement('script');
      script.src = 'https://cdn.cresta.com/ccw-demo-old-iframe-allowed/index.js';
      document.body.appendChild(script);
  }
  
  // Check if DOM is already loaded
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeMessenger);
  } else {
      // DOM is already loaded
      initializeMessenger();
  }