package com.example.samplewebsdkapp

import android.webkit.JavascriptInterface

class JavaScriptInterface(protected var parentActivity: DeviceManagementActivity) {

    @JavascriptInterface
    fun getResponse(): String{
        return this.parentActivity.setResponse()
    }

    @JavascriptInterface
    fun getName(): String {
        return this.parentActivity.setName()
    }

    @JavascriptInterface
    fun getMeetingID(): String {
        return this.parentActivity.setMeetingID()
    }

    @JavascriptInterface
    fun getRegion(): String {
        return this.parentActivity.setRegion()
    }

    @JavascriptInterface
    fun setLeaving() {
        this.parentActivity.setLeaving()
    }

    @JavascriptInterface
    fun setEnding() {
        this.parentActivity.setEnding()
    }
}
