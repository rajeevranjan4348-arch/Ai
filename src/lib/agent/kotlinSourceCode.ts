// Raw Kotlin & XML Source Files for Gemini-Style Phone Control Agent

export interface KotlinFile {
  filename: string;
  language: string;
  description: string;
  code: string;
}

export const KOTLIN_SOURCE_FILES: KotlinFile[] = [
  {
    filename: 'AgentModels.kt',
    language: 'kotlin',
    description: 'Data classes defining ActionRequests, ScreenSnapshots, and Execution Results.',
    code: `package com.gemini.phoneagent.models

data class AgentCommand(
    val goal: String,
    val actions: List<ActionRequest>
)

data class ActionRequest(
    val type: String,
    val target: String? = null,
    val text: String? = null,
    val x: Float? = null,
    val y: Float? = null,
    val startX: Float? = null,
    val startY: Float? = null,
    val endX: Float? = null,
    val endY: Float? = null
)

data class ScreenSnapshot(
    val elements: List<ScreenElement>
)

data class ScreenElement(
    val text: String?,
    val description: String?,
    val clickable: Boolean,
    val editable: Boolean
)

sealed class AgentResult {
    data class Success(val message: String) : AgentResult()
    data class Failed(val message: String) : AgentResult()
}

data class ExecutionResult(
    val success: Boolean,
    val message: String
)`
  },
  {
    filename: 'AIAccessibilityService.kt',
    language: 'kotlin',
    description: 'Core Android AccessibilityService performing global actions (back, home, recents).',
    code: `package com.gemini.phoneagent.service

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent

class AIAccessibilityService : AccessibilityService() {

    companion object {
        var instance: AIAccessibilityService? = null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Screen/UI changed.
        // Agent inspects rootInActiveWindow.
    }

    override fun onInterrupt() {}

    override fun onDestroy() {
        instance = null
        super.onDestroy()
    }

    fun goBack(): Boolean {
        return performGlobalAction(GLOBAL_ACTION_BACK)
    }

    fun goHome(): Boolean {
        return performGlobalAction(GLOBAL_ACTION_HOME)
    }

    fun openRecents(): Boolean {
        return performGlobalAction(GLOBAL_ACTION_RECENTS)
    }
}`
  },
  {
    filename: 'ScreenReader.kt',
    language: 'kotlin',
    description: 'Traverses AccessibilityNodeInfo tree to capture active UI elements.',
    code: `package com.gemini.phoneagent.reader

import android.view.accessibility.AccessibilityNodeInfo
import com.gemini.phoneagent.models.ScreenElement
import com.gemini.phoneagent.models.ScreenSnapshot
import com.gemini.phoneagent.service.AIAccessibilityService

class ScreenReader {

    fun getCurrentScreen(): ScreenSnapshot {
        val service = AIAccessibilityService.instance
            ?: return ScreenSnapshot(emptyList())

        val root = service.rootInActiveWindow
            ?: return ScreenSnapshot(emptyList())

        val elements = mutableListOf<ScreenElement>()
        scan(root, elements)

        return ScreenSnapshot(elements)
    }

    private fun scan(
        node: AccessibilityNodeInfo,
        result: MutableList<ScreenElement>
    ) {
        val text = node.text?.toString()
        val description = node.contentDescription?.toString()

        if (!text.isNullOrBlank() || !description.isNullOrBlank()) {
            result.add(
                ScreenElement(
                    text = text,
                    description = description,
                    clickable = node.isClickable,
                    editable = node.isEditable
                )
            )
        }

        for (i in 0 until node.childCount) {
            node.getChild(i)?.let {
                scan(it, result)
            }
        }
    }
}`
  },
  {
    filename: 'NodeFinder.kt',
    language: 'kotlin',
    description: 'Finds clickable nodes by text or searches for editable input fields.',
    code: `package com.gemini.phoneagent.finder

import android.view.accessibility.AccessibilityNodeInfo

class NodeFinder {

    fun clickText(
        root: AccessibilityNodeInfo,
        target: String
    ): Boolean {
        val nodes = root.findAccessibilityNodeInfosByText(target)

        for (node in nodes) {
            if (node.isClickable) {
                return node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            }

            var parent = node.parent
            while (parent != null) {
                if (parent.isClickable) {
                    return parent.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                }
                parent = parent.parent
            }
        }

        return false
    }

    fun findEditable(
        root: AccessibilityNodeInfo
    ): AccessibilityNodeInfo? {
        if (root.isEditable) {
            return root
        }

        for (i in 0 until root.childCount) {
            val child = root.getChild(i) ?: continue
            val result = findEditable(child)
            if (result != null) {
                return result
            }
        }

        return null
    }
}`
  },
  {
    filename: 'TextController.kt',
    language: 'kotlin',
    description: 'Types text into editable fields via ACTION_SET_TEXT bundle.',
    code: `package com.gemini.phoneagent.controller

import android.os.Bundle
import android.view.accessibility.AccessibilityNodeInfo

class TextController {

    fun typeText(
        node: AccessibilityNodeInfo,
        text: String
    ): Boolean {
        val args = Bundle()
        args.putCharSequence(
            AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE,
            text
        )

        return node.performAction(
            AccessibilityNodeInfo.ACTION_SET_TEXT,
            args
        )
    }
}`
  },
  {
    filename: 'GestureController.kt',
    language: 'kotlin',
    description: 'Dispatches tap and swipe gestures via AccessibilityService dispatchGesture API.',
    code: `package com.gemini.phoneagent.controller

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path

class GestureController(
    private val service: AccessibilityService
) {

    fun tap(x: Float, y: Float) {
        val path = Path()
        path.moveTo(x, y)

        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 50))
            .build()

        service.dispatchGesture(gesture, null, null)
    }

    fun swipe(
        startX: Float,
        startY: Float,
        endX: Float,
        endY: Float,
        duration: Long = 500
    ) {
        val path = Path()
        path.moveTo(startX, startY)
        path.lineTo(endX, endY)

        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, duration))
            .build()

        service.dispatchGesture(gesture, null, null)
    }
}`
  },
  {
    filename: 'AppController.kt',
    language: 'kotlin',
    description: 'Launches target Android packages via Package Manager intents.',
    code: `package com.gemini.phoneagent.controller

import android.content.Context
import android.content.Intent

class AppController(
    private val context: Context
) {

    fun openApp(packageName: String): Boolean {
        val intent = context.packageManager
            .getLaunchIntentForPackage(packageName)
            ?: return false

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)

        return true
    }
}`
  },
  {
    filename: 'ActionValidator.kt',
    language: 'kotlin',
    description: 'Security whitelist validator for action safety compliance.',
    code: `package com.gemini.phoneagent.validator

import com.gemini.phoneagent.models.ActionRequest

class ActionValidator {

    private val allowedActions = setOf(
        "open_app",
        "back",
        "home",
        "recents",
        "click_text",
        "type_text",
        "scroll",
        "swipe",
        "wait"
    )

    fun isAllowed(action: ActionRequest): Boolean {
        if (action.type !in allowedActions) {
            return false
        }

        return when (action.type) {
            "open_app" -> !action.target.isNullOrBlank()
            "click_text" -> !action.text.isNullOrBlank()
            "type_text" -> !action.text.isNullOrBlank()
            else -> true
        }
    }
}`
  },
  {
    filename: 'ActionExecutor.kt',
    language: 'kotlin',
    description: 'Executes validated action requests using Android controllers.',
    code: `package com.gemini.phoneagent.executor

import android.content.Context
import com.gemini.phoneagent.controller.*
import com.gemini.phoneagent.finder.NodeFinder
import com.gemini.phoneagent.models.*
import com.gemini.phoneagent.service.AIAccessibilityService
import kotlinx.coroutines.delay

class ActionExecutor(
    private val context: Context,
    private val service: AIAccessibilityService
) {

    suspend fun execute(action: ActionRequest): ExecutionResult {
        return when (action.type) {
            "back" -> {
                val result = service.goBack()
                ExecutionResult(result, "Back pressed")
            }
            "home" -> {
                val result = service.goHome()
                ExecutionResult(result, "Home pressed")
            }
            "recents" -> {
                val result = service.openRecents()
                ExecutionResult(result, "Recents opened")
            }
            "open_app" -> {
                val packageName = resolvePackage(action.target)
                    ?: return ExecutionResult(false, "App not found")

                val result = AppController(context).openApp(packageName)
                ExecutionResult(result, "App opened")
            }
            "click_text" -> {
                val root = service.rootInActiveWindow
                    ?: return ExecutionResult(false, "Screen unavailable")

                val success = NodeFinder().clickText(root, action.text ?: "")
                ExecutionResult(success, if (success) "Element clicked" else "Element not found")
            }
            "type_text" -> {
                val root = service.rootInActiveWindow
                    ?: return ExecutionResult(false, "Screen unavailable")

                val node = NodeFinder().findEditable(root)
                    ?: return ExecutionResult(false, "Input field not found")

                val success = TextController().typeText(node, action.text ?: "")
                ExecutionResult(success, if (success) "Text entered" else "Could not type text")
            }
            "swipe" -> {
                val gesture = GestureController(service)
                gesture.swipe(
                    action.startX ?: 0f,
                    action.startY ?: 0f,
                    action.endX ?: 0f,
                    action.endY ?: 0f
                )
                ExecutionResult(true, "Swipe completed")
            }
            "wait" -> {
                delay(500)
                ExecutionResult(true, "Wait completed")
            }
            else -> ExecutionResult(false, "Unknown action")
        }
    }

    private fun resolvePackage(app: String?): String? {
        return when (app?.lowercase()) {
            "settings" -> "com.android.settings"
            "chrome" -> "com.android.chrome"
            "youtube" -> "com.google.android.youtube"
            "whatsapp" -> "com.whatsapp"
            "instagram" -> "com.instagram.android"
            "google maps" -> "com.google.android.apps.maps"
            else -> null
        }
    }
}`
  },
  {
    filename: 'PhoneControlAgent.kt',
    language: 'kotlin',
    description: 'Sequentially executes validated actions with short delay buffers.',
    code: `package com.gemini.phoneagent

import com.gemini.phoneagent.executor.ActionExecutor
import com.gemini.phoneagent.models.*
import com.gemini.phoneagent.validator.ActionValidator
import kotlinx.coroutines.delay

class PhoneControlAgent(
    private val executor: ActionExecutor,
    private val validator: ActionValidator
) {

    suspend fun execute(command: AgentCommand): AgentResult {
        for (action in command.actions) {
            if (!validator.isAllowed(action)) {
                return AgentResult.Failed("Action blocked")
            }

            val result = executor.execute(action)
            if (!result.success) {
                return AgentResult.Failed(result.message)
            }

            delay(300)
        }

        return AgentResult.Success("Task completed")
    }
}`
  },
  {
    filename: 'AgentLoop.kt',
    language: 'kotlin',
    description: 'Autonomous control loop: Reads screen -> Plans AI -> Executes -> Verifies.',
    code: `package com.gemini.phoneagent.loop

import com.gemini.phoneagent.PhoneControlAgent
import com.gemini.phoneagent.ai.AiEngine
import com.gemini.phoneagent.models.AgentResult
import com.gemini.phoneagent.reader.ScreenReader
import kotlinx.coroutines.delay

class AgentLoop(
    private val ai: AiEngine,
    private val screenReader: ScreenReader,
    private val agent: PhoneControlAgent
) {

    suspend fun run(userRequest: String): String {
        var iteration = 0

        while (iteration < 10) {
            iteration++

            val screen = screenReader.getCurrentScreen()
            val command = ai.plan(userRequest, screen)

            if (command.actions.isEmpty()) {
                return command.goal
            }

            val result = agent.execute(command)

            when (result) {
                is AgentResult.Success -> {
                    val newScreen = screenReader.getCurrentScreen()
                    if (ai.goalCompleted(userRequest, newScreen)) {
                        return result.message
                    }
                }
                is AgentResult.Failed -> {
                    return "I couldn't complete the task: \${result.message}"
                }
            }

            delay(700)
        }

        return "Task stopped because the action limit was reached."
    }
}`
  },
  {
    filename: 'AndroidManifest.xml',
    language: 'xml',
    description: 'Declares AccessibilityService binding permissions and BIND_ACCESSIBILITY_SERVICE filter.',
    code: `<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.RECORD_AUDIO"/>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>

    <application
        android:theme="@style/Theme.AI"
        android:label="My AI">

        <service
            android:name=".accessibility.AIAccessibilityService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="false">

            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService"/>
            </intent-filter>

            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config"/>

        </service>

    </application>

</manifest>`
  },
  {
    filename: 'accessibility_service_config.xml',
    language: 'xml',
    description: 'XML configuration defining event types, feedback generic, and gesture capability.',
    code: `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeAllMask"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:canRetrieveWindowContent="true"
    android:canPerformGestures="true"
    android:notificationTimeout="100"
    android:description="@string/app_name"/>`
  }
];
