package com.andresarteaga.a.alas_chiquitanas_movil

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.widget.RemoteViews
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoWidgetModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("ExpoWidget")

        Function("updateWidgetData") { activeFires: Int, reports: Int ->
            val context = appContext.reactContext ?: return@Function
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
} 