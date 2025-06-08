package com.andresarteaga.a.alas_chiquitanas_movil

import android.app.Application
import com.facebook.react.ReactPackage
import com.facebook.react.shell.MainReactPackage

class PackageList(private val application: Application) {
    val packages: MutableList<ReactPackage>
        get() {
            return mutableListOf<ReactPackage>().apply {
                add(MainReactPackage())
                add(WidgetPackage())
            }
        }
} 