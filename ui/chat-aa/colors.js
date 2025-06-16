// Default colors and settings
const defaultSettings = {
    primaryColor: 'rgb(162, 21, 35)',
    textOnPrimary: 'white',
    visitorBg: 'white',
    textOnVisitor: 'black',
    contentBgImage: 'url("./images/verizon-troubleshooting.png")'
};

// Function to update settings
function updateSettings(settings) {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', settings.primaryColor);
    root.style.setProperty('--text-on-primary', settings.textOnPrimary);
    root.style.setProperty('--visitor-bg', settings.visitorBg);
    root.style.setProperty('--text-on-visitor', settings.textOnVisitor);
    root.style.setProperty('--content-bg-image', settings.contentBgImage);
}

// Function to handle settings
async function handleColorSettings() {
    const currentSettings = {
        primaryColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim(),
        textOnPrimary: getComputedStyle(document.documentElement).getPropertyValue('--text-on-primary').trim(),
        visitorBg: getComputedStyle(document.documentElement).getPropertyValue('--visitor-bg').trim(),
        textOnVisitor: getComputedStyle(document.documentElement).getPropertyValue('--text-on-visitor').trim(),
        contentBgImage: getComputedStyle(document.documentElement).getPropertyValue('--content-bg-image').trim()
    };

    const settingsPrompt = `Enter new settings (one per line, format: property: value):
Available properties: primaryColor, textOnPrimary, visitorBg, textOnVisitor, contentBgImage

Current settings:
primaryColor: ${currentSettings.primaryColor}
textOnPrimary: ${currentSettings.textOnPrimary}
visitorBg: ${currentSettings.visitorBg}
textOnVisitor: ${currentSettings.textOnVisitor}
contentBgImage: ${currentSettings.contentBgImage}

Note: For contentBgImage, use format: url("./path/to/image.png")`;

    const newSettings = window.prompt(settingsPrompt, 
        Object.entries(currentSettings)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n')
    );

    if (newSettings) {
        const updatedSettings = {};
        newSettings.split('\n').forEach(line => {
            const [property, value] = line.split(':').map(s => s.trim());
            if (property && value) {
                updatedSettings[property] = value;
            }
        });

        // Update settings
        updateSettings(updatedSettings);

        // Save to Chrome storage
        chrome.storage.local.set({ settings: updatedSettings });
    }
}

// Initialize settings from storage or defaults
chrome.storage.local.get('settings', (result) => {
    if (result.settings) {
        updateSettings(result.settings);
    } else {
        updateSettings(defaultSettings);
        chrome.storage.local.set({ settings: defaultSettings });
    }
}); 