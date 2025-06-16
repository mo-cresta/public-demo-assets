(function() {
    // Create a <style> element and add your CSS rules
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      df-messenger {
        --df-messenger-button-titlebar-color: black;
        --df-messenger-chat-background-color: #f1f2f4;
        --df-messenger-button-titlebar-font-color: white;
        --df-messenger-minimized-chat-close-icon-color: black;
        --df-messenger-user-message-background-color: black;
        --df-messenger-user-message-text-color: white;
        --ai-message-background-color: black;
        --ai-message-text-color: black;
        --ai-message-window-desktop-width: 500px;
        --ai-message-window-desktop-height: 600px;
        --df-messenger-send-icon-color: black;
        --df-messenger-input-border-color: black;
        --widget-messenger-background-color: white;
      }
    `;
    document.head.appendChild(styleEl);
  
    // Create a <link> element for the external stylesheet
    const linkEl = document.createElement('link');
    linkEl.href = "https://va-widget.us-west-2-prod.cresta.ai/chatgpt-widget-v2/index.css";
    linkEl.rel = "stylesheet";
    document.head.appendChild(linkEl);
  })();
  
  (function() {
      // Get parameters from localStorage or use defaults
      const aiAgentId = localStorage.getItem('aiAgentId') || 'b414de7f-7b26-42e0-8489-0834619014ed';
      const namespace = localStorage.getItem('namespace') || 'virtual-agent-sandbox';
      const useCase = 'virtual-agent-sandbox-voice';
      const customerName = 'cresta';
      
      console.log('Using AI Agent ID:', aiAgentId);
      console.log('Using namespace:', namespace);
      
      const dfMessenger = document.createElement('df-messenger');
     dfMessenger.setAttribute('chat-title', 'Cresta');
     dfMessenger.setAttribute('persist-session', 'true');
     dfMessenger.setAttribute('chat-icon', 'https://cresta.com/wp-content/uploads/2024/06/cresta-c-80x80-1.png');
     dfMessenger.setAttribute('crestagpt-api', 'https://api-virtual-agent-sandbox.cresta.com');
     dfMessenger.setAttribute('crestagpt-agent', aiAgentId);
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
  })();