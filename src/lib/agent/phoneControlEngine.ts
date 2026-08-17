// Gemini-Style Phone Control Agent Core Engine
// Simulates Android AccessibilityService, Screen Reader, Action Validation & Agent Loop

export interface ActionRequest {
  type: 'open_app' | 'back' | 'home' | 'recents' | 'click_text' | 'type_text' | 'scroll' | 'swipe' | 'wait';
  target?: string;
  text?: string;
  x?: number;
  y?: number;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
}

export interface AgentCommand {
  goal: string;
  actions: ActionRequest[];
}

export interface ScreenElement {
  id: string;
  text?: string;
  description?: string;
  clickable: boolean;
  editable: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface ScreenSnapshot {
  screenId: string;
  title: string;
  packageName: string;
  elements: ScreenElement[];
}

export interface ExecutionResult {
  success: boolean;
  message: string;
  updatedScreenId?: string;
}

export type AgentResult = 
  | { type: 'success'; message: string; stepsExecuted: number }
  | { type: 'failed'; message: string; stepsExecuted: number };

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'action' | 'screen' | 'success' | 'error' | 'validation';
  title: string;
  detail?: string;
  payload?: any;
}

// Predefined Simulated Android Screen States
export const SIMULATED_SCREENS: Record<string, ScreenSnapshot> = {
  home: {
    screenId: 'home',
    title: 'Android Home Screen',
    packageName: 'com.android.launcher3',
    elements: [
      { id: 'app_settings', text: 'Settings', description: 'Settings App Icon', clickable: true, editable: false, x: 50, y: 550, width: 60, height: 60 },
      { id: 'app_youtube', text: 'YouTube', description: 'YouTube App Icon', clickable: true, editable: false, x: 130, y: 550, width: 60, height: 60 },
      { id: 'app_whatsapp', text: 'WhatsApp', description: 'WhatsApp App Icon', clickable: true, editable: false, x: 210, y: 550, width: 60, height: 60 },
      { id: 'app_chrome', text: 'Chrome', description: 'Google Chrome App Icon', clickable: true, editable: false, x: 290, y: 550, width: 60, height: 60 },
      { id: 'search_bar', text: 'Search phone or web', description: 'Google Search Widget', clickable: true, editable: true, x: 40, y: 100, width: 320, height: 48 },
    ]
  },
  settings: {
    screenId: 'settings',
    title: 'Settings',
    packageName: 'com.android.settings',
    elements: [
      { id: 'search_settings', text: 'Search settings', description: 'Search Bar', clickable: true, editable: true, x: 20, y: 80, width: 340, height: 40 },
      { id: 'item_wifi', text: 'Network & internet', description: 'Wi-Fi, Mobile, Hotspot', clickable: true, editable: false, x: 20, y: 150, width: 340, height: 50 },
      { id: 'item_devices', text: 'Connected devices', description: 'Bluetooth, pairing', clickable: true, editable: false, x: 20, y: 210, width: 340, height: 50 },
      { id: 'item_apps', text: 'Apps & notifications', description: 'Permissions, default apps', clickable: true, editable: false, x: 20, y: 270, width: 340, height: 50 },
      { id: 'item_accessibility', text: 'Accessibility', description: 'Screen readers, AI Agent', clickable: true, editable: false, x: 20, y: 330, width: 340, height: 50 },
    ]
  },
  wifi_settings: {
    screenId: 'wifi_settings',
    title: 'Network & internet',
    packageName: 'com.android.settings',
    elements: [
      { id: 'wifi_toggle', text: 'Wi-Fi', description: 'Use Wi-Fi Toggle Switch (OFF)', clickable: true, editable: false, x: 20, y: 100, width: 340, height: 50 },
      { id: 'wifi_status', text: 'Wi-Fi Disabled', description: 'Connection Status', clickable: false, editable: false, x: 20, y: 160, width: 340, height: 30 },
      { id: 'mobile_net', text: 'Mobile network', description: 'SIM 1 Enabled', clickable: true, editable: false, x: 20, y: 210, width: 340, height: 50 },
    ]
  },
  wifi_connected: {
    screenId: 'wifi_connected',
    title: 'Network & internet',
    packageName: 'com.android.settings',
    elements: [
      { id: 'wifi_toggle', text: 'Wi-Fi', description: 'Use Wi-Fi Toggle Switch (ON)', clickable: true, editable: false, x: 20, y: 100, width: 340, height: 50 },
      { id: 'wifi_status', text: 'Connected to Home_5G_Fast', description: 'Wi-Fi Active', clickable: false, editable: false, x: 20, y: 160, width: 340, height: 30 },
      { id: 'network_name', text: 'Home_5G_Fast', description: 'Signal Excellent', clickable: true, editable: false, x: 20, y: 210, width: 340, height: 50 },
    ]
  },
  youtube_home: {
    screenId: 'youtube_home',
    title: 'YouTube',
    packageName: 'com.google.android.youtube',
    elements: [
      { id: 'yt_logo', text: 'YouTube', description: 'YouTube Header Logo', clickable: false, editable: false, x: 20, y: 40, width: 100, height: 30 },
      { id: 'yt_search_btn', text: 'Search', description: 'Search Videos Icon Button', clickable: true, editable: false, x: 280, y: 40, width: 40, height: 40 },
      { id: 'yt_cast', text: 'Cast', description: 'Cast to Device', clickable: true, editable: false, x: 230, y: 40, width: 40, height: 40 },
      { id: 'video_card_1', text: 'Top 10 Android Tips 2026', description: 'Video Thumbnail', clickable: true, editable: false, x: 20, y: 100, width: 340, height: 200 },
    ]
  },
  youtube_search: {
    screenId: 'youtube_search',
    title: 'YouTube Search',
    packageName: 'com.google.android.youtube',
    elements: [
      { id: 'yt_input', text: 'Search YouTube', description: 'Search Query Text Input Field', clickable: true, editable: true, x: 60, y: 40, width: 280, height: 40 },
      { id: 'yt_mic', text: 'Voice Search', description: 'Microphone Search Button', clickable: true, editable: false, x: 340, y: 40, width: 30, height: 40 },
    ]
  },
  youtube_results: {
    screenId: 'youtube_results',
    title: 'YouTube Search Results',
    packageName: 'com.google.android.youtube',
    elements: [
      { id: 'yt_active_query', text: 'Minecraft', description: 'Active Search Query', clickable: true, editable: true, x: 60, y: 40, width: 280, height: 40 },
      { id: 'yt_result_1', text: 'Minecraft 1.22 Update Official Gameplay Trailer', description: 'Mojang Studios - 12M views', clickable: true, editable: false, x: 20, y: 100, width: 340, height: 180 },
      { id: 'yt_result_2', text: 'Minecraft Hardcore Survival - Day 1000', description: 'Gamers Live - 3.4M views', clickable: true, editable: false, x: 20, y: 300, width: 340, height: 180 },
    ]
  },
  whatsapp_home: {
    screenId: 'whatsapp_home',
    title: 'WhatsApp',
    packageName: 'com.whatsapp',
    elements: [
      { id: 'wa_search', text: 'Search', description: 'Search chats or messages', clickable: true, editable: true, x: 20, y: 80, width: 340, height: 40 },
      { id: 'wa_chat_1', text: 'Alex Johnson', description: 'Hey! Are we still meeting today?', clickable: true, editable: false, x: 20, y: 140, width: 340, height: 60 },
      { id: 'wa_chat_2', text: 'Project Group', description: 'Sarah: Updated the Kotlin design specs', clickable: true, editable: false, x: 20, y: 210, width: 340, height: 60 },
    ]
  },
  recents: {
    screenId: 'recents',
    title: 'Recent Apps Overview',
    packageName: 'com.android.systemui',
    elements: [
      { id: 'recent_yt', text: 'YouTube', description: 'Close or switch to YouTube', clickable: true, editable: false, x: 40, y: 120, width: 140, height: 220 },
      { id: 'recent_settings', text: 'Settings', description: 'Close or switch to Settings', clickable: true, editable: false, x: 200, y: 120, width: 140, height: 220 },
      { id: 'clear_all', text: 'Clear all', description: 'Close all running apps', clickable: true, editable: false, x: 140, y: 380, width: 100, height: 40 }
    ]
  }
};

// 1. Action Validator
export class ActionValidator {
  private allowedActions = new Set([
    'open_app',
    'back',
    'home',
    'recents',
    'click_text',
    'type_text',
    'scroll',
    'swipe',
    'wait'
  ]);

  public isAllowed(action: ActionRequest): { allowed: boolean; reason?: string } {
    if (!this.allowedActions.has(action.type)) {
      return { allowed: false, reason: `Action type '${action.type}' is not in the security whitelist.` };
    }

    switch (action.type) {
      case 'open_app':
        if (!action.target || !action.target.trim()) {
          return { allowed: false, reason: 'Target app name or package ID is required for open_app.' };
        }
        break;
      case 'click_text':
        if (!action.text || !action.text.trim()) {
          return { allowed: false, reason: 'Target text is required for click_text action.' };
        }
        break;
      case 'type_text':
        if (action.text === undefined) {
          return { allowed: false, reason: 'Text content is required for type_text action.' };
        }
        // Safety guard against password or banking credentials
        if (/\b(password|pin|otp|cvv|secret|credit card)\b/i.test(action.text)) {
          return { allowed: false, reason: 'Security Policy: Automated typing of passwords or sensitive credentials is blocked.' };
        }
        break;
      case 'swipe':
        if (action.startX === undefined || action.startY === undefined || action.endX === undefined || action.endY === undefined) {
          return { allowed: false, reason: 'Valid coordinates (startX, startY, endX, endY) are required for swipe.' };
        }
        break;
    }

    return { allowed: true };
  }

  public isSensitive(action: ActionRequest, userRequest: string = ''): { sensitive: boolean; reason?: string } {
    const combinedText = `${action.text || ''} ${action.target || ''} ${userRequest}`.toLowerCase();
    
    // Check for sensitive keywords (delete, send, clear, pay, reset, etc.)
    const sensitiveRules = [
      { pattern: /\b(delete|remove|erase|destroy|uninstall)\b/i, label: 'DELETE' },
      { pattern: /\b(send|submit|transfer|pay|purchase|buy|checkout)\b/i, label: 'SEND/PAY' },
      { pattern: /\b(clear|clear all|reset|format|factory reset)\b/i, label: 'CLEAR/RESET' }
    ];

    for (const rule of sensitiveRules) {
      if (rule.pattern.test(combinedText)) {
        return {
          sensitive: true,
          reason: `Action involves a sensitive operation (${rule.label}). Manual confirmation is required before execution.`
        };
      }
    }

    return { sensitive: false };
  }
}

// 2. Screen Reader
export class ScreenReader {
  private currentScreenId: string = 'home';

  public setScreen(screenId: string) {
    if (SIMULATED_SCREENS[screenId]) {
      this.currentScreenId = screenId;
    }
  }

  public getCurrentScreen(): ScreenSnapshot {
    return SIMULATED_SCREENS[this.currentScreenId] || SIMULATED_SCREENS['home'];
  }
}

// 3. AI Planner - Translates natural speech / text commands into Action Requests JSON
export class AiPlanner {
  public plan(userRequest: String, screen: ScreenSnapshot): AgentCommand {
    const req = userRequest.toLowerCase().trim();

    // Example 1: Open YouTube and search Minecraft
    if (req.includes('youtube') && (req.includes('minecraft') || req.includes('search'))) {
      const searchTerm = req.match(/search\s+(.+)$/i)?.[1] || 'Minecraft';
      
      if (screen.screenId === 'home') {
        return {
          goal: `Open YouTube and search ${searchTerm}`,
          actions: [
            { type: 'open_app', target: 'youtube' },
            { type: 'wait' }
          ]
        };
      } else if (screen.screenId === 'youtube_home') {
        return {
          goal: `Click search icon on YouTube`,
          actions: [
            { type: 'click_text', text: 'Search' },
            { type: 'wait' }
          ]
        };
      } else if (screen.screenId === 'youtube_search') {
        return {
          goal: `Type "${searchTerm}" into YouTube search box`,
          actions: [
            { type: 'type_text', text: searchTerm },
            { type: 'wait' }
          ]
        };
      } else if (screen.screenId === 'youtube_results') {
        return {
          goal: `Search completed for "${searchTerm}"`,
          actions: []
        };
      }
    }

    // Example 2: Open Settings and open Wi-Fi
    if (req.includes('settings') && (req.includes('wifi') || req.includes('wi-fi') || req.includes('network'))) {
      if (screen.screenId === 'home') {
        return {
          goal: 'Open Settings app',
          actions: [
            { type: 'open_app', target: 'settings' },
            { type: 'wait' }
          ]
        };
      } else if (screen.screenId === 'settings') {
        return {
          goal: 'Click Network & internet option',
          actions: [
            { type: 'click_text', text: 'Network & internet' },
            { type: 'wait' }
          ]
        };
      } else if (screen.screenId === 'wifi_settings') {
        return {
          goal: 'Enable Wi-Fi toggle',
          actions: [
            { type: 'click_text', text: 'Wi-Fi' },
            { type: 'wait' }
          ]
        };
      } else if (screen.screenId === 'wifi_connected') {
        return {
          goal: 'Wi-Fi enabled and connected',
          actions: []
        };
      }
    }

    // Example 3: Go Home or Back or Recents
    if (req.includes('go home') || req === 'home') {
      return {
        goal: 'Navigate to Android Home Screen',
        actions: [{ type: 'home' }]
      };
    }
    if (req.includes('go back') || req === 'back') {
      return {
        goal: 'Perform Android Back Action',
        actions: [{ type: 'back' }]
      };
    }
    if (req.includes('recents') || req.includes('recent apps')) {
      return {
        goal: 'Open Android Recent Apps Overview',
        actions: [{ type: 'recents' }]
      };
    }

    // Sensitive command examples: Clear All, Delete Message, Send Message
    if (req.includes('clear all') || req.includes('clear recent')) {
      if (screen.screenId !== 'recents') {
        return {
          goal: 'Open Recents to clear running apps',
          actions: [
            { type: 'recents' },
            { type: 'click_text', text: 'Clear all' }
          ]
        };
      }
      return {
        goal: 'Click Clear all in Recents overview',
        actions: [
          { type: 'click_text', text: 'Clear all' },
          { type: 'wait' }
        ]
      };
    }

    if (req.includes('delete message') || req.includes('delete chat') || req.includes('delete')) {
      return {
        goal: 'Perform Sensitive Action: Delete Message',
        actions: [
          { type: 'click_text', text: 'Delete Message' },
          { type: 'wait' }
        ]
      };
    }

    if (req.includes('send message') || req.includes('send text') || req.includes('send email')) {
      return {
        goal: 'Perform Sensitive Action: Send Message',
        actions: [
          { type: 'click_text', text: 'Send Message' },
          { type: 'wait' }
        ]
      };
    }

    // Generic fallback intent matching
    if (req.startsWith('open ') || req.startsWith('launch ')) {
      const appName = req.replace(/^(open|launch)\s+/i, '');
      return {
        goal: `Open ${appName}`,
        actions: [
          { type: 'open_app', target: appName },
          { type: 'wait' }
        ]
      };
    }

    // Fallback search / click on active screen
    const matchingElement = screen.elements.find(el => 
      el.text && req.includes(el.text.toLowerCase())
    );

    if (matchingElement && matchingElement.text) {
      return {
        goal: `Click on element "${matchingElement.text}"`,
        actions: [
          { type: 'click_text', text: matchingElement.text },
          { type: 'wait' }
        ]
      };
    }

    // Fallback standard response
    return {
      goal: `Execute request: "${userRequest}"`,
      actions: [
        { type: 'open_app', target: req.split(' ')[0] || 'settings' },
        { type: 'wait' }
      ]
    };
  }

  public goalCompleted(userRequest: string, screen: ScreenSnapshot): boolean {
    const req = userRequest.toLowerCase();
    if (req.includes('wifi') && screen.screenId === 'wifi_connected') return true;
    if (req.includes('youtube') && req.includes('minecraft') && screen.screenId === 'youtube_results') return true;
    if (req.includes('home') && screen.screenId === 'home') return true;
    return false;
  }
}

// 4. Action Executor - Simulates AccessibilityService gesture execution
export class ActionExecutor {
  constructor(private screenReader: ScreenReader) {}

  public execute(action: ActionRequest): ExecutionResult {
    const currentScreen = this.screenReader.getCurrentScreen();

    switch (action.type) {
      case 'home':
        this.screenReader.setScreen('home');
        return { success: true, message: 'Accessibility GLOBAL_ACTION_HOME executed', updatedScreenId: 'home' };

      case 'back':
        const prevScreen = currentScreen.screenId === 'wifi_settings' ? 'settings' : 'home';
        this.screenReader.setScreen(prevScreen);
        return { success: true, message: 'Accessibility GLOBAL_ACTION_BACK executed', updatedScreenId: prevScreen };

      case 'recents':
        this.screenReader.setScreen('recents');
        return { success: true, message: 'Accessibility GLOBAL_ACTION_RECENTS executed', updatedScreenId: 'recents' };

      case 'open_app':
        const target = (action.target || '').toLowerCase();
        let targetScreen = 'home';
        if (target.includes('youtube')) targetScreen = 'youtube_home';
        else if (target.includes('settings')) targetScreen = 'settings';
        else if (target.includes('whatsapp')) targetScreen = 'whatsapp_home';

        this.screenReader.setScreen(targetScreen);
        return { 
          success: true, 
          message: `AppController.openApp("${target}") launched target package.`, 
          updatedScreenId: targetScreen 
        };

      case 'click_text':
        const textTarget = (action.text || '').toLowerCase();
        
        // Find matching node on current screen
        const element = currentScreen.elements.find(el => 
          (el.text && el.text.toLowerCase().includes(textTarget)) ||
          (el.description && el.description.toLowerCase().includes(textTarget))
        );

        if (!element) {
          return { success: false, message: `NodeFinder: Could not locate clickable node with text "${action.text}".` };
        }

        // Handle screen transitions based on element click
        let nextScreen = currentScreen.screenId;
        if (element.id === 'item_wifi') nextScreen = 'wifi_settings';
        else if (element.id === 'wifi_toggle') nextScreen = 'wifi_connected';
        else if (element.id === 'yt_search_btn') nextScreen = 'youtube_search';
        else if (element.id === 'app_youtube') nextScreen = 'youtube_home';
        else if (element.id === 'app_settings') nextScreen = 'settings';
        else if (element.id === 'app_whatsapp') nextScreen = 'whatsapp_home';

        this.screenReader.setScreen(nextScreen);
        return {
          success: true,
          message: `NodeFinder.clickText("${element.text}") -> AccessibilityNodeInfo.ACTION_CLICK succeeded.`,
          updatedScreenId: nextScreen
        };

      case 'type_text':
        const typeText = action.text || '';
        
        if (currentScreen.screenId === 'youtube_search') {
          this.screenReader.setScreen('youtube_results');
          return {
            success: true,
            message: `TextController.typeText("${typeText}") -> ACTION_SET_TEXT updated editable node.`,
            updatedScreenId: 'youtube_results'
          };
        }

        return {
          success: true,
          message: `TextController.typeText("${typeText}") entered text into active field.`
        };

      case 'swipe':
        return {
          success: true,
          message: `GestureController.dispatchGesture(Swipe from (${action.startX},${action.startY}) to (${action.endX},${action.endY})) completed.`
        };

      case 'wait':
        return {
          success: true,
          message: `Wait timeout completed (300ms delay).`
        };

      default:
        return { success: false, message: `Unknown action type "${action.type}"` };
    }
  }
}

// 5. Phone Control Agent Loop Engine
export class PhoneControlAgent {
  private screenReader = new ScreenReader();
  private validator = new ActionValidator();
  private planner = new AiPlanner();
  private executor = new ActionExecutor(this.screenReader);

  public async runLoop(
    userRequest: string, 
    onLog?: (entry: LogEntry) => void,
    onRequireConfirmation?: (action: ActionRequest, reason: string) => Promise<boolean>,
    onWaitingChange?: (isWaiting: boolean, reason?: string) => void
  ): Promise<AgentResult> {
    let iteration = 0;
    let totalStepsExecuted = 0;

    const addLog = (
      type: LogEntry['type'], 
      title: string, 
      detail?: string, 
      payload?: any
    ) => {
      if (onLog) {
        onLog({
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          type,
          title,
          detail,
          payload
        });
      }
    };

    addLog('info', 'Agent Loop Started', `Goal: "${userRequest}"`);

    while (iteration < 10) {
      iteration++;
      addLog('info', `--- Iteration ${iteration}/10 ---`);

      // 1. Read Current Screen
      const currentScreen = this.screenReader.getCurrentScreen();
      addLog('screen', `ScreenReader: Inspected active window`, `Screen ID: ${currentScreen.screenId} | App: ${currentScreen.packageName}`, currentScreen);

      // 2. AI Planner generates structured Action JSON
      const command = this.planner.plan(userRequest, currentScreen);
      addLog('action', `AI Planner Generated Action Request`, `Goal: ${command.goal}`, command);

      if (command.actions.length === 0) {
        addLog('success', `Goal Reached: No further actions required.`, command.goal);
        return { type: 'success', message: command.goal, stepsExecuted: totalStepsExecuted };
      }

      // 3. Action Validation & Execution
      for (const action of command.actions) {
        // Validate Action Safety
        const validation = this.validator.isAllowed(action);
        if (!validation.allowed) {
          addLog('validation', `Action Blocked by ActionValidator`, validation.reason, action);
          return { type: 'failed', message: `Action blocked: ${validation.reason}`, stepsExecuted: totalStepsExecuted };
        }

        addLog('validation', `Action Whitelist Verified`, `Type: ${action.type}`, action);

        // Check if action is sensitive (delete, send, clear, pay, etc.)
        const sensitiveCheck = this.validator.isSensitive(action, userRequest);
        if (sensitiveCheck.sensitive) {
          addLog('validation', `⚠️ Sensitive Action Flagged`, sensitiveCheck.reason, action);

          if (onRequireConfirmation) {
            if (onWaitingChange) onWaitingChange(true, 'Awaiting manual user confirmation...');
            const approved = await onRequireConfirmation(action, sensitiveCheck.reason || 'Confirmation required for sensitive action');
            if (onWaitingChange) onWaitingChange(false);

            if (!approved) {
              addLog('error', `Action Rejected by User`, `User declined manual confirmation for sensitive action.`, action);
              return { type: 'failed', message: 'Task cancelled: sensitive action confirmation declined by user.', stepsExecuted: totalStepsExecuted };
            }

            addLog('info', `User Confirmation Granted`, `User approved sensitive action. Proceeding with execution.`, action);
          }
        }

        // Execute Action via AccessibilityService
        if (onWaitingChange && action.type === 'wait') {
          onWaitingChange(true, 'Executing UI wait delay...');
        }

        const execResult = this.executor.execute(action);
        totalStepsExecuted++;

        if (!execResult.success) {
          if (onWaitingChange) onWaitingChange(false);
          addLog('error', `Execution Failed`, execResult.message, action);
          return { type: 'failed', message: execResult.message, stepsExecuted: totalStepsExecuted };
        }

        addLog('success', `Accessibility Action Executed`, execResult.message, execResult);
        
        // Artificial delay phase between steps
        if (onWaitingChange) onWaitingChange(true, 'Pausing for UI transition (350ms)...');
        await new Promise(res => setTimeout(res, 350));
        if (onWaitingChange) onWaitingChange(false);
      }

      // 4. Re-inspect screen & verify goal completion
      const newScreen = this.screenReader.getCurrentScreen();
      if (this.planner.goalCompleted(userRequest, newScreen)) {
        addLog('success', `Goal Verified Completed!`, `Successfully fulfilled goal: "${userRequest}"`);
        return { type: 'success', message: `Task completed successfully: ${userRequest}`, stepsExecuted: totalStepsExecuted };
      }

      if (onWaitingChange) onWaitingChange(true, 'Waiting for screen settlement (400ms)...');
      await new Promise(res => setTimeout(res, 400));
      if (onWaitingChange) onWaitingChange(false);
    }

    addLog('error', 'Task stopped', 'Reached maximum iteration limit (10 steps)');
    return { type: 'failed', message: 'Task stopped because the action limit was reached.', stepsExecuted: totalStepsExecuted };
  }

  public getScreenReader(): ScreenReader {
    return this.screenReader;
  }
}
