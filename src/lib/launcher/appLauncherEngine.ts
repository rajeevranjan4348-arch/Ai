import { AppItem, INSTALLED_APPS, InAppActionType } from './appsData';

export interface LaunchResult {
  success: boolean;
  appName: string;
  packageName: string;
  launchType: 'intent' | 'scheme' | 'web_fallback' | 'not_installed';
  message: string;
  actionType?: InAppActionType;
  searchQuery?: string;
  deepUrl?: string;
  deepScheme?: string;
}

export function isAndroidDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /android/i.test(ua);
}

/**
 * Generate Deep Search / Action URL & Intent Scheme for a given application
 */
export function buildInAppActionUrls(app: AppItem, searchQuery: string, actionType: string = 'search'): {
  deepUrl: string;
  deepScheme: string;
} {
  const cleanQ = (searchQuery || '').trim();
  const encodedQ = encodeURIComponent(cleanQ);

  if (app.actionConfig?.searchUrlTemplate) {
    const deepUrl = cleanQ ? app.actionConfig.searchUrlTemplate.replace('{q}', encodedQ) : app.fallbackUrl;
    let deepScheme = app.scheme;
    if (cleanQ && app.actionConfig.searchIntentTemplate) {
      deepScheme = app.actionConfig.searchIntentTemplate.replace('{q}', encodedQ);
    }
    return { deepUrl, deepScheme };
  }

  // Fallbacks for known app categories
  switch (app.id) {
    case 'youtube':
      return {
        deepUrl: cleanQ ? `https://www.youtube.com/results?search_query=${encodedQ}` : 'https://www.youtube.com',
        deepScheme: cleanQ 
          ? `intent://www.youtube.com/results?search_query=${encodedQ}#Intent;package=com.google.android.youtube;scheme=https;end` 
          : app.scheme,
      };
    case 'spotify':
      return {
        deepUrl: cleanQ ? `https://open.spotify.com/search/${encodedQ}` : 'https://open.spotify.com',
        deepScheme: cleanQ 
          ? `intent://open.spotify.com/search/${encodedQ}#Intent;package=com.spotify.music;scheme=https;end` 
          : app.scheme,
      };
    case 'chrome':
      return {
        deepUrl: cleanQ ? `https://www.google.com/search?q=${encodedQ}` : 'https://www.google.com',
        deepScheme: cleanQ 
          ? `intent://www.google.com/search?q=${encodedQ}#Intent;package=com.android.chrome;scheme=https;end` 
          : app.scheme,
      };
    case 'maps':
      return {
        deepUrl: cleanQ ? `https://www.google.com/maps/search/${encodedQ}` : 'https://maps.google.com',
        deepScheme: cleanQ 
          ? `intent://maps.google.com/maps?q=${encodedQ}#Intent;package=com.google.android.apps.maps;scheme=https;end` 
          : app.scheme,
      };
    case 'playstore':
      return {
        deepUrl: cleanQ ? `https://play.google.com/store/search?q=${encodedQ}&c=apps` : 'https://play.google.com',
        deepScheme: cleanQ ? `market://search?q=${encodedQ}` : app.scheme,
      };
    case 'whatsapp':
      return {
        deepUrl: cleanQ ? `https://web.whatsapp.com/send?text=${encodedQ}` : 'https://web.whatsapp.com',
        deepScheme: cleanQ ? `intent://send?text=${encodedQ}#Intent;package=com.whatsapp;scheme=whatsapp;end` : app.scheme,
      };
    case 'instagram':
      return {
        deepUrl: cleanQ ? `https://www.instagram.com/explore/tags/${encodeURIComponent(cleanQ.replace(/\s+/g, ''))}` : 'https://www.instagram.com',
        deepScheme: cleanQ 
          ? `intent://instagram.com/explore/tags/${encodeURIComponent(cleanQ.replace(/\s+/g, ''))}#Intent;package=com.instagram.android;scheme=https;end` 
          : app.scheme,
      };
    case 'twitter':
      return {
        deepUrl: cleanQ ? `https://x.com/search?q=${encodedQ}` : 'https://x.com',
        deepScheme: cleanQ ? `intent://twitter.com/search?q=${encodedQ}#Intent;package=com.twitter.android;scheme=https;end` : app.scheme,
      };
    case 'netflix':
      return {
        deepUrl: cleanQ ? `https://www.netflix.com/search?q=${encodedQ}` : 'https://www.netflix.com',
        deepScheme: cleanQ ? `intent://www.netflix.com/search?q=${encodedQ}#Intent;package=com.netflix.mediaclient;scheme=https;end` : app.scheme,
      };
    case 'gmail':
      return {
        deepUrl: cleanQ ? `https://mail.google.com/mail/u/0/#search/${encodedQ}` : 'https://mail.google.com',
        deepScheme: cleanQ ? `intent://mail.google.com/mail/u/0/#search/${encodedQ}#Intent;package=com.google.android.gm;scheme=https;end` : app.scheme,
      };
    case 'drive':
      return {
        deepUrl: cleanQ ? `https://drive.google.com/drive/search?q=${encodedQ}` : 'https://drive.google.com',
        deepScheme: cleanQ ? `intent://drive.google.com/drive/search?q=${encodedQ}#Intent;package=com.google.android.apps.docs;scheme=https;end` : app.scheme,
      };
    case 'photos':
      return {
        deepUrl: cleanQ ? `https://photos.google.com/search/${encodedQ}` : 'https://photos.google.com',
        deepScheme: cleanQ ? `intent://photos.google.com/search/${encodedQ}#Intent;package=com.google.android.apps.photos;scheme=https;end` : app.scheme,
      };
    case 'reddit':
      return {
        deepUrl: cleanQ ? `https://www.reddit.com/search/?q=${encodedQ}` : 'https://www.reddit.com',
        deepScheme: cleanQ ? `intent://www.reddit.com/search/?q=${encodedQ}#Intent;package=com.reddit.frontpage;scheme=https;end` : app.scheme,
      };
    case 'amazon':
      return {
        deepUrl: cleanQ ? `https://www.amazon.com/s?k=${encodedQ}` : 'https://www.amazon.com',
        deepScheme: cleanQ ? `intent://amazon.com/s?k=${encodedQ}#Intent;package=com.amazon.mShop.android.shopping;scheme=https;end` : app.scheme,
      };
    case 'github':
      return {
        deepUrl: cleanQ ? `https://github.com/search?q=${encodedQ}` : 'https://github.com',
        deepScheme: cleanQ ? `intent://github.com/search?q=${encodedQ}#Intent;package=com.github.android;scheme=https;end` : app.scheme,
      };
    case 'telegram':
      return {
        deepUrl: cleanQ ? `https://web.telegram.org/k/#?q=${encodedQ}` : 'https://web.telegram.org',
        deepScheme: cleanQ ? `tg://search?q=${encodedQ}` : app.scheme,
      };
    case 'calculator':
      return {
        deepUrl: cleanQ ? `https://www.google.com/search?q=calculator+${encodedQ}` : 'https://www.google.com/search?q=calculator',
        deepScheme: app.scheme,
      };
    default:
      return {
        deepUrl: cleanQ ? `https://www.google.com/search?q=${encodeURIComponent(app.name + ' ' + cleanQ)}` : app.fallbackUrl,
        deepScheme: app.scheme,
      };
  }
}

/**
 * Executes a Deep In-App Action (e.g. Search YouTube for "song", Search Spotify for "artist", Search Maps for "cafe")
 */
export function launchInAppAction(app: AppItem, searchQuery: string, actionType: InAppActionType = 'search'): LaunchResult {
  if (typeof window === 'undefined') {
    return {
      success: false,
      appName: app.name,
      packageName: app.packageName,
      launchType: 'not_installed',
      message: 'Environment unavailable.',
      actionType,
      searchQuery,
    };
  }

  const { deepUrl, deepScheme } = buildInAppActionUrls(app, searchQuery, actionType);
  const isAndroid = isAndroidDevice();

  try {
    if (isAndroid) {
      const targetUri = deepScheme || app.scheme;
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = targetUri;
      document.body.appendChild(iframe);

      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1200);

      setTimeout(() => {
        window.location.href = targetUri;
      }, 100);

      return {
        success: true,
        appName: app.name,
        packageName: app.packageName,
        launchType: 'intent',
        message: `Dispatched Android intent for ${app.name} (${actionType}: "${searchQuery}").`,
        actionType,
        searchQuery,
        deepUrl,
        deepScheme: targetUri,
      };
    } else {
      // Open Deep Search Web URL
      window.open(deepUrl, '_blank', 'noopener,noreferrer');

      return {
        success: true,
        appName: app.name,
        packageName: app.packageName,
        launchType: 'web_fallback',
        message: `Opened ${app.name} with search "${searchQuery}" (${deepUrl}).`,
        actionType,
        searchQuery,
        deepUrl,
        deepScheme,
      };
    }
  } catch (err: any) {
    if (deepUrl || app.fallbackUrl) {
      window.open(deepUrl || app.fallbackUrl, '_blank', 'noopener,noreferrer');
      return {
        success: true,
        appName: app.name,
        packageName: app.packageName,
        launchType: 'web_fallback',
        message: `Redirected to ${app.name} search fallback.`,
        actionType,
        searchQuery,
        deepUrl: deepUrl || app.fallbackUrl,
        deepScheme,
      };
    }

    return {
      success: false,
      appName: app.name,
      packageName: app.packageName,
      launchType: 'not_installed',
      message: `Failed to launch in-app action for ${app.name}: ${err?.message || 'Package error.'}`,
      actionType,
      searchQuery,
    };
  }
}

export function launchApp(app: AppItem): LaunchResult {
  return launchInAppAction(app, '', 'launch');
}

/**
 * Match an app name / alias from a text fragment
 */
export function findAppByQuery(queryStr: string): AppItem | null {
  const clean = queryStr.trim().toLowerCase();
  if (!clean) return null;

  const aliases: Record<string, string> = {
    'yt': 'youtube',
    'wa': 'whatsapp',
    'ig': 'instagram',
    'insta': 'instagram',
    'fb': 'facebook',
    'x': 'twitter',
    'tweet': 'twitter',
    'tg': 'telegram',
    'cam': 'camera',
    'calc': 'calculator',
    'mail': 'gmail',
    'email': 'gmail',
    'gmap': 'maps',
    'gmaps': 'maps',
    'location': 'maps',
    'navigator': 'maps',
    'web': 'chrome',
    'browser': 'chrome',
    'google': 'chrome',
    'store': 'playstore',
    'play store': 'playstore',
    'google play': 'playstore',
    'market': 'playstore',
    'gallery': 'photos',
    'alarm': 'clock',
    'timer': 'clock',
    'call': 'phone',
    'dialer': 'phone',
    'sms': 'messages',
    'text': 'messages',
    'file': 'files',
    'explorer': 'files',
    'music': 'spotify',
    'song': 'youtube',
    'shop': 'amazon',
    'git': 'github',
  };

  const directId = aliases[clean];
  if (directId) {
    const found = INSTALLED_APPS.find(a => a.id === directId);
    if (found) return found;
  }

  let bestMatch: AppItem | null = null;
  let highestScore = 0;

  for (const app of INSTALLED_APPS) {
    let score = 0;
    const nameLower = app.name.toLowerCase();
    const idLower = app.id.toLowerCase();

    if (nameLower === clean || idLower === clean) {
      score += 100;
    } else if (clean.includes(nameLower) || nameLower.includes(clean)) {
      score += 80;
    } else if (clean.includes(idLower) || idLower.includes(clean)) {
      score += 75;
    }

    for (const kw of app.keywords) {
      if (kw === clean) {
        score += 90;
      } else if (clean.split(/\s+/).includes(kw)) {
        score += 60;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = app;
    }
  }

  return highestScore >= 40 ? bestMatch : null;
}

/**
 * Gemini-Style Natural Language Deep In-App Action Parser
 * Examples:
 * - "open youtube and search song" -> App: YouTube, Action: search, Query: "song"
 * - "play despacito on youtube" -> App: YouTube, Action: play, Query: "despacito"
 * - "search taylor swift on spotify" -> App: Spotify, Action: search, Query: "taylor swift"
 * - "open chrome and search best laptops" -> App: Chrome, Action: search, Query: "best laptops"
 * - "find coffee shops in google maps" -> App: Maps, Action: navigate, Query: "coffee shops"
 * - "open whatsapp and send hello" -> App: WhatsApp, Action: message, Query: "hello"
 * - "open play store and search subway surfers" -> App: Play Store, Action: search, Query: "subway surfers"
 * - "open settings and search wifi" -> App: Settings, Action: setting, Query: "wifi"
 * - "open camera to take selfie" -> App: Camera, Action: camera_mode, Query: "selfie"
 * - "open calculator and calculate 25 * 40" -> App: Calculator, Action: calculate, Query: "25 * 40"
 */
export function parseInAppActionFromCommand(command: string): {
  matchedApp: AppItem | null;
  actionType: 'search' | 'play' | 'navigate' | 'message' | 'view' | 'calculate' | 'setting' | 'camera_mode' | 'launch';
  searchQuery: string;
  launchResult: LaunchResult | null;
  confidence: number;
} {
  const clean = command.trim();
  const lower = clean.toLowerCase();

  // Pattern 1: "open <app> and (search|play|find|listen to|watch|look for|type|calculate|show|navigate to|send message to) <query>"
  const pattern1 = lower.match(/^(?:can\s+you\s+|please\s+|hey\s+rishi\s+|rishi\s+|i\s+want\s+to\s+)?(?:open|launch|start|go\s+to)\s+([a-z0-9\s._-]+?)\s+(?:and|then|to)\s+(search\s+for|search|play|find|listen\s+to|watch|look\s+for|type|calculate|show|navigate\s+to|message|send\s+message\s+to|text)\s+(.+)$/i);
  if (pattern1) {
    const rawApp = pattern1[1].trim();
    const rawVerb = pattern1[2].trim().toLowerCase();
    const rawQuery = pattern1[3].trim().replace(/\s+(?:app|application|for\s+me|now|please|on\s+phone)$/i, '');

    const app = findAppByQuery(rawApp);
    if (app) {
      let actionType: 'search' | 'play' | 'navigate' | 'message' | 'calculate' | 'setting' | 'camera_mode' | 'launch' = 'search';
      if (rawVerb.includes('play') || rawVerb.includes('listen') || rawVerb.includes('watch')) actionType = 'play';
      else if (rawVerb.includes('navigate') || rawVerb.includes('find')) actionType = 'navigate';
      else if (rawVerb.includes('message') || rawVerb.includes('text') || rawVerb.includes('send')) actionType = 'message';
      else if (rawVerb.includes('calculate')) actionType = 'calculate';

      const result = launchInAppAction(app, rawQuery, actionType);
      return {
        matchedApp: app,
        actionType,
        searchQuery: rawQuery,
        launchResult: result,
        confidence: 0.95,
      };
    }
  }

  // Pattern 2: "(search|play|find|listen to|watch|look for|navigate to|look up) <query> (on|in|using|via|with|through) <app>"
  const pattern2 = lower.match(/^(?:can\s+you\s+|please\s+|hey\s+rishi\s+|rishi\s+)?(search\s+for|search|play|find|listen\s+to|watch|look\s+for|navigate\s+to|look\s+up)\s+(.+?)\s+(?:on|in|using|via|with|through)\s+([a-z0-9\s._-]+)$/i);
  if (pattern2) {
    const rawVerb = pattern2[1].trim().toLowerCase();
    const rawQuery = pattern2[2].trim();
    const rawApp = pattern2[3].trim().replace(/\s+(?:app|application|for\s+me|now|please|on\s+phone)$/i, '');

    const app = findAppByQuery(rawApp);
    if (app) {
      let actionType: 'search' | 'play' | 'navigate' | 'message' | 'calculate' | 'setting' | 'camera_mode' | 'launch' = 'search';
      if (rawVerb.includes('play') || rawVerb.includes('listen') || rawVerb.includes('watch')) actionType = 'play';
      else if (rawVerb.includes('navigate') || rawVerb.includes('find')) actionType = 'navigate';

      const result = launchInAppAction(app, rawQuery, actionType);
      return {
        matchedApp: app,
        actionType,
        searchQuery: rawQuery,
        launchResult: result,
        confidence: 0.95,
      };
    }
  }

  // Pattern 3: "in <app> (search|play|find|look for|open) <query>"
  const pattern3 = lower.match(/^(?:in|on)\s+([a-z0-9\s._-]+?)\s+(search\s+for|search|play|find|look\s+for|open)\s+(.+)$/i);
  if (pattern3) {
    const rawApp = pattern3[1].trim();
    const rawVerb = pattern3[2].trim().toLowerCase();
    const rawQuery = pattern3[3].trim().replace(/\s+(?:app|application|for\s+me|now|please)$/i, '');

    const app = findAppByQuery(rawApp);
    if (app) {
      const actionType = (rawVerb.includes('play') ? 'play' : rawVerb.includes('find') ? 'navigate' : 'search');
      const result = launchInAppAction(app, rawQuery, actionType);
      return {
        matchedApp: app,
        actionType,
        searchQuery: rawQuery,
        launchResult: result,
        confidence: 0.92,
      };
    }
  }

  // Pattern 4: "<app> (search|find|play) <query>"
  const pattern4 = lower.match(/^([a-z0-9._-]+)\s+(search|find|play|look\s+up)\s+(.+)$/i);
  if (pattern4) {
    const rawApp = pattern4[1].trim();
    const rawVerb = pattern4[2].trim().toLowerCase();
    const rawQuery = pattern4[3].trim();

    const app = findAppByQuery(rawApp);
    if (app && rawQuery.length > 0) {
      const actionType = rawVerb.includes('play') ? 'play' : 'search';
      const result = launchInAppAction(app, rawQuery, actionType);
      return {
        matchedApp: app,
        actionType,
        searchQuery: rawQuery,
        launchResult: result,
        confidence: 0.90,
      };
    }
  }

  // Fallback: Check if it's a simple open app command
  const simpleLaunch = parseAndLaunchAppFromCommand(command);
  if (simpleLaunch.matchedApp && simpleLaunch.confidence >= 0.35) {
    return {
      matchedApp: simpleLaunch.matchedApp,
      actionType: 'launch',
      searchQuery: '',
      launchResult: simpleLaunch.launchResult,
      confidence: simpleLaunch.confidence,
    };
  }

  return {
    matchedApp: null,
    actionType: 'launch',
    searchQuery: '',
    launchResult: null,
    confidence: 0,
  };
}

/**
 * AI Natural Language App Launcher Intent Resolver (Simple App Launch)
 */
export function parseAndLaunchAppFromCommand(command: string): {
  matchedApp: AppItem | null;
  launchResult: LaunchResult | null;
  confidence: number;
} {
  const clean = command.trim().toLowerCase();

  const appQuery = clean
    .replace(/^(?:can\s+you\s+|please\s+|could\s+you\s+|i\s+want\s+to\s+|rishi\s+|hey\s+rishi\s+|will\s+you\s+)?(?:open|launch|start|run|go\s+to|show\s+me|fire\s+up|load|bring\s+up|play)\s+(?:the\s+)?/i, '')
    .replace(/\s+(?:app|application|for\s+me|now|please|in\s+chat|directly|here|on\s+phone|mobile)$/i, '')
    .trim();

  const app = findAppByQuery(appQuery);
  if (app) {
    const launchResult = launchApp(app);
    return {
      matchedApp: app,
      launchResult,
      confidence: 0.9,
    };
  }

  return {
    matchedApp: null,
    launchResult: null,
    confidence: 0,
  };
}

