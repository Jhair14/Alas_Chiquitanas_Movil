package com.andresarteaga.a.alas_chiquitanas_movil

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.widget.RemoteViews
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = WidgetModule.NAME)
class WidgetModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        const val NAME = "WidgetModule"
    }

    override fun getName() = NAME

    @ReactMethod
    fun updateWidgetData(activeFires: Int, reports: Int) {
        val context = reactApplicationContext
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val widgetComponent = ComponentName(context, FireReportWidget::class.java)
        val widgetIds = appWidgetManager.getAppWidgetIds(widgetComponent)

        for (widgetId in widgetIds) {
            val views = RemoteViews(context.packageName, R.layout.fire_report_widget)
            views.setTextViewText(R.id.active_fires_count, activeFires.toString())
            views.setTextViewText(R.id.reports_count, reports.toString())
            appWidgetManager.updateAppWidget(widgetId, views)
        }
    }
} 