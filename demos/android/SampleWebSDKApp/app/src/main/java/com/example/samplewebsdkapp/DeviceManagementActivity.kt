package com.example.samplewebsdkapp

import android.Manifest
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.os.Build
import android.annotation.TargetApi
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.webkit.*
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import android.widget.Toast

class DeviceManagementActivity : AppCompatActivity() {

    lateinit var myWebView: WebView
    lateinit var json: String

    private val WEBRTC_PERM = arrayOf<String>(
        Manifest.permission.MODIFY_AUDIO_SETTINGS,
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.CAMERA
    )
    private val WEBRTC_PERMISSION_REQUEST_CODE = 1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_device_management)
        supportActionBar?.setDisplayHomeAsUpEnabled(false)
        supportActionBar?.setHomeButtonEnabled(false)

        if (intent.hasExtra("json")) {
            json = (intent.getStringExtra("json"))
        }

        if (!hasPermissionsAlready()) {
            ActivityCompat.requestPermissions(this, WEBRTC_PERM, WEBRTC_PERMISSION_REQUEST_CODE)
        } else {
            myWebView = findViewById<WebView>(R.id.webView)
            myWebView.setVerticalScrollBarEnabled(false);
            myWebView.setHorizontalScrollBarEnabled(false);
            setUpWebViewDefaults()
            myWebView.setWebViewClient(WebViewClient())
            if (savedInstanceState == null) {
                myWebView.loadUrl(getString(R.string.test_url))
            }
            myWebView.addJavascriptInterface(JavaScriptInterface(this), "ChimeSDK")

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                WebView.setWebContentsDebuggingEnabled(true);
            }
        }
    }

    public override fun onPause() {
        myWebView.onPause()
        myWebView.pauseTimers()
        super.onPause()
    }

    public override fun onResume() {
        super.onResume()
        myWebView.resumeTimers()
        myWebView.onResume()
    }

    override fun onDestroy() {
        myWebView.destroy()
        super.onDestroy()
    }

    override fun onBackPressed() {
        if (myWebView.canGoBack()) {
            super.onBackPressed()
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        myWebView.saveState(outState)
    }

    override fun onRestoreInstanceState(savedInstanceState: Bundle) {
        super.onRestoreInstanceState(savedInstanceState)
        myWebView.restoreState(savedInstanceState)
    }

    private fun hasPermissionsAlready(): Boolean {
        for (permission in WEBRTC_PERM) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    permission
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                return false
            }
        }
        return true
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissionsList: Array<String>,
        grantResults: IntArray
    ) {
        val toast: Toast
        when (requestCode) {
            WEBRTC_PERMISSION_REQUEST_CODE -> {
                if (grantResults.size > 0) {
                    for (result in grantResults) {
                        if (result != PackageManager.PERMISSION_GRANTED) {
                            toast = Toast.makeText(
                                this,
                                "WebRTC cannot work without permissions",
                                Toast.LENGTH_LONG
                            )
                            toast.show()
                            return
                        }
                    }
                    myWebView = findViewById<WebView>(R.id.webView)
                    setUpWebViewDefaults()
                    myWebView.setWebViewClient(WebViewClient())
                    myWebView.loadUrl(getString(R.string.test_url))
                    myWebView.addJavascriptInterface(JavaScriptInterface(this), "ChimeSDK")

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                        WebView.setWebContentsDebuggingEnabled(true);
                    }

                } else {
                    toast = Toast.makeText(
                        this,
                        "WebRTC cannot work without permissions",
                        Toast.LENGTH_LONG
                    )
                    toast.show()
                    finishActivity(0)
                }
            }
        }
    }

    @TargetApi(Build.VERSION_CODES.LOLLIPOP)
    private fun setUpWebViewDefaults() {
        val settings = myWebView.getSettings()
        settings.setJavaScriptEnabled(true)
        settings.setDomStorageEnabled(true)
        settings.setDatabaseEnabled(true)
        settings.setMediaPlaybackRequiresUserGesture(false)
        myWebView.setWebChromeClient(object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {

                this@DeviceManagementActivity.runOnUiThread(Runnable { request.grant(request.resources) })

            }
        })

        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptThirdPartyCookies(myWebView, true)
    }

    fun setResponse(): String {
        return this.json
    }

    fun setName(): String {
       return intent.getStringExtra("name")
    }

    fun setMeetingID(): String {
        return intent.getStringExtra("meetingID")
    }

    fun setRegion(): String {
        return intent.getStringExtra("region")
    }

    fun setLeaving() {
        setResult(Activity.RESULT_OK)
        finish()
    }

    fun setEnding() {
        val data = Intent()
        data.putExtra("meetingID", setMeetingID())
        setResult(Activity.RESULT_FIRST_USER, data)
        finish()
    }
 }
