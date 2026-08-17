import { AppItem, INSTALLED_APPS, InAppActionType } from '@/lib/launcher/appsData';
import {
  parseInAppActionFromCommand,
  launchInAppAction,
  launchApp,
  findAppByQuery,
  LaunchResult,
} from '@/lib/launcher/appLauncherEngine';
import { globalIrisPermanentMemory } from './permanentMemory';

export interface AppOperationStep {
  stepId: number;
  description: string;
  timestamp: number;
  status: 'completed' | 'failed' | 'pending';
}

export interface AppOperationResult {
  success: boolean;
  command: string;
  matchedApp: AppItem | null;
  actionType: InAppActionType;
  searchQuery: string;
  launchResult: LaunchResult | null;
  steps: AppOperationStep[];
  formattedResponse: string;
}

export class IrisAppOperationEngine {
  /**
   * Executes an autonomous app opening & operating command
   */
  public executeOperation(commandStr: string): AppOperationResult {
    const timestamp = Date.now();
    const cleanCommand = commandStr.trim();
    const steps: AppOperationStep[] = [
      {
        stepId: 1,
        description: `Parsed command intent: "${cleanCommand}"`,
        timestamp,
        status: 'completed',
      },
    ];

    const actionData = parseInAppActionFromCommand(cleanCommand);

    if (!actionData.matchedApp) {
      steps.push({
        stepId: 2,
        description: `Failed to locate matching installed application.`,
        timestamp: Date.now(),
        status: 'failed',
      });

      return {
        success: false,
        command: cleanCommand,
        matchedApp: null,
        actionType: 'launch',
        searchQuery: '',
        launchResult: null,
        steps,
        formattedResponse: `### ⚠️ Application Not Found\n\nI couldn't identify an installed application matching **"${cleanCommand}"**.\n\n- **Available Apps:** YouTube, Spotify, WhatsApp, Google Chrome, Camera, Settings, Maps, Play Store, Gmail, Photos, Contacts, Phone, Messages, Drive, Calendar, Clock, Files, Reddit, Amazon, GitHub, Telegram, Calculator.\n- **Action:** Open the **App Launcher** panel to view installed apps.`,
      };
    }

    const app = actionData.matchedApp;
    const actionType = actionData.actionType || 'launch';
    const searchQuery = actionData.searchQuery || '';

    steps.push({
      stepId: 2,
      description: `Identified target application: ${app.name} (${app.packageName})`,
      timestamp: Date.now(),
      status: 'completed',
    });

    let launchResult = actionData.launchResult;

    if (!launchResult) {
      if (searchQuery) {
        launchResult = launchInAppAction(app, searchQuery, actionType);
      } else {
        launchResult = launchApp(app);
      }
    }

    steps.push({
      stepId: 3,
      description: `Executed operation (${actionType}): ${launchResult?.message || 'App intent dispatched'}`,
      timestamp: Date.now(),
      status: launchResult?.success ? 'completed' : 'failed',
    });

    // Save history fact in permanent memory bank
    globalIrisPermanentMemory.saveFact(
      `App Operation Executed: ${app.name} (${actionType} "${searchQuery || 'launch'}") at ${new Date().toLocaleTimeString()}`,
      'app_operations'
    );

    const isAndroid = launchResult?.launchType === 'intent';
    const launchTypeLabel = isAndroid ? 'Android Native Intent' : 'Web Deep Link Fallback';

    let formattedResponse = '';

    if (searchQuery) {
      formattedResponse = `### 📱 App Operating Executed: ${app.name}\n\nI opened **${app.name}** and executed your in-app operation for **"${searchQuery}"**.\n\n[[APP_ACTION_CARD:${app.id}|${app.name}|${actionType}|${encodeURIComponent(searchQuery)}|${encodeURIComponent(launchResult?.deepUrl || '')}|${encodeURIComponent(launchResult?.deepScheme || '')}|${launchResult?.launchType || 'web_fallback'}]]\n\n- **Target Application:** ${app.name}\n- **Package ID:** \`${app.packageName}\`\n- **Action Type:** ${actionType.toUpperCase()}\n- **Query / Parameter:** \`${searchQuery}\`\n- **Execution Mode:** ${launchTypeLabel}\n- **Status:** ${launchResult?.success ? '✅ Operation Dispatched Successfully' : '⚠️ Application Search Active'}`;
    } else {
      formattedResponse = `### 🚀 App Opening Executed: ${app.name}\n\nI opened **${app.name}** using the app launcher engine.\n\n[[APP_LAUNCH_CARD:${app.id}|${app.name}|${app.packageName}|${app.category}|${encodeURIComponent(app.fallbackUrl)}|${launchResult?.launchType || 'web_fallback'}]]\n\n- **Application:** ${app.name}\n- **Package ID:** \`${app.packageName}\`\n- **Category:** ${app.category.toUpperCase()}\n- **Execution Mode:** ${launchTypeLabel}\n- **Status:** ${launchResult?.success ? '✅ App Opened Successfully' : '🌐 Opened Fallback'}`;
    }

    return {
      success: launchResult?.success ?? false,
      command: cleanCommand,
      matchedApp: app,
      actionType,
      searchQuery,
      launchResult,
      steps,
      formattedResponse,
    };
  }
}

export const globalIrisAppOperationEngine = new IrisAppOperationEngine();
