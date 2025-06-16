import React from 'react';
import { FlexPlugin } from '@twilio/flex-plugin';
import * as Flex from '@twilio/flex-ui';

const PLUGIN_NAME = 'SeDemoPlugin';

export default class SeDemoPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { Flex.Manager }
   */
  async init(flex, manager) {
    // Remove Twilio logo from header
    flex.MainHeader.Content.remove('logo');

    flex.AgentDesktopView.defaultProps.splitterOptions = {
      ...flex.AgentDesktopView.defaultProps.splitterOptions,
      minimumSecondPanelSize: '0%',
      secondPanelMinSize: '0%',
      secondPanelMaxSize: '0%',
      secondPanelDefaultSize: '0%',
      showSecondPanel: false,
      disableSecondPanel: true,
    };
    
    // Optional: inject CSS to hide the separator bar completely
    const style = document.createElement('style');
    style.innerHTML = `
      *[class*="Twilio-AgentDesktopView.Panel2"]{
        display: none !important; /* Hides Panel2 */
      }
    `;
    document.head.appendChild(style);
  }
}
