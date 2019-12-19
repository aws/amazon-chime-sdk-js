package com.example.samplewebsdkapp

import android.app.Activity
import android.content.Intent
import android.content.res.Resources
import android.os.AsyncTask
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import kotlinx.android.synthetic.main.activity_main.*
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.lang.ref.WeakReference
import java.net.HttpURLConnection
import java.net.URL
import android.widget.Toast

const val MEETING_REQUEST = 1

class MainActivity : AppCompatActivity() {

    var meetingText: EditText? = null
    var nameText: EditText? = null
    var continueButton: Button? = null
    var authenticationProgressBar: ProgressBar? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        meetingText = findViewById<EditText>(R.id.editMeetingId)
        nameText = findViewById<EditText>(R.id.editName)
        continueButton = findViewById<Button>(R.id.buttonContinue)
        buttonContinue!!.setOnClickListener{ joinMeeting() }
        authenticationProgressBar = findViewById<ProgressBar>(R.id.progressAuthentication)
    }

    fun joinMeeting() {

        var meetingID = meetingText?.text.toString().trim().replace("\\s+".toRegex(), "+")
        var yourName = nameText?.text.toString().trim().replace("\\s+".toRegex(), "+")

        if (meetingID == "") {
            Toast.makeText(this, "Meeting ID is invalid", Toast.LENGTH_LONG).show()
        } else if (yourName == "") {
            Toast.makeText(this, "Name is invalid", Toast.LENGTH_LONG).show()
        } else {
            val authenticationAsyncTask = AuthenticationAsyncTask(this)
            authenticationAsyncTask.execute(getString(R.string.test_url), meetingID, yourName)
        }
    }

    companion object {
        class AuthenticationAsyncTask(context: MainActivity) : AsyncTask<String, Integer, String> () {
            private var resp: String? = null
            private val activityReference: WeakReference<MainActivity> = WeakReference(context)

            override fun onPreExecute() {
                super.onPreExecute()
                activityReference.get()!!.authenticationProgressBar!!.visibility = View.VISIBLE
            }

            override fun doInBackground(vararg params: String): String? {
                var url: String = params[0]
                var meetingID: String = params[1]
                var name: String = params[2]

                var region = "us-east-1"

                var jsonParam = "join?title=" + meetingID + "&name=" + name + "&region=" + region
                var serverUrl = URL(url + jsonParam)

                try {
                    lateinit var jsonObject: JSONObject
                    with(serverUrl.openConnection() as HttpURLConnection) {
                        requestMethod = "POST"
                        doInput = true
                        doOutput = true

                        BufferedReader(InputStreamReader(inputStream)).use {
                            val response = StringBuffer()

                            var inputLine = it.readLine()
                            while (inputLine != null) {
                                response.append(inputLine)
                                inputLine = it.readLine()
                            }
                            it.close()

                            jsonObject = JSONObject(response.toString())
                            println("Response: ${jsonObject}")
                        }

                        if (responseCode != 200) {
                            return responseCode.toString()
                        } else {
                            resp = responseCode.toString()
                        }
                    }

                    if (jsonObject != null) {
                        val mainActivity = activityReference.get()
                        val intent = Intent(mainActivity, DeviceManagementActivity::class.java)
                        intent.putExtra("json", jsonObject.toString())
                        intent.putExtra("name", name)
                        intent.putExtra("meetingID", meetingID)
                        intent.putExtra("region", region)
                        mainActivity!!.startActivityForResult(intent, MEETING_REQUEST)
                    }

                } catch (e : Exception) {
                    println(e)
                }
                return resp
            }

            override fun onPostExecute(result: String?) {
                super.onPostExecute(result)
                if (result != "200") {
                    Toast.makeText(activityReference.get(), "Unable to find meeting", Toast.LENGTH_LONG).show()
                }
                activityReference.get()!!.authenticationProgressBar!!.visibility = View.INVISIBLE
            }
        }

        class EndingAsyncTask(context: MainActivity) : AsyncTask<String, Integer, String>() {

            private var resp: String? = null
            private val activityReference: WeakReference<MainActivity> = WeakReference(context)

            override fun onPreExecute() {
                super.onPreExecute()
                activityReference.get()!!.authenticationProgressBar!!.visibility = View.VISIBLE
                Toast.makeText(activityReference.get(), "Ending the meeting", Toast.LENGTH_LONG).show()
            }

            override fun doInBackground(vararg params: String): String? {
                var url: String = params[0]
                var meetingID: String = params[1]

                var jsonParam = "end?title=" + meetingID
                var serverUrl = URL(url + jsonParam)

                println("Before Ending Request + ${jsonParam}")
                try {
                    lateinit var jsonObject: JSONObject

                    with(serverUrl.openConnection() as HttpURLConnection) {
                        requestMethod = "POST"
                        doInput = true
                        doOutput = true

                        BufferedReader(InputStreamReader(inputStream)).use {
                            val response = StringBuffer()

                            var inputLine = it.readLine()
                            while (inputLine != null) {
                                response.append(inputLine)
                                inputLine = it.readLine()
                            }
                            it.close()

                            jsonObject = JSONObject(response.toString())
                            println("Response: ${jsonObject}")
                        }
                    }
                    println("After sending POST")

                } catch (e : Exception) {
                    println(e)
                    println("Catch Ending Error")
                }
                return resp
            }

            override fun onPostExecute(result: String?) {
                super.onPostExecute(result)
                activityReference.get()!!.authenticationProgressBar!!.visibility = View.INVISIBLE
            }
        }
    }

    public override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == MEETING_REQUEST) {
            if (resultCode == Activity.RESULT_FIRST_USER) {
                val endAsyncTask = EndingAsyncTask(this)
                val meetingID = data?.getStringExtra("meetingID")
                endAsyncTask.execute(getString(R.string.test_url), meetingID)
            }
        }
    }
}
