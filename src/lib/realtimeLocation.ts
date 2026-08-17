// ============================================================
// REAL-TIME + LOCATION ACCESS FOR YOUR AI
// ============================================================

export type LocationData = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export type RuntimeContext = {
  location: LocationData | null;
  timestamp: string;
  timezone: string;
  online: boolean;
};

// ---------------- LOCATION ACCESS ----------------

export async function getUserLocation(): Promise<LocationData | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    console.warn("Geolocation is not supported");
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.warn("Location permission denied/unavailable:", error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  });
}

// ---------------- REAL-TIME CONTEXT ----------------

export async function getRuntimeContext(): Promise<RuntimeContext> {
  const location = await getUserLocation();

  return {
    location,
    timestamp: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  };
}

// ---------------- LIVE WEB SEARCH ----------------

export async function realtimeSearch(query: string) {
  // Backend exposes /api/search
  const response = await fetch("/api/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
    }),
  });

  if (!response.ok) {
    throw new Error("Realtime search failed");
  }

  return await response.json();
}

// ---------------- AI TOOL ROUTER ----------------

export async function runAITools(userMessage: string) {
  const context = await getRuntimeContext();

  const lower = userMessage.toLowerCase();

  const needsRealtime =
    /today|latest|current|now|live|recent|news|weather|price|score|near me|nearby/.test(
      lower
    );

  const needsLocation =
    /where am i|my location|near me|nearby|around me|closest|local/.test(
      lower
    );

  let searchResults = null;

  if (needsRealtime) {
    try {
      searchResults = await realtimeSearch(userMessage);
    } catch (err) {
      console.warn("Realtime search warning:", err);
    }
  }

  return {
    userMessage,

    runtime: {
      timestamp: context.timestamp,
      timezone: context.timezone,
      online: context.online,
    },

    location: needsLocation
      ? context.location
      : null,

    realtime: needsRealtime
      ? {
          enabled: true,
          results: searchResults,
        }
      : {
          enabled: false,
        },
  };
}

// ---------------- CHAT REQUEST ----------------

export async function sendMessageToAI(userMessage: string) {
  const toolContext = await runAITools(userMessage);

  const response = await fetch("/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: userMessage,
      tools: toolContext,
    }),
  });

  if (!response.ok) {
    throw new Error("AI request failed");
  }

  return await response.json();
}

// ---------------- LOCATION PERMISSION UI ----------------

export async function requestLocationAccess() {
  const location = await getUserLocation();

  if (location) {
    console.log("Location access granted:", location);
    localStorage.setItem("locationAccess", "granted");
    return true;
  }

  localStorage.setItem("locationAccess", "denied");
  return false;
}

// ---------------- ONLINE/OFFLINE STATE ----------------

if (typeof window !== 'undefined') {
  window.addEventListener("online", () => {
    console.log("🌐 AI is online");
  });

  window.addEventListener("offline", () => {
    console.log("⚠️ AI is offline");
  });
}
